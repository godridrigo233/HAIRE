"""Endpoint de autenticación: POST /auth/login."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, LoginResponse, UsuarioOut
from app.security import crear_access_token, verificar_password_demo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Valida correo (existe en `usuarios`) + password de demo y emite un JWT real.

    Nota: la tabla `usuarios` no tiene columna de password (ver README). El login es
    interino: verifica que el correo exista y la password coincida con AUTH_DEMO_PASSWORD.
    """
    usuario = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.correo) == datos.correo.strip().lower()
        )
    )
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos",
    )
    if usuario is None or not verificar_password_demo(datos.password):
        raise credenciales_invalidas

    token = crear_access_token(
        subject=usuario.id_usuario,
        extra={"correo": usuario.correo, "rol": usuario.rol},
    )
    return LoginResponse(
        access_token=token,
        usuario=UsuarioOut.model_validate(usuario),
    )
