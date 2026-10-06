"""Endpoint de detalle de un candidato evaluado: GET /candidatos/{id_evaluacion}."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Usuario, Evaluacion, Curriculum, Postulante, CurriculumHabilidad, PromptLog, Vacante
from app.schemas import CandidatoOut
from app.services.candidatos_service import obtener_candidato
from app.services import storage_service

router = APIRouter(prefix="/candidatos", tags=["candidatos"])


@router.get("/{id_evaluacion}", response_model=CandidatoOut)
def detalle_candidato(
    id_evaluacion: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CandidatoOut:
    candidato = obtener_candidato(db, id_evaluacion)
    if candidato is None:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    return candidato


@router.delete("/{id_evaluacion}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def eliminar_candidato(
    id_evaluacion: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> None:
    """Elimina la evaluación de un candidato (y su curriculum y postulante si no tiene más evaluaciones)."""
    evaluacion = db.scalar(select(Evaluacion).where(Evaluacion.id_evaluacion == id_evaluacion))
    if evaluacion is None:
        raise HTTPException(status_code=404, detail="Evaluacion no encontrada")

    curriculum = db.scalar(select(Curriculum).where(Curriculum.id_curriculum == evaluacion.id_curriculum))
    vacante = db.scalar(select(Vacante).where(Vacante.id_vacante == evaluacion.id_vacante))

    if vacante is None or vacante.id_usuario != usuario.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este candidato")

    # Guardar URL antes de borrar el curriculum
    pdf_url = curriculum.archivo_pdf_url if curriculum else None
    id_postulante = curriculum.id_postulante if curriculum else None

    # Borrar registros relacionados
    db.query(CurriculumHabilidad).filter(CurriculumHabilidad.id_curriculum == evaluacion.id_curriculum).delete(synchronize_session=False)
    db.query(PromptLog).filter(PromptLog.id_evaluacion == evaluacion.id_evaluacion).delete(synchronize_session=False)
    db.query(Evaluacion).filter(Evaluacion.id_evaluacion == evaluacion.id_evaluacion).delete(synchronize_session=False)

    # Borrar curriculum
    db.query(Curriculum).filter(Curriculum.id_curriculum == evaluacion.id_curriculum).delete(synchronize_session=False)

    # Si el postulante no tiene más curriculums, eliminarlo también
    if id_postulante is not None:
        otros_cvs = db.scalar(
            select(func.count(Curriculum.id_curriculum)).where(
                Curriculum.id_postulante == id_postulante
            )
        ) or 0
        if otros_cvs == 0:
            db.query(Postulante).filter(Postulante.id_postulante == id_postulante).delete(synchronize_session=False)

    db.commit()

    # Intentar borrar de Storage (no bloqueante)
    if pdf_url:
        try:
            storage_service.eliminar_cv(pdf_url)
        except Exception:
            pass

    return None


_ETAPAS_VALIDAS = {"nuevo", "en_revision", "entrevista", "oferta", "contratado", "rechazado"}


@router.patch("/{id_evaluacion}/etapa", response_model=CandidatoOut)
def cambiar_etapa(
    id_evaluacion: UUID,
    etapa: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CandidatoOut:
    """Cambia la etapa del pipeline de un candidato."""
    if etapa not in _ETAPAS_VALIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Etapa inválida. Valores permitidos: {', '.join(sorted(_ETAPAS_VALIDAS))}",
        )
    evaluacion = db.scalar(select(Evaluacion).where(Evaluacion.id_evaluacion == id_evaluacion))
    if evaluacion is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    vacante = db.scalar(select(Vacante).where(Vacante.id_vacante == evaluacion.id_vacante))
    if vacante is None or vacante.id_usuario != usuario.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este candidato")

    evaluacion.estado_aprobacion = etapa
    db.commit()

    candidato = obtener_candidato(db, id_evaluacion)
    if candidato is None:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    return candidato

