"""Dependencias reutilizables de FastAPI (usuario autenticado)."""
from __future__ import annotations

import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.security import decodificar_access_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el JWT del header Authorization y devuelve el usuario de la BD."""
    cred_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decodificar_access_token(creds.credentials)
        id_usuario = payload.get("sub")
        if id_usuario is None:
            raise cred_error
    except jwt.PyJWTError:
        raise cred_error

    try:
        usuario = db.get(Usuario, uuid.UUID(str(id_usuario)))
    except (ValueError, TypeError):
        raise cred_error
    if usuario is None:
        raise cred_error
    return usuario
