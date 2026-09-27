"""Endpoints de CV: upload, análisis con IA y scoring simple."""
from __future__ import annotations
import re
import unicodedata
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Curriculum,
    CurriculumHabilidad,
    Evaluacion,
    Habilidad,
    Postulante,
    PromptLog,
    Usuario,
    Vacante,
    VacanteRequerimiento,
)
from app.schemas import (
    AnalizarResponse,
    CurriculumOut,
    EvaluacionOut,
    HabilidadDetectada,
    ScoringResponse,
    UploadResponse,
)
from app.services import groq_service, pdf_service, storage_service
from app.services.scoring_service import calcular_scoring_simple
from app.services.skills_service import obtener_o_crear_habilidad

router = APIRouter(prefix="/cv", tags=["cv"])

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB (límite del bucket `cv`)
_MAX_CARACTERES_CV = 40000     # ~10 a 15 páginas de texto puro como máximo

logger = logging.getLogger("haire.cv")

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_cv(
    id_vacante: UUID = Form(...),
    archivo: UploadFile = File(...),
    nombres: Optional[str] = Form(None),
    apellidos: Optional[str] = Form(None),
    correo: Optional[str] = Form(None),
    telefono: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> UploadResponse:
    """Recibe un PDF, extrae su texto, lo sube a Storage y crea el curriculum."""
    logger.debug("Iniciando upload_cv")

    if archivo.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    vacante = db.get(Vacante, id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    contenido = archivo.file.read()
    logger.debug(f"Archivo leído, tamaño: {len(contenido)} bytes")
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(contenido) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 10MB")
        
    # 1. Extracción de texto primero para que la variable 'texto' exista
    try:
        texto = pdf_service.extraer_texto_de_pdf(contenido)
        logger.debug(f"Texto extraído exitosamente. Total caracteres: {len(texto)}")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"No se pudo leer el PDF: {exc}")

    # 2. Ahora sí, validamos el volumen de texto de forma segura
    if len(texto) > _MAX_CARACTERES_CV:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El documento contiene un volumen de texto inusual ({len(texto)} caracteres). "
                f"Por motivos de seguridad, el límite máximo permitido es de {_MAX_CARACTERES_CV} caracteres."
            )
        )

    # Limpiar el nombre del archivo (Supabase rechaza espacios y tildes en las keys)
    nombre_original = archivo.filename or "cv.pdf"
    nombre_sin_tildes = unicodedata.normalize('NFKD', nombre_original).encode('ASCII', 'ignore').decode('utf-8')
    nombre_limpio = re.sub(r'[^\w\.-]', '_', nombre_sin_tildes)

    # Subida a Supabase Storage con el nombre limpio
    try:
        url = storage_service.subir_cv(contenido, nombre_limpio)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al subir a Storage: {exc}")

    # Postulante: reusar por correo si viene, si no crear uno
    postulante: Optional[Postulante] = None
    if correo:
        postulante = db.scalar(select(Postulante).where(Postulante.correo == correo))
    if postulante is None:
        postulante = Postulante(
            nombres=nombres or "Candidato sin nombre",
            apellidos=apellidos or "(sin apellido)",  # DB exige apellidos NOT NULL
            correo=correo,
            telefono=telefono,
        )
        db.add(postulante)
        db.flush()

    curriculum = Curriculum(
        id_postulante=postulante.id_postulante,
        id_vacante=id_vacante,
        archivo_pdf_url=url,
        peso_archivo_kb=len(contenido) // 1024,
        texto_plano_extraido=texto,
        estado_lectura="pendiente",
    )
    db.add(curriculum)
    db.commit()
    db.refresh(curriculum)

    return UploadResponse(
        curriculum=CurriculumOut.model_validate(curriculum),
        texto_preview=texto[:150],
        caracteres_extraidos=len(texto),
    )


@router.post("/{id_curriculum}/analizar", response_model=AnalizarResponse)
def analizar_cv(
    id_curriculum: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> AnalizarResponse:
    """Manda el texto del CV + requisitos a Groq, valida el JSON y persiste todo."""
    curriculum = db.get(Curriculum, id_curriculum)
    if curriculum is None:
        raise HTTPException(status_code=404, detail="Curriculum no encontrado")
    if not curriculum.texto_plano_extraido:
        raise HTTPException(
            status_code=400, detail="El curriculum no tiene texto extraído"
        )

    vacante = db.get(Vacante, curriculum.id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante asociada no encontrada")

    # Requisitos de la vacante, separados por obligatoriedad
    reqs = db.execute(
        select(VacanteRequerimiento.es_obligatoria, VacanteRequerimiento.id_habilidad)
        .where(VacanteRequerimiento.id_vacante == vacante.id_vacante)
    ).all()


    nombres_por_id = dict(
        db.execute(select(Habilidad.id_habilidad, Habilidad.nombre)).all()
    )
    obligatorias = [nombres_por_id[h] for ob, h in reqs if ob and h in nombres_por_id]
    opcionales = [nombres_por_id[h] for ob, h in reqs if not ob and h in nombres_por_id]

    # Llamada al LLM (Groq)
    try:
        resultado = groq_service.analizar_cv(
            texto_cv=curriculum.texto_plano_extraido,
            titulo=vacante.titulo_puesto,
            experiencia_minima=vacante.experiencia_minima_anios,
            requeridas_obligatorias=obligatorias,
            requeridas_opcionales=opcionales,
        )
    except Exception as exc:
        curriculum.estado_lectura = "error_lectura"
        db.commit()
        raise HTTPException(status_code=502, detail=f"Error al analizar con IA: {exc}")

    analisis = resultado.analisis
    if not analisis.es_cv:
        curriculum.estado_lectura = "descartado"
        db.commit()
        mensaje_error = analisis.justificacion_descarte or "El documento subido no es un Currículum Vitae válido."
        # --- ELIMINACIÓN AUTOMÁTICA ---
        try:
            storage_service.eliminar_cv(curriculum.archivo_pdf_url)
            logger.debug(f"Archivo basura eliminado: {curriculum.archivo_pdf_url}")
        except Exception as e:
            logger.debug(f"Error al intentar borrar archivo basura: {e}")
        # -------------------------------
        raise HTTPException(
            status_code=400,
            detail=f"DOCUMENTO_INVALIDO: {mensaje_error}"
        )

    # Completar datos del postulante con lo que extrajo la IA del CV
    postulante = db.get(Postulante, curriculum.id_postulante)
    if postulante is not None:
        if analisis.nombre_candidato and (
            not postulante.nombres or postulante.nombres == "Candidato sin nombre"
        ):
            partes = analisis.nombre_candidato.strip().split()
            postulante.nombres = partes[0]
            postulante.apellidos = " ".join(partes[1:]) or "(sin apellido)"
        if analisis.correo and not postulante.correo:
            postulante.correo = analisis.correo
        if analisis.telefono and not postulante.telefono:
            postulante.telefono = analisis.telefono

    # Persistir evaluación
    evaluacion = Evaluacion(
        id_curriculum=curriculum.id_curriculum,
        id_vacante=vacante.id_vacante,
        porcentaje_compatibilidad=Decimal(str(analisis.porcentaje_compatibilidad)),
        es_recomendado=analisis.es_recomendado,
        justificacion_ia=analisis.justificacion,
        estado_aprobacion="pendiente",
    )
    db.add(evaluacion)
    db.flush()

    # Persistir habilidades detectadas (get-or-create en el catálogo)
    for hab in analisis.habilidades_detectadas:
        habilidad = obtener_o_crear_habilidad(db, hab.nombre)
        db.add(
            CurriculumHabilidad(
                id_curriculum=curriculum.id_curriculum,
                id_habilidad=habilidad.id_habilidad,
                nivel_detectado=hab.nivel_detectado,
            )
        )

    # Traza de la llamada al LLM
    db.add(
        PromptLog(
            id_evaluacion=evaluacion.id_evaluacion,
            tipo_prompt="analisis_cv",
            prompt_enviado=resultado.prompt_enviado,
            respuesta_cruda=resultado.respuesta_cruda,
            modelo_usado=resultado.modelo_usado,
            tiempo_respuesta_ms=resultado.tiempo_respuesta_ms,
        )
    )

    curriculum.estado_lectura = "procesado"
    db.commit()
    db.refresh(evaluacion)

    return AnalizarResponse(
        evaluacion=EvaluacionOut.model_validate(evaluacion),
        habilidades_detectadas=[
            HabilidadDetectada(nombre=h.nombre, nivel_detectado=h.nivel_detectado)
            for h in analisis.habilidades_detectadas
        ],
        modelo_usado=resultado.modelo_usado,
        tiempo_respuesta_ms=resultado.tiempo_respuesta_ms,
    )


@router.get("/{id_curriculum}/scoring", response_model=ScoringResponse)
def scoring_simple(
    id_curriculum: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ScoringResponse:
    """Score determinista (sin IA): habilidades del CV vs requisitos de su vacante."""
    curriculum = db.get(Curriculum, id_curriculum)
    if curriculum is None:
        raise HTTPException(status_code=404, detail="Curriculum no encontrado")
    return calcular_scoring_simple(db, id_curriculum, curriculum.id_vacante)