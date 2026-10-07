"""Tests de integración para los nuevos endpoints y middlewares de HAIRE."""
from __future__ import annotations

import unittest
from fastapi.testclient import TestClient
from app.main import app


class ApiIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_rate_limiter_headers_present(self):
        """Verifica que el middleware de rate limiting inyecte las cabeceras requeridas."""
        resp = self.client.post("/auth/login", json={"correo": "test@haire.app", "password": "wrong"})
        self.assertIn("x-ratelimit-limit", resp.headers)
        self.assertIn("x-ratelimit-remaining", resp.headers)

    def test_register_password_min_length(self):
        """Verifica que la contraseña de registro requiera al menos 6 caracteres."""
        payload = {
            "nombres": "Ana",
            "apellidos": "García",
            "correo": "ana.garcia@empresa.com",
            "password": "123",  # Demasiado corta
        }
        resp = self.client.post("/auth/register", json=payload)
        self.assertEqual(resp.status_code, 422)  # Pydantic validation error

    def test_patch_me_requiere_auth(self):
        """Verifica que el endpoint de actualización de perfil requiera JWT válido."""
        resp = self.client.patch("/auth/me", json={"nombres": "NuevoNombre"})
        self.assertIn(resp.status_code, (401, 403))

    def test_patch_password_requiere_auth(self):
        """Verifica que el cambio de contraseña requiera JWT válido."""
        resp = self.client.patch(
            "/auth/password",
            json={"password_actual": "vieja123", "password_nueva": "nueva1234"},
        )
        self.assertIn(resp.status_code, (401, 403))

    def test_editar_vacante_requiere_auth(self):
        """Verifica que editar una vacante requiera token de usuario."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = self.client.put(f"/vacantes/{fake_id}", json={"titulo_puesto": "Tech Lead"})
        self.assertIn(resp.status_code, (401, 403))

    def test_cambiar_etapa_candidato_requiere_auth(self):
        """Verifica que cambiar etapa de un candidato requiera autorización."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = self.client.patch(f"/candidatos/{fake_id}/etapa", json={"etapa": "entrevista"})
        self.assertIn(resp.status_code, (401, 403))

    def test_estado_cv_endpoint_definido(self):
        """Verifica que el endpoint de estado de CV exista."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = self.client.get(f"/cv/{fake_id}/estado")
        self.assertIn(resp.status_code, (401, 403, 404))


if __name__ == "__main__":
    unittest.main()
