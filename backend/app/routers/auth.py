"""Endpoint de autenticación: POST /auth/login."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, LoginResponse, RegisterRequest, UsuarioOut
from app.security import crear_access_token, hashear_password, verificar_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Valida correo (existe en `usuarios`) y verifica la password."""
    usuario = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.correo) == datos.correo.strip().lower()
        )
    )
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos",
    )
    if usuario is None:
        raise credenciales_invalidas
        
    if not usuario.password_hash:
        raise credenciales_invalidas
    if not verificar_password(datos.password, usuario.password_hash):
        raise credenciales_invalidas

    token = crear_access_token(
        subject=usuario.id_usuario,
        extra={"correo": usuario.correo, "rol": usuario.rol},
    )
    return LoginResponse(
        access_token=token,
        usuario=UsuarioOut.model_validate(usuario),
    )


@router.post("/register", response_model=LoginResponse, status_code=201)
def register(datos: RegisterRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Crea un nuevo usuario con password hasheado y devuelve un JWT."""
    existente = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.correo) == datos.correo.strip().lower()
        )
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )
        
    nuevo_usuario = Usuario(
        nombres=datos.nombres,
        apellidos=datos.apellidos,
        correo=datos.correo.strip().lower(),
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    token = crear_access_token(
        subject=nuevo_usuario.id_usuario,
        extra={"correo": nuevo_usuario.correo, "rol": nuevo_usuario.rol},
    )
    return LoginResponse(
        access_token=token,
        usuario=UsuarioOut.model_validate(nuevo_usuario),
    )
