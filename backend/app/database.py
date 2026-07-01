"""Motor y sesiones de SQLAlchemy 2.0 contra el Postgres de Supabase.

La conexión es directa como rol `postgres`, por lo que las políticas RLS
(auth.role() = 'authenticated') no aplican al backend: se salta la RLS a
propósito, que es el patrón esperado para un servidor de confianza.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # revalida conexiones caídas (Supabase cierra idle)
    pool_size=5,
    max_overflow=5,
    # Sin esto, un bloqueo de red en el puerto de Postgres cuelga la request
    # indefinidamente (ej. firewalls que solo dejan pasar 443/HTTPS).
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: abre una sesión por request y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
