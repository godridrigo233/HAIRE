"""Subida de PDFs al bucket privado `cv` de Supabase Storage."""
from __future__ import annotations

import uuid
from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings

settings = get_settings()

# URL firmada válida por 7 días (para que el frontend pueda mostrar/descargar el PDF
# desde un bucket privado sin exponer la service key).
_SIGNED_URL_TTL_SEG = 60 * 60 * 24 * 7


@lru_cache
def _client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


def subir_cv(pdf_bytes: bytes, nombre_original: str) -> str:
    """Sube el PDF al bucket `cv` y devuelve una URL firmada temporal.

    Devuelve la ruta del objeto si no se puede firmar la URL, para no perder la
    referencia al archivo subido.
    """
    nombre_limpio = nombre_original.replace("/", "_").strip() or "cv.pdf"
    ruta = f"{uuid.uuid4()}-{nombre_limpio}"

    bucket = _client().storage.from_(settings.supabase_bucket)
    bucket.upload(
        path=ruta,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "false"},
    )

    firmada = bucket.create_signed_url(ruta, _SIGNED_URL_TTL_SEG)
    return firmada.get("signedURL") or firmada.get("signedUrl") or ruta
