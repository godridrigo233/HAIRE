"""Middleware de Rate Limiting en memoria para proteger la API contra abusos."""
from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        limite_por_minuto_default: int = 60,
        limite_login_por_minuto: int = 15,
        limite_cv_por_minuto: int = 25,
    ):
        super().__init__(app)
        self.limite_default = limite_por_minuto_default
        self.limite_login = limite_login_por_minuto
        self.limite_cv = limite_cv_por_minuto
        # Almacena ip -> lista de timestamps
        self.registros: Dict[Tuple[str, str], List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Permitir requests OPTIONS (preflight CORS) y health check sin limite
        if request.method == "OPTIONS" or request.url.path in ("/", "/docs", "/openapi.json"):
            return await call_next(request)

        # Identificar cliente por IP (o cabecera forwarded si esta detras de proxy)
        ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or (request.client.host if request.client else "127.0.0.1")
        )

        path = request.url.path
        ahora = time.time()
        ventana = 60.0  # 1 minuto

        # Determinar limite segun endpoint sensible
        if "/auth/login" in path:
            categoria = "auth"
            limite = self.limite_login
        elif "/cv" in path and request.method == "POST":
            categoria = "cv_upload"
            limite = self.limite_cv
        else:
            categoria = "general"
            limite = self.limite_default

        clave = (ip, categoria)
        timestamps = self.registros[clave]

        # Limpiar timestamps mas viejos que la ventana
        timestamps = [t for t in timestamps if ahora - t < ventana]
        self.registros[clave] = timestamps

        if len(timestamps) >= limite:
            segundos_restantes = int(ventana - (ahora - timestamps[0])) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas peticiones. Por favor espera antes de intentar nuevamente."
                },
                headers={
                    "Retry-After": str(max(1, segundos_restantes)),
                    "X-RateLimit-Limit": str(limite),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Registrar peticion
        timestamps.append(ahora)
        self.registros[clave] = timestamps

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limite)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limite - len(timestamps)))
        return response
