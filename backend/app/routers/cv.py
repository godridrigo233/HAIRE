"""Endpoints de CV: upload, análisis con IA y scoring simple."""
from __future__ import annotations

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

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Curriculum,
    CurriculumHabilidad,
    Evaluacion,
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
    if archivo.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    vacante = db.get(Vacante, id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    contenido = archivo.file.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(contenido) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 10MB")

    # Extracción de texto
    try:
        texto = pdf_service.extraer_texto_de_pdf(contenido)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"No se pudo leer el PDF: {exc}")

    # Subida a Supabase Storage
    try:
        url = storage_service.subir_cv(contenido, archivo.filename or "cv.pdf")
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
    print("DEBUG: Iniciando upload_cv")
    """Recibe un PDF, extrae su texto, lo sube a Storage y crea el curriculummm."""

    if archivo.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    vacante = db.get(Vacante, id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    contenido = archivo.file.read()
    print(f"DEBUG: Archivo leído, tamaño: {len(contenido)} bytes")
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(contenido) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 10MB")

    # Extracción de texto
    try:
        texto = pdf_service.extraer_texto_de_pdf(contenido)
        print("DEBUG: Texto extraído exitosamente")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"No se pudo leer el PDF: {exc}")

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
            apellidos=apellidos or "(sin apellido)",
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
