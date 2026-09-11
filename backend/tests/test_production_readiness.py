"""Unit tests validating production readiness: error envelopes, connection pooling, and disposal."""

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.errors import build_error_envelope
from app.database.session import SessionLocal, dispose_engine
from app.main import app


def test_standardized_404_error_envelope() -> None:
    """Verify that a 404 Not Found returns the standardized error envelope while keeping 'detail'."""
    with TestClient(app) as client:
        response = client.get("/api/v1/non-existent-resource-endpoint-xyz")
        assert response.status_code == 404

        data = response.json()
        # Backward compatibility check
        assert "detail" in data
        assert data["detail"] == "Not Found"

        # Standardized error envelope check
        assert "error" in data
        error = data["error"]
        assert error["code"] == "NOT_FOUND"
        assert error["status_code"] == 404
        assert error["message"] == "Not Found"
        assert "X-Request-ID" in response.headers


def test_standardized_422_validation_error_envelope() -> None:
    """Verify that a 422 Unprocessable Entity returns the standardized validation envelope."""
    with TestClient(app) as client:
        # Send an invalid payload missing required username/password fields
        response = client.post("/api/v1/auth/login", json={"unexpected_field": 123})
        assert response.status_code == 422

        data = response.json()
        # Backward compatibility check: detail is the list of Pydantic validation errors
        assert "detail" in data
        assert isinstance(data["detail"], list)
        assert len(data["detail"]) > 0

        # Standardized error envelope check
        assert "error" in data
        error = data["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert error["status_code"] == 422
        assert error["message"] == "Request validation failed"
        assert isinstance(error["details"], list)
        assert len(error["details"]) > 0


def test_engine_disposal_and_reconnection() -> None:
    """Verify that dispose_engine closes connection pools and subsequent queries reconnect cleanly."""
    session = SessionLocal()
    try:
        val = session.execute(text("SELECT 1")).scalar()
        assert val == 1
    finally:
        session.close()

    # Explicitly dispose the engine connection pool
    dispose_engine()

    # A new session should reconnect transparently
    new_session = SessionLocal()
    try:
        val2 = new_session.execute(text("SELECT 1")).scalar()
        assert val2 == 1
    finally:
        new_session.close()


def test_build_error_envelope_utility() -> None:
    """Verify the error envelope builder correctly structures codes, messages, and request IDs."""
    envelope = build_error_envelope(
        status_code=403,
        detail="You do not have permission to access this resource",
        error_code="FORBIDDEN_ACCESS",
        request_id="test-req-12345",
    )
    assert envelope["detail"] == "You do not have permission to access this resource"
    assert envelope["error"]["code"] == "FORBIDDEN_ACCESS"
    assert envelope["error"]["status_code"] == 403
    assert envelope["error"]["request_id"] == "test-req-12345"
    assert envelope["error"]["message"] == "You do not have permission to access this resource"
