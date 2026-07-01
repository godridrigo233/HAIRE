"""App FastAPI del backend Haire (Bloque 2)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.routers import auth, candidatos, cv, vacantes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("haire")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verificación de conexión a la BD ANTES de servir requests.
    # (El backend viejo en C# tenía este check después de app.Run() y nunca corría —
    #  ver docs/referencia-backend-viejo.md.)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Conexión a la base de datos verificada correctamente.")
    except Exception as exc:  # noqa: BLE001
        logger.error("No se pudo conectar a la base de datos: %s", exc)
    yield


app = FastAPI(title="Haire API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vacantes.router)
app.include_router(cv.router)
app.include_router(candidatos.router)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "haire-api"}
