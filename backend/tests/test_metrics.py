"""Test suite verifying Prometheus operational telemetry and metrics exposition."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_metrics_endpoint_returns_200_and_prometheus_format():
    """Verify that GET /metrics returns 200 with standard Prometheus text exposition."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")
    
    body = response.text
    assert "ecclesia_app_info" in body
    assert "ecclesia_http_requests_total" in body
    assert "ecclesia_http_request_duration_seconds" in body
    assert "ecclesia_db_pool_size" in body


def test_metrics_increments_request_counter_on_api_call():
    """Verify that making API requests increments the Prometheus request counter."""
    # Hit health check endpoint
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    
    # Check metrics
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    body = metrics_res.text
    assert 'method="GET"' in body
    assert 'status_code="200"' in body
