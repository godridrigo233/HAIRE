"""Tests básicos del backend Haire."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_login_invalid():
    resp = client.post("/auth/login", json={"correo": "no@existe.com", "password": "wrong"})
    assert resp.status_code == 401

def test_vacantes_sin_auth():
    resp = client.get("/vacantes")
    assert resp.status_code == 403

def test_upload_sin_auth():
    resp = client.post("/cv/upload")
    assert resp.status_code == 403
