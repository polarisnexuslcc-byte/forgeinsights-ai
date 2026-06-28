import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def demo_headers():
    return {
        "X-User-Id": "11111111-1111-1111-1111-111111111111",
        "X-Organization-Id": "22222222-2222-2222-2222-222222222222",
    }
