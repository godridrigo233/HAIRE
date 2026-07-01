"""Helpers para el catálogo de habilidades (get-or-create por nombre)."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Habilidad


def obtener_o_crear_habilidad(db: Session, nombre: str) -> Habilidad:
    """Devuelve la habilidad del catálogo que coincida por nombre (case-insensitive),
    creándola si no existe. No hace commit (lo hace el caller)."""
    nombre_limpio = nombre.strip()
    existente = db.scalar(
        select(Habilidad).where(
            func.lower(Habilidad.nombre) == nombre_limpio.lower()
        )
    )
    if existente:
        return existente

    nueva = Habilidad(nombre=nombre_limpio)
    db.add(nueva)
    db.flush()  # asigna id_habilidad sin cerrar la transacción
    return nueva
