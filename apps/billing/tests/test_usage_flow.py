def test_get_usage(client, demo_headers):
    response = client.get("/api/org/me/usage", headers=demo_headers)
    assert response.status_code == 200
    data = response.json()
    assert "plan_code" in data
    assert "total_questions_remaining" in data


def test_get_extra_status(client, demo_headers):
    response = client.get("/api/org/me/extras/status", headers=demo_headers)
    assert response.status_code == 200
    data = response.json()
    assert "extra_questions_remaining" in data
    assert "can_buy_extra" in data


def test_ask_question(client, demo_headers):
    response = client.post(
        "/api/questions/ask",
        headers=demo_headers,
        json={"question": "Hola, que hay en mis documentos?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["consumed_total"] == 1


def test_list_files(client, demo_headers):
    response = client.get("/api/org/me/files", headers=demo_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_billing_logs(client, demo_headers):
    response = client.get("/api/org/me/billing/logs", headers=demo_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
