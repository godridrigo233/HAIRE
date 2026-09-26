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
def eliminar_cv(url_o_ruta: str) -> None:
    """Extrae el path del objeto de la URL firmada y lo borra del bucket 'cv'.

    La URL firmada tiene la forma:
      https://<project>.supabase.co/storage/v1/object/sign/cv/<uuid>-<filename.pdf>?token=...
    Se extrae la parte después de '/cv/' y antes de '?' para obtener la ruta del objeto.
    """
    # Quitar query string si existe
    sin_query = url_o_ruta.split("?")[0]
    # Extraer el path dentro del bucket (después del nombre del bucket)
    separador = f"/{settings.supabase_bucket}/"
    if separador in sin_query:
        ruta_objeto = sin_query.split(separador, 1)[-1]
    else:
        # Fallback: asumir que la cadena ya ES la ruta del objeto
        ruta_objeto = sin_query
    try:
        _client().storage.from_(settings.supabase_bucket).remove([ruta_objeto])
    except Exception as exc:
        import logging
        logging.getLogger("haire.storage").warning("No se pudo eliminar %s: %s", ruta_objeto, exc)