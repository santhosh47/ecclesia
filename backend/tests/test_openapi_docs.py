"""Unit tests validating the enhanced OpenAPI / Swagger interactive documentation specification."""

from fastapi.testclient import TestClient

from app.main import app


def test_openapi_json_schema_structure() -> None:
    """Verify that /openapi.json contains comprehensive metadata, tags, and security schemes."""
    with TestClient(app) as client:
        response = client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        assert schema["openapi"].startswith("3.")
        assert "info" in schema
        info = schema["info"]
        assert info["title"] == "Ecclesia Church Management System"
        assert info["version"] == "1.0.0"
        assert "ChMS" in info["description"]
        assert "contact" in info
        assert "license" in info

        # Tags verification
        assert "tags" in schema
        tag_names = {t["name"] for t in schema["tags"]}
        assert "auth" in tag_names
        assert "members" in tag_names
        assert "ledger" in tag_names
        assert "compliance" in tag_names
        assert "audit-logs" in tag_names
        assert "system" in tag_names

        # Security scheme verification
        assert "components" in schema
        components = schema["components"]
        assert "securitySchemes" in components
        assert "BearerAuth" in components["securitySchemes"]
        bearer = components["securitySchemes"]["BearerAuth"]
        assert bearer["type"] == "http"
        assert bearer["scheme"] == "bearer"
        assert bearer["bearerFormat"] == "JWT"

        # Global security requirement
        assert "security" in schema
        assert any("BearerAuth" in item for item in schema["security"])


def test_swagger_ui_endpoint_accessible() -> None:
    """Verify that the interactive Swagger UI at /docs renders cleanly."""
    with TestClient(app) as client:
        response = client.get("/docs")
        assert response.status_code == 200
        assert "swagger-ui" in response.text.lower()


def test_redoc_endpoint_accessible() -> None:
    """Verify that the interactive ReDoc UI at /redoc renders cleanly."""
    with TestClient(app) as client:
        response = client.get("/redoc")
        assert response.status_code == 200
        assert "redoc" in response.text.lower()
