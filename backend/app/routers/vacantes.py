"""Endpoints de vacantes: POST /vacantes, GET /vacantes, GET /vacantes/{id}."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Curriculum, Habilidad, Usuario, Vacante, VacanteRequerimiento
from app.schemas import (
    CandidatoOut,
    PaginatedCandidatos,
    PaginatedVacantes,
    RequerimientoOut,
    VacanteCreate,
    VacanteOut,
    VacanteUpdate,
)
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


@router.patch("/{id_vacante}", response_model=VacanteOut)
def actualizar_vacante(
    id_vacante: UUID,
    estado_activo: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> VacanteOut:
    """Actualiza el estado de una vacante (activa/cerrada). Solo el dueño puede modificarla."""
    vacante = db.scalar(
        select(Vacante).where(Vacante.id_vacante == id_vacante)
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    if vacante.id_usuario != usuario.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta vacante")
        
    vacante.estado_activo = estado_activo
    db.commit()
    db.refresh(vacante)
    return _a_salida(vacante, _contar_candidatos(db, id_vacante))


@router.put("/{id_vacante}", response_model=VacanteOut)
def editar_vacante(
    id_vacante: UUID,
    datos: VacanteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> VacanteOut:
    """Edita los datos de una vacante. Solo el dueño puede modificarla."""
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
    if vacante.id_usuario != usuario.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta vacante")

    if datos.titulo_puesto is not None:
        vacante.titulo_puesto = datos.titulo_puesto
    if datos.descripcion is not None:
        vacante.descripcion = datos.descripcion
    if datos.experiencia_minima_anios is not None:
        vacante.experiencia_minima_anios = datos.experiencia_minima_anios

    # Si se envían requerimientos, reemplazar
    if datos.requerimientos is not None:
        db.query(VacanteRequerimiento).filter(
            VacanteRequerimiento.id_vacante == id_vacante
        ).delete(synchronize_session=False)
        db.flush()

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
    return _a_salida(vacante, _contar_candidatos(db, id_vacante))


@router.get("", response_model=PaginatedVacantes)
def listar_vacantes(
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> PaginatedVacantes:
    """Lista las vacantes del usuario autenticado, más recientes primero."""
    query = (
        select(Vacante)
        .options(
            selectinload(Vacante.requerimientos).selectinload(
                VacanteRequerimiento.habilidad
            )
        )
        .where(Vacante.id_usuario == usuario.id_usuario)
    )
    if q:
        query = query.where(Vacante.titulo_puesto.ilike(f"%{q}%"))
        
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    
    query = query.order_by(Vacante.fecha_creacion.desc()).offset((page - 1) * page_size).limit(page_size)
    vacantes = db.scalars(query).all()
    
    return PaginatedVacantes(
        total=total,
        page=page,
        page_size=page_size,
        items=[_a_salida(v, _contar_candidatos(db, v.id_vacante)) for v in vacantes]
    )


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
        .where(
            Vacante.id_vacante == id_vacante,
            Vacante.id_usuario == usuario.id_usuario,
        )
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return _a_salida(vacante, _contar_candidatos(db, id_vacante))


@router.get("/{id_vacante}/candidatos", response_model=PaginatedCandidatos)
def candidatos_de_vacante(
    id_vacante: UUID,
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_porcentaje: Optional[float] = Query(None, ge=0, le=100),
    es_recomendado: Optional[bool] = Query(None),
    etapa: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> PaginatedCandidatos:
    """Ranking de candidatos evaluados con filtros y paginación."""
    existe = db.scalar(
        select(Vacante.id_vacante).where(
            Vacante.id_vacante == id_vacante,
            Vacante.id_usuario == usuario.id_usuario,
        )
    )
    if existe is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    items, total = listar_candidatos_de_vacante(
        db, id_vacante, q, page, page_size, min_porcentaje, es_recomendado, etapa
    )
    return PaginatedCandidatos(total=total, page=page, page_size=page_size, items=items)
