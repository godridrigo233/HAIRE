"""Utilidades de autenticación: emisión y verificación de JWT."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt

from app.config import get_settings

settings = get_settings()


def crear_access_token(subject: str, extra: Optional[dict[str, Any]] = None) -> str:
    """Genera un JWT firmado con el id del usuario como `sub`."""
    ahora = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.jwt_expire_minutes),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decodificar_access_token(token: str) -> dict[str, Any]:
    """Decodifica y valida un JWT. Lanza jwt.PyJWTError si es inválido/expirado."""
    return jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )


def verificar_password_demo(password: str) -> bool:
    """Compara la password contra la password de demo en tiempo constante.

    Interino: la tabla `usuarios` no tiene columna de password (ver README).
    """
    return secrets.compare_digest(password, settings.auth_demo_password)
