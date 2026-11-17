from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.job_applications import generation
from app.services import application_generator
from app.services.llm import openai_provider


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(generation, "get_profile_object", lambda profile_id: {})
    with TestClient(app) as test_client:
        yield test_client


def test_generate_application_returns_generated_text(client, monkeypatch):
    generate = Mock(return_value="Generated application text")
    monkeypatch.setattr(
        application_generator,
        "generate_job_application",
        generate,
    )

    response = client.post(
        "/applications/generate",
        json={"profile_id": 3, "job_ad": "Data scientist role"},
    )

    assert response.status_code == 200
    assert response.json() == {"application_text": "Generated application text"}
    generate.assert_called_once_with("Data scientist role", {})


@pytest.mark.parametrize(
    ("provider_error", "status_code", "detail"),
    [
        (
            openai_provider.OpenAIConfigurationError,
            503,
            "Application generation is currently unavailable due to a "
            "configuration issue.",
        ),
        (
            openai_provider.OpenAIAuthenticationError,
            503,
            "Application generation is currently unavailable due to an "
            "AI service authentication issue.",
        ),
        (
            openai_provider.OpenAIRateLimitError,
            503,
            "Application generation is temporarily unavailable. "
            "Please try again later.",
        ),
        (
            openai_provider.OpenAITimeoutError,
            504,
            "Application generation took too long. Please try again.",
        ),
        (
            openai_provider.OpenAIConnectionError,
            503,
            "Could not connect to the external AI service. "
            "Please try again later.",
        ),
        (
            openai_provider.OpenAIServerError,
            502,
            "The external AI service encountered an error. Please try again later.",
        ),
        (
            openai_provider.OpenAIRequestError,
            502,
            "Application generation failed due to an unknown error. "
            "Please try again later.",
        ),
    ],
)
def test_generate_application_returns_sanitized_provider_errors(
    client,
    monkeypatch,
    provider_error,
    status_code,
    detail,
):
    monkeypatch.setattr(
        application_generator,
        "generate_job_application",
        Mock(side_effect=provider_error("private upstream details")),
    )

    response = client.post(
        "/applications/generate",
        json={"profile_id": 3, "job_ad": "Data scientist role"},
    )

    assert response.status_code == status_code
    assert response.json() == {"detail": detail}
    assert "private upstream details" not in response.text


def test_generate_application_returns_not_found_without_calling_provider(
    client,
    monkeypatch,
):
    generate = Mock()
    monkeypatch.setattr(generation, "get_profile_object", lambda profile_id: None)
    monkeypatch.setattr(application_generator, "generate_job_application", generate)

    response = client.post(
        "/applications/generate",
        json={"profile_id": 999_999, "job_ad": "Data scientist role"},
    )

    assert response.status_code == 404
    generate.assert_not_called()


@pytest.mark.parametrize(
    "payload",
    [
        {"profile_id": 3},
        {"profile_id": 3, "job_ad": " \t\n "},
        {"profile_id": 3, "job_ad": "x" * 50_001},
        {"profile_id": 0, "job_ad": "Data scientist role"},
        {"profile_id": "not-an-integer", "job_ad": "Data scientist role"},
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "unexpected": "value",
        },
    ],
)
def test_invalid_generation_requests_do_not_load_profile_or_call_provider(
    client,
    monkeypatch,
    payload,
):
    load_profile = Mock()
    generate = Mock()
    monkeypatch.setattr(generation, "get_profile_object", load_profile)
    monkeypatch.setattr(
        application_generator,
        "generate_job_application",
        generate,
    )

    response = client.post("/applications/generate", json=payload)

    assert response.status_code == 422
    load_profile.assert_not_called()
    generate.assert_not_called()
