"""Schemas Pydantic v2 para request/response de la API."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------------- Auth -----------------------------
class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: UUID
    nombres: str
    apellidos: str
    correo: str
    rol: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


# --------------------------- Vacantes ---------------------------
class RequerimientoIn(BaseModel):
    nombre: str = Field(..., description="Nombre de la habilidad requerida")
    es_obligatoria: bool = True


class VacanteCreate(BaseModel):
    titulo_puesto: str
    descripcion: Optional[str] = None
    experiencia_minima_anios: int = 0
    requerimientos: List[RequerimientoIn] = Field(default_factory=list)


class RequerimientoOut(BaseModel):
    id_habilidad: UUID
    nombre: str
    es_obligatoria: bool


class VacanteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_vacante: UUID
    id_usuario: UUID
    titulo_puesto: str
    descripcion: Optional[str] = None
    experiencia_minima_anios: int
    estado_activo: bool
    fecha_creacion: Optional[datetime] = None
    requerimientos: List[RequerimientoOut] = Field(default_factory=list)
    total_candidatos: int = 0


# ------------------------------ CV ------------------------------
class CurriculumOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_curriculum: UUID
    id_postulante: UUID
    id_vacante: UUID
    archivo_pdf_url: Optional[str] = None
    peso_archivo_kb: Optional[int] = None
    estado_lectura: str
    fecha_carga: Optional[datetime] = None


class UploadResponse(BaseModel):
    curriculum: CurriculumOut
    texto_preview: str
    caracteres_extraidos: int


# --------------------- Respuesta del LLM (Groq) ---------------------
class HabilidadDetectada(BaseModel):
    nombre: str
    nivel_detectado: Optional[str] = None


class AnalisisIA(BaseModel):
    """Forma estricta que se le exige a Groq devolver (JSON mode)."""

    nombre_candidato: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    habilidades_detectadas: List[HabilidadDetectada] = Field(default_factory=list)
    porcentaje_compatibilidad: float = Field(..., ge=0, le=100)
    es_recomendado: bool = False
    justificacion: str


class EvaluacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_evaluacion: UUID
    id_curriculum: UUID
    id_vacante: UUID
    porcentaje_compatibilidad: Optional[float] = None
    es_recomendado: bool
    justificacion_ia: Optional[str] = None
    estado_aprobacion: str
    fecha_evaluacion: Optional[datetime] = None


class AnalizarResponse(BaseModel):
    evaluacion: EvaluacionOut
    habilidades_detectadas: List[HabilidadDetectada]
    modelo_usado: str
    tiempo_respuesta_ms: int


# --------------------------- Candidatos ---------------------------
class HabilidadEvaluadaOut(BaseModel):
    nombre: str
    cumple: bool
    obligatoria: bool


class CandidatoOut(BaseModel):
    """Vista de un candidato evaluado, lista para el ranking del frontend."""

    id: UUID  # id_evaluacion
    id_vacante: UUID
    id_curriculum: UUID
    nombre: str
    correo: Optional[str] = None
    telefono: Optional[str] = None
    porcentaje: float
    es_recomendado: bool
    justificacion: Optional[str] = None
    requeridas: List[HabilidadEvaluadaOut] = Field(default_factory=list)
    adicionales: List[str] = Field(default_factory=list)


# ---------------------------- Scoring ----------------------------
class ScoringResponse(BaseModel):
    id_curriculum: UUID
    id_vacante: UUID
    total_requeridas: int
    total_cumplidas: int
    obligatorias_faltantes: List[str]
    porcentaje_simple: float
