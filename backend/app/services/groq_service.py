"""Análisis de compatibilidad CV vs vacante usando Groq (LLM), con validación Pydantic."""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import List

import httpx
from pydantic import ValidationError

from app.config import get_settings
from app.schemas import AnalisisIA

settings = get_settings()

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_TIMEOUT_SEG = 60.0

_SYSTEM_PROMPT = (
    "Eres un analista de reclutamiento experto. Recibes el texto plano de un CV y "
    "los requisitos de una vacante, y evalúas la compatibilidad del candidato. "
    "Responde SIEMPRE en español y ÚNICAMENTE con un objeto JSON válido, sin texto "
    "adicional, con exactamente esta forma:\n"
    "{\n"
    '  "nombre_candidato": "string|null",     // nombre completo tal como aparece en el CV\n'
    '  "correo": "string|null",               // email del candidato si aparece\n'
    '  "telefono": "string|null",             // teléfono del candidato si aparece\n'
    '  "habilidades_detectadas": [{"nombre": "string", "nivel_detectado": "básico|intermedio|avanzado|null"}],\n'
    '  "porcentaje_compatibilidad": number,   // 0 a 100\n'
    '  "es_recomendado": boolean,\n'
    '  "justificacion": "string"              // 2-4 frases, en español\n'
    "}\n"
    "Extrae el nombre, correo y teléfono directamente del texto del CV (usa null si no "
    "aparecen). El porcentaje debe reflejar cuántos requisitos obligatorios cumple, la "
    "experiencia y la relevancia general. Sé estricto y objetivo."
)


@dataclass
class ResultadoAnalisis:
    analisis: AnalisisIA
    prompt_enviado: str
    respuesta_cruda: str
    modelo_usado: str
    tiempo_respuesta_ms: int


def _construir_prompt_usuario(
    texto_cv: str,
    titulo: str,
    experiencia_minima: int,
    requeridas_obligatorias: List[str],
    requeridas_opcionales: List[str],
) -> str:
    return (
        f"VACANTE: {titulo}\n"
        f"Experiencia mínima requerida: {experiencia_minima} años\n"
        f"Habilidades OBLIGATORIAS: {', '.join(requeridas_obligatorias) or 'ninguna'}\n"
        f"Habilidades DESEABLES: {', '.join(requeridas_opcionales) or 'ninguna'}\n\n"
        f"TEXTO DEL CV:\n{texto_cv[:12000]}"
    )


def analizar_cv(
    texto_cv: str,
    titulo: str,
    experiencia_minima: int,
    requeridas_obligatorias: List[str],
    requeridas_opcionales: List[str],
) -> ResultadoAnalisis:
    """Llama a Groq, valida el JSON con Pydantic y devuelve el resultado + trazas."""
    prompt_usuario = _construir_prompt_usuario(
        texto_cv, titulo, experiencia_minima,
        requeridas_obligatorias, requeridas_opcionales,
    )
    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt_usuario},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }

    inicio = time.perf_counter()
    with httpx.Client(timeout=_TIMEOUT_SEG) as client:
        resp = client.post(
            _GROQ_URL,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json=payload,
        )
    tiempo_ms = int((time.perf_counter() - inicio) * 1000)
    resp.raise_for_status()

    data = resp.json()
    contenido = data["choices"][0]["message"]["content"]

    try:
        analisis = AnalisisIA.model_validate_json(contenido)
    except ValidationError as exc:
        # Reintento de parseo: a veces el modelo envuelve el JSON en texto.
        try:
            analisis = AnalisisIA.model_validate(json.loads(contenido))
        except Exception:
            raise ValueError(
                f"Groq no devolvió un JSON con la forma esperada: {exc}"
            ) from exc

    return ResultadoAnalisis(
        analisis=analisis,
        prompt_enviado=prompt_usuario,
        respuesta_cruda=contenido,
        modelo_usado=settings.groq_model,
        tiempo_respuesta_ms=tiempo_ms,
    )
