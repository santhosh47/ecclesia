"""Security tests for JWT generation, validation, expiration, and rate limiting."""

from datetime import timedelta
from fastapi.testclient import TestClient
import jwt

from app.core.config import get_settings
from app.core.rate_limiter import login_rate_limiter
from app.core.security import ALGORITHM, create_access_token, decode_access_token, get_jwt_secret
from app.main import app

client = TestClient(app)
settings = get_settings()


def test_jwt_create_and_decode() -> None:
    """Verify standard JWT creation, claim encoding, and verification."""
    payload = {"sub": "123", "username": "security_tester", "role": "admin"}
    token = create_access_token(payload, expires_delta=timedelta(minutes=15))

    # Token structure verification: 3 base64 segments separated by dots
    segments = token.split(".")
    assert len(segments) == 3

    # Cryptographic decode verification
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "123"
    assert decoded["username"] == "security_tester"
    assert decoded["role"] == "admin"
    assert "exp" in decoded


def test_expired_jwt_rejected() -> None:
    """Verify expired JWT tokens fail verification and return None."""
    payload = {"sub": "123", "username": "expired_user"}
    token = create_access_token(payload, expires_delta=-timedelta(minutes=5))
    decoded = decode_access_token(token)
    assert decoded is None


def test_tampered_jwt_rejected() -> None:
    """Verify modified JWT payload or signature returns None."""
    payload = {"sub": "123", "username": "legit_user"}
    token = create_access_token(payload)

    # Tamper with token by changing last characters of signature
    tampered_token = token[:-4] + "xxxx"
    decoded = decode_access_token(tampered_token)
    assert decoded is None


def test_login_returns_signed_jwt() -> None:
    """Verify POST /api/v1/auth/login returns a cryptographically valid JWT access token."""
    login_rate_limiter.reset("testclient")
    response = client.post("/api/v1/auth/login", json={"username": "pastor@ecclesia.org", "password": "pastor123"})
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"

    token = body["access_token"]
    raw_decoded = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
    assert raw_decoded["username"] == "pastor" or raw_decoded["username"] == "pastor@ecclesia.org"
    assert "exp" in raw_decoded


def test_get_me_with_bearer_token() -> None:
    """Verify /api/v1/auth/me accepts and validates Bearer token."""
    login_rate_limiter.reset("testclient")
    login_resp = client.post("/api/v1/auth/login", json={"username": "pastor@ecclesia.org", "password": "pastor123"})
    token = login_resp.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user_info = response.json()
    assert user_info["email"] == "pastor@ecclesia.org"


def test_invalid_bearer_token_returns_401() -> None:
    """Verify malformed Bearer token is rejected with 401 Unauthorized."""
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401
    assert "Invalid or expired" in response.json()["detail"]


def test_login_rate_limiting() -> None:
    """Verify rate limiter triggers HTTP 429 after threshold of failed logins."""
    # Reset limiter for clean test
    login_rate_limiter.reset("testclient")

    # Send 5 failed attempts (within threshold)
    for _ in range(5):
        resp = client.post("/api/v1/auth/login", json={"username": "pastor@ecclesia.org", "password": "wrongpassword"})
        assert resp.status_code == 401

    # 6th attempt breaches limit and returns 429 Too Many Requests
    resp_blocked = client.post("/api/v1/auth/login", json={"username": "pastor@ecclesia.org", "password": "wrongpassword"})
    assert resp_blocked.status_code == 429
    assert "Too many login attempts" in resp_blocked.json()["detail"]
    assert "Retry-After" in resp_blocked.headers

    # Reset limiter cleanup
    login_rate_limiter.reset("testclient")
