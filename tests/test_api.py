from fastapi.testclient import TestClient
from backend.api.main import app


def test_health_query_structure():
    client = TestClient(app)
    # Expect 422 because required fields are missing
    response = client.post("/api/query", json={})
    assert response.status_code == 422
