"""Endpoint de autenticación: POST /auth/login."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Usuario
from app.schemas import (
    CambiarPasswordRequest,
    LoginRequest,
    LoginResponse,
    RecuperarPasswordRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UsuarioOut,
    UsuarioUpdate,
)
from app.security import (
    crear_access_token,
    decodificar_access_token,
    hashear_password,
    verificar_password,
)

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


@router.patch("/me", response_model=UsuarioOut)
def actualizar_perfil(
    datos: UsuarioUpdate,
    usuario_actual: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UsuarioOut:
    """Actualiza nombres y/o apellidos del usuario autenticado."""
    if datos.nombres is not None:
        usuario_actual.nombres = datos.nombres.strip()
    if datos.apellidos is not None:
        usuario_actual.apellidos = datos.apellidos.strip()
    db.commit()
    db.refresh(usuario_actual)
    return UsuarioOut.model_validate(usuario_actual)


@router.patch("/password")
def cambiar_password(
    datos: CambiarPasswordRequest,
    usuario_actual: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permite al usuario cambiar su contraseña tras validar la actual."""
    if not usuario_actual.password_hash or not verificar_password(
        datos.password_actual, usuario_actual.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta",
        )
    if len(datos.password_nueva) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres",
        )
    usuario_actual.password_hash = hashear_password(datos.password_nueva)
    db.commit()
    return {"mensaje": "Contraseña actualizada exitosamente"}


@router.post("/recuperar-password")
def solicitar_recuperacion_password(
    datos: RecuperarPasswordRequest,
    db: Session = Depends(get_db),
):
    """Genera un token seguro para restablecer contraseña. En producción se enviaría por email."""
    correo_limpio = datos.correo.strip().lower()
    usuario = db.scalar(
        select(Usuario).where(func.lower(Usuario.correo) == correo_limpio)
    )
    # Por seguridad no revelamos si el usuario existe o no
    token_reset = None
    if usuario:
        token_reset = crear_access_token(
            subject=usuario.id_usuario,
            extra={"proposito": "reset_password", "correo": usuario.correo},
        )

    return {
        "mensaje": "Si el correo está registrado en HAIRE, recibirás instrucciones para restablecer tu contraseña.",
        "token_reset": token_reset,  # Disponible para entorno de desarrollo y pruebas
    }


@router.post("/reset-password")
def ejecutar_reset_password(
    datos: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Restablece la contraseña utilizando el token firmado de recuperación."""
    try:
        import uuid
        payload = decodificar_access_token(datos.token)
        if payload.get("proposito") != "reset_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token no válido para restablecimiento de contraseña",
            )
        id_usuario = uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de recuperación es inválido o ha expirado",
        )

    usuario = db.scalar(select(Usuario).where(Usuario.id_usuario == id_usuario))
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    usuario.password_hash = hashear_password(datos.password_nueva)
    db.commit()
    return {"mensaje": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión."}

