"""Modelos SQLAlchemy 2.0 mapeados 1:1 contra el esquema real de Supabase.

Claves primarias UUID (default uuid_generate_v4() en la BD; aquí las generamos
client-side con uuid4 para conocerlas al instante). Verificado contra el esquema
real vía information_schema.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TIMESTAMP

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    nombres: Mapped[str] = mapped_column(String)
    apellidos: Mapped[str] = mapped_column(String)
    correo: Mapped[str] = mapped_column(String, unique=True)
    rol: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    nivel_experiencia: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    estado: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_registro: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )


class Habilidad(Base):
    __tablename__ = "habilidades"

    id_habilidad: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, unique=True)
    categoria_tecnica: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class Vacante(Base):
    __tablename__ = "vacantes"

    id_vacante: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_usuario: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("usuarios.id_usuario"))
    titulo_puesto: Mapped[str] = mapped_column(String)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experiencia_minima_anios: Mapped[int] = mapped_column(Integer, default=0)
    estado_activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )

    requerimientos: Mapped[list["VacanteRequerimiento"]] = relationship(
        back_populates="vacante", cascade="all, delete-orphan"
    )


class VacanteRequerimiento(Base):
    __tablename__ = "vacante_requerimientos"

    id_requerimiento: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_vacante: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vacantes.id_vacante"))
    id_habilidad: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("habilidades.id_habilidad"))
    es_obligatoria: Mapped[bool] = mapped_column(Boolean, default=True)

    vacante: Mapped["Vacante"] = relationship(back_populates="requerimientos")
    habilidad: Mapped["Habilidad"] = relationship()


class Postulante(Base):
    __tablename__ = "postulantes"

    id_postulante: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    nombres: Mapped[str] = mapped_column(String)
    apellidos: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    correo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    telefono: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fecha_registro: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )


class Curriculum(Base):
    __tablename__ = "curriculum"

    id_curriculum: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_postulante: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("postulantes.id_postulante"))
    id_vacante: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vacantes.id_vacante"))
    archivo_pdf_url: Mapped[str] = mapped_column(String)
    peso_archivo_kb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    texto_plano_extraido: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estado_lectura: Mapped[str] = mapped_column(String, default="pendiente")
    fecha_carga: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )

    postulante: Mapped["Postulante"] = relationship()


class CurriculumHabilidad(Base):
    __tablename__ = "curriculum_habilidades"

    id_curriculum_habilidad: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_curriculum: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("curriculum.id_curriculum"))
    id_habilidad: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("habilidades.id_habilidad"))
    nivel_detectado: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    habilidad: Mapped["Habilidad"] = relationship()


class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id_evaluacion: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_curriculum: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("curriculum.id_curriculum"))
    id_vacante: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vacantes.id_vacante"))
    porcentaje_compatibilidad: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    es_recomendado: Mapped[bool] = mapped_column(Boolean, default=False)
    justificacion_ia: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estado_aprobacion: Mapped[str] = mapped_column(String, default="pendiente")
    fecha_evaluacion: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )


class PromptLog(Base):
    __tablename__ = "prompt_logs"

    id_log: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    id_evaluacion: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("evaluaciones.id_evaluacion"), nullable=True
    )
    tipo_prompt: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    prompt_enviado: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    respuesta_cruda: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    modelo_usado: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tiempo_respuesta_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fecha: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now()
    )
