"""Scoring simple y determinista: habilidades del CV vs requisitos de la vacante.

No usa LLM. Compara las habilidades ya detectadas en `curriculum_habilidades`
contra los requerimientos de la vacante (`vacante_requerimientos`).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    CurriculumHabilidad,
    Habilidad,
    VacanteRequerimiento,
)
from app.schemas import ScoringResponse


def calcular_scoring_simple(
    db: Session, id_curriculum: int, id_vacante: int
) -> ScoringResponse:
    # Habilidades detectadas en el CV (nombres en minúscula para comparar)
    detectadas = set(
        n.lower()
        for n in db.scalars(
            select(Habilidad.nombre)
            .join(CurriculumHabilidad, CurriculumHabilidad.id_habilidad == Habilidad.id_habilidad)
            .where(CurriculumHabilidad.id_curriculum == id_curriculum)
        ).all()
    )

    # Requerimientos de la vacante con su nombre y si son obligatorios
    requerimientos = db.execute(
        select(Habilidad.nombre, VacanteRequerimiento.es_obligatoria)
        .join(Habilidad, Habilidad.id_habilidad == VacanteRequerimiento.id_habilidad)
        .where(VacanteRequerimiento.id_vacante == id_vacante)
    ).all()

    total = len(requerimientos)
    cumplidas = 0
    obligatorias_faltantes: list[str] = []
    for nombre, es_obligatoria in requerimientos:
        if nombre.lower() in detectadas:
            cumplidas += 1
        elif es_obligatoria:
            obligatorias_faltantes.append(nombre)

    porcentaje = round((cumplidas / total) * 100, 2) if total else 0.0

    return ScoringResponse(
        id_curriculum=id_curriculum,
        id_vacante=id_vacante,
        total_requeridas=total,
        total_cumplidas=cumplidas,
        obligatorias_faltantes=obligatorias_faltantes,
        porcentaje_simple=porcentaje,
    )
