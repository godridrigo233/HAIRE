"""Tests de las funciones de seguridad."""
from app.security import hashear_password, verificar_password, crear_access_token, decodificar_access_token
import uuid

def test_hash_and_verify():
    pw = "haire2026"
    h = hashear_password(pw)
    assert h != pw
    assert verificar_password(pw, h)
    assert not verificar_password("wrong", h)

def test_jwt_roundtrip():
    uid = uuid.uuid4()
    token = crear_access_token(subject=uid)
    payload = decodificar_access_token(token)
    assert payload["sub"] == str(uid)
