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

db_url = settings.database_url or "sqlite:///:memory:"
is_sqlite = "sqlite" in db_url

engine_kwargs = {"pool_pre_ping": True, "connect_args": {"connect_timeout": 5}}
if not is_sqlite:
    engine_kwargs.update({"pool_size": 5, "max_overflow": 5})

engine = create_engine(db_url, **engine_kwargs)

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
