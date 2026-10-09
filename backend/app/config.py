"""Configuración central del backend, leída desde variables de entorno (.env)."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Base de datos
    database_url: str = Field(
        default="",
        alias="DATABASE_URL",
    )

    # Supabase Storage
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_service_key: str = Field(default="", alias="SUPABASE_SERVICE_KEY")
    supabase_bucket: str = Field(default="cv", alias="SUPABASE_BUCKET")

    # Groq
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model: str = Field(default="qwen/qwen3.8-27b", alias="GROQ_MODEL")

    @field_validator("groq_api_key", mode="before")
    @classmethod
    def validar_groq_api_key(cls, value: str) -> str:
        value = str(value).strip().strip('"\'')
        if not value or value.startswith("<") or len(value) < 20:
            raise ValueError(
                "GROQ_API_KEY no está configurada. Genera una key nueva en console.groq.com."
            )
        return value

    # JWT
    jwt_secret: str = Field(
        default="haire_jwt_secret_super_secure_key_2026_xyz",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=480, alias="JWT_EXPIRE_MINUTES")

    # CORS: string separado por comas (se parsea en `cors_origins`).
    cors_origins_raw: str = Field(
        default="http://localhost:3000,https://haire-tau.vercel.app",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
