"""Schemas Pydantic v2 para request/response de la API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ----------------------------- Auth -----------------------------
class LoginRequest(BaseModel):
    correo: str
    password: str


class RegisterRequest(BaseModel):
    nombres: str
    apellidos: str
    correo: str
    password: str = Field(..., min_length=6)
    rol: Optional[str] = None


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


class VacanteUpdate(BaseModel):
    """Campos editables de una vacante."""
    titulo_puesto: Optional[str] = None
    descripcion: Optional[str] = None
    experiencia_minima_anios: Optional[int] = None
    requerimientos: Optional[List[RequerimientoIn]] = None


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


class PaginatedVacantes(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[VacanteOut]


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
    es_cv: bool = Field(default=True, description="True si es un CV válido, False si es otro documento")
    justificacion_descarte: Optional[str] = None
    nombre_candidato: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    habilidades_detectadas: List[HabilidadDetectada] = Field(default_factory=list)
    porcentaje_compatibilidad: float = Field(default=0.0, ge=0, le=100)
    es_recomendado: bool = False
    justificacion: Optional[str] = ""

    @field_validator("habilidades_detectadas", mode="before")
    @classmethod
    def normalizar_habilidades(cls, v: Any) -> list:
        if not v:
            return []
        resultado = []
        for item in v:
            if isinstance(item, str):
                resultado.append({"nombre": item.strip(), "nivel_detectado": None})
            elif isinstance(item, dict):
                resultado.append(item)
            else:
                resultado.append({"nombre": str(item), "nivel_detectado": None})
        return resultado

    @field_validator("porcentaje_compatibilidad", mode="before")
    @classmethod
    def normalizar_porcentaje(cls, v: Any) -> float:
        if v is None:
            return 0.0
        try:
            val = float(v)
            return max(0.0, min(100.0, val))
        except (ValueError, TypeError):
            return 0.0

    @field_validator("justificacion", mode="before")
    @classmethod
    def normalizar_justificacion(cls, v: Any) -> str:
        if v is None:
            return ""
        return str(v)


class EvaluacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_evaluacion: UUID
    id_curriculum: UUID
    id_vacante: UUID
    porcentaje_compatibilidad: Optional[float] = None
    es_recomendado: bool
    justificacion_ia: Optional[str] = None
    estado_aprobacion: str
    etapa: str = "nuevo"
    fecha_evaluacion: Optional[datetime] = None


class AnalizarResponse(BaseModel):
    evaluacion: EvaluacionOut
    habilidades_detectadas: List[HabilidadDetectada]
    modelo_usado: str
    tiempo_respuesta_ms: int


class AnalizarAsyncResponse(BaseModel):
    id_curriculum: UUID
    estado: str = "procesando"
    mensaje: str = "El análisis se está procesando en segundo plano"


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
    etapa: str = "nuevo"
    requeridas: List[HabilidadEvaluadaOut] = Field(default_factory=list)
    adicionales: List[str] = Field(default_factory=list)
    pdf_url: Optional[str] = None


class PaginatedCandidatos(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[CandidatoOut]


# ---------------------------- Scoring ----------------------------
class ScoringResponse(BaseModel):
    id_curriculum: UUID
    id_vacante: UUID
    total_requeridas: int
    total_cumplidas: int
    obligatorias_faltantes: List[str]
    porcentaje_simple: float
