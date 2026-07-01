"""Endpoints de vacantes: POST /vacantes, GET /vacantes, GET /vacantes/{id}."""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Curriculum, Usuario, Vacante, VacanteRequerimiento
from app.schemas import CandidatoOut, RequerimientoOut, VacanteCreate, VacanteOut
from app.services.candidatos_service import listar_candidatos_de_vacante
from app.services.skills_service import obtener_o_crear_habilidad

router = APIRouter(prefix="/vacantes", tags=["vacantes"])


def _contar_candidatos(db: Session, id_vacante) -> int:
    return db.scalar(
        select(func.count(Curriculum.id_curriculum)).where(
            Curriculum.id_vacante == id_vacante
        )
    ) or 0


def _a_salida(vacante: Vacante, total_candidatos: int = 0) -> VacanteOut:
    return VacanteOut(
        id_vacante=vacante.id_vacante,
        id_usuario=vacante.id_usuario,
        titulo_puesto=vacante.titulo_puesto,
        descripcion=vacante.descripcion,
        experiencia_minima_anios=vacante.experiencia_minima_anios,
        estado_activo=vacante.estado_activo,
        fecha_creacion=vacante.fecha_creacion,
        requerimientos=[
            RequerimientoOut(
                id_habilidad=r.id_habilidad,
                nombre=r.habilidad.nombre,
                es_obligatoria=r.es_obligatoria,
            )
            for r in vacante.requerimientos
        ],
        total_candidatos=total_candidatos,
    )


@router.post("", response_model=VacanteOut, status_code=status.HTTP_201_CREATED)
def crear_vacante(
    datos: VacanteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> VacanteOut:
    vacante = Vacante(
        id_usuario=usuario.id_usuario,
        titulo_puesto=datos.titulo_puesto,
        descripcion=datos.descripcion,
        experiencia_minima_anios=datos.experiencia_minima_anios,
        estado_activo=True,
    )
    db.add(vacante)
    db.flush()  # asigna id_vacante

    for req in datos.requerimientos:
        habilidad = obtener_o_crear_habilidad(db, req.nombre)
        db.add(
            VacanteRequerimiento(
                id_vacante=vacante.id_vacante,
                id_habilidad=habilidad.id_habilidad,
                es_obligatoria=req.es_obligatoria,
            )
        )

    db.commit()
    db.refresh(vacante)
    return _a_salida(vacante, total_candidatos=0)


@router.get("", response_model=List[VacanteOut])
def listar_vacantes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> List[VacanteOut]:
    """Lista las vacantes del usuario autenticado, más recientes primero."""
    vacantes = db.scalars(
        select(Vacante)
        .options(
            selectinload(Vacante.requerimientos).selectinload(
                VacanteRequerimiento.habilidad
            )
        )
        .where(Vacante.id_usuario == usuario.id_usuario)
        .order_by(Vacante.fecha_creacion.desc())
    ).all()
    return [_a_salida(v, _contar_candidatos(db, v.id_vacante)) for v in vacantes]


@router.get("/{id_vacante}", response_model=VacanteOut)
def obtener_vacante(
    id_vacante: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> VacanteOut:
    vacante = db.scalar(
        select(Vacante)
        .options(
            selectinload(Vacante.requerimientos).selectinload(
                VacanteRequerimiento.habilidad
            )
        )
        .where(Vacante.id_vacante == id_vacante)
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return _a_salida(vacante, _contar_candidatos(db, id_vacante))


@router.get("/{id_vacante}/candidatos", response_model=List[CandidatoOut])
def candidatos_de_vacante(
    id_vacante: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> List[CandidatoOut]:
    """Ranking de candidatos evaluados de la vacante, ordenados por % desc."""
    return listar_candidatos_de_vacante(db, id_vacante)
