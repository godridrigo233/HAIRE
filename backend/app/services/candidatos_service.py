"""Construye la vista de candidatos (ranking) uniendo evaluaciones, postulantes y skills."""
from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Curriculum,
    CurriculumHabilidad,
    Evaluacion,
    Habilidad,
    Postulante,
    VacanteRequerimiento,
)
from app.schemas import CandidatoOut, HabilidadEvaluadaOut


def _habilidades_detectadas(db: Session, id_curriculum: uuid.UUID) -> dict[str, str]:
    """Nombre de habilidad -> nivel detectado, para un curriculum."""
    filas = db.execute(
        select(Habilidad.nombre, CurriculumHabilidad.nivel_detectado)
        .join(CurriculumHabilidad, CurriculumHabilidad.id_habilidad == Habilidad.id_habilidad)
        .where(CurriculumHabilidad.id_curriculum == id_curriculum)
    ).all()
    return {nombre: (nivel or "") for nombre, nivel in filas}


def _requisitos_vacante(db: Session, id_vacante: uuid.UUID) -> List[tuple[str, bool]]:
    """(nombre_habilidad, es_obligatoria) de una vacante."""
    return [
        (nombre, bool(obl))
        for nombre, obl in db.execute(
            select(Habilidad.nombre, VacanteRequerimiento.es_obligatoria)
            .join(Habilidad, Habilidad.id_habilidad == VacanteRequerimiento.id_habilidad)
            .where(VacanteRequerimiento.id_vacante == id_vacante)
        ).all()
    ]


def _armar_candidato(
    db: Session, evaluacion: Evaluacion, curriculum: Curriculum, postulante: Postulante
) -> CandidatoOut:
    detectadas = _habilidades_detectadas(db, curriculum.id_curriculum)
    detectadas_lower = {n.lower() for n in detectadas}
    requisitos = _requisitos_vacante(db, evaluacion.id_vacante)
    nombres_requeridos = {n.lower() for n, _ in requisitos}

    requeridas = [
        HabilidadEvaluadaOut(
            nombre=nombre,
            cumple=nombre.lower() in detectadas_lower,
            obligatoria=obligatoria,
        )
        for nombre, obligatoria in requisitos
    ]
    # Adicionales: detectadas que NO eran requisito de la vacante
    adicionales = [n for n in detectadas if n.lower() not in nombres_requeridos]

    nombre_completo = " ".join(
        p for p in [postulante.nombres, postulante.apellidos] if p and p != "(sin apellido)"
    ).strip()

    return CandidatoOut(
        id=evaluacion.id_evaluacion,
        id_vacante=evaluacion.id_vacante,
        id_curriculum=curriculum.id_curriculum,
        nombre=nombre_completo or "Candidato sin nombre",
        correo=postulante.correo,
        telefono=postulante.telefono,
        porcentaje=float(evaluacion.porcentaje_compatibilidad or 0),
        es_recomendado=evaluacion.es_recomendado,
        justificacion=evaluacion.justificacion_ia,
        requeridas=requeridas,
        adicionales=adicionales,
    )


def listar_candidatos_de_vacante(db: Session, id_vacante: uuid.UUID) -> List[CandidatoOut]:
    """Candidatos evaluados de una vacante, ordenados por % descendente."""
    filas = db.execute(
        select(Evaluacion, Curriculum, Postulante)
        .join(Curriculum, Curriculum.id_curriculum == Evaluacion.id_curriculum)
        .join(Postulante, Postulante.id_postulante == Curriculum.id_postulante)
        .where(Evaluacion.id_vacante == id_vacante)
        .order_by(Evaluacion.porcentaje_compatibilidad.desc())
    ).all()
    return [_armar_candidato(db, ev, cur, post) for ev, cur, post in filas]


def obtener_candidato(db: Session, id_evaluacion: uuid.UUID) -> Optional[CandidatoOut]:
    fila = db.execute(
        select(Evaluacion, Curriculum, Postulante)
        .join(Curriculum, Curriculum.id_curriculum == Evaluacion.id_curriculum)
        .join(Postulante, Postulante.id_postulante == Curriculum.id_postulante)
        .where(Evaluacion.id_evaluacion == id_evaluacion)
    ).first()
    if fila is None:
        return None
    ev, cur, post = fila
    return _armar_candidato(db, ev, cur, post)
