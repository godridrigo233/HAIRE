"""Endpoint de detalle de un candidato evaluado: GET /candidatos/{id_evaluacion}."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Usuario
from app.schemas import CandidatoOut
from app.services.candidatos_service import obtener_candidato

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
