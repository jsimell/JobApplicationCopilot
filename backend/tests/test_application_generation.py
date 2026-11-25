from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.job_applications import applications
from app.services import application_generator
from app.services.llm import openai_provider


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(applications, "get_profile_object", Mock(return_value={}))
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
        json={
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "application_plan": "Emphasize data analysis experience",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "application_text": "Generated application text"}
    generate.assert_called_once_with(
        "Data scientist role",
        {},
        "Emphasize data analysis experience",
    )


def test_generate_application_plan_returns_plan_and_forwards_guidance(
    client,
    monkeypatch,
):
    generate = Mock(return_value="Application plan")
    monkeypatch.setattr(application_generator, "generate_plan", generate)

    response = client.post(
        "/applications/plan",
        json={
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "user_guidance": "Emphasize data analysis",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"application_plan": "Application plan"}
    generate.assert_called_once_with(
        "Data scientist role",
        {},
        "Emphasize data analysis",
    )


@pytest.mark.parametrize(
    ("provider_error", "status_code", "detail"),
    [
        (
            openai_provider.OpenAIConfigurationError,
            503,
            "AI service is currently unavailable due to a configuration issue.",
        ),
        (
            openai_provider.OpenAIAuthenticationError,
            503,
            "AI features are currently unavailable due to an AI service "
            "authentication issue.",
        ),
        (
            openai_provider.OpenAIRateLimitError,
            503,
            "AI service is temporarily unavailable. Please try again later.",
        ),
        (
            openai_provider.OpenAITimeoutError,
            504,
            "The AI service took too long to respond. Please try again.",
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
            "AI response generation failed due to an unknown error. "
            "Please try again later.",
        ),
    ],
)
@pytest.mark.parametrize(
    ("endpoint", "generator_name", "payload"),
    [
        (
            "/applications/plan",
            "generate_plan",
            {
                "profile_id": 3,
                "job_ad": "Data scientist role",
            },
        ),
        (
            "/applications/generate",
            "generate_job_application",
            {
                "profile_id": 3,
                "job_ad": "Data scientist role",
                "application_plan": "Emphasize data analysis experience",
            },
        ),
    ],
)
def test_generate_application_returns_sanitized_provider_errors(
    client,
    monkeypatch,
    provider_error,
    status_code,
    detail,
    endpoint,
    generator_name,
    payload,
):
    monkeypatch.setattr(
        application_generator,
        generator_name,
        Mock(side_effect=provider_error("private upstream details")),
    )

    response = client.post(endpoint, json=payload)

    assert response.status_code == status_code
    assert response.json() == {"detail": detail}
    assert "private upstream details" not in response.text


def test_generate_application_returns_not_found_without_calling_provider(
    client,
    monkeypatch,
):
    generate = Mock()
    monkeypatch.setattr(applications, "get_profile_object", Mock(return_value=None))
    monkeypatch.setattr(application_generator,
                        "generate_job_application", generate)

    response = client.post(
        "/applications/generate",
        json={
            "profile_id": 999_999,
            "job_ad": "Data scientist role",
            "application_plan": "Emphasize data analysis experience",
        },
    )

    assert response.status_code == 404
    generate.assert_not_called()


@pytest.mark.parametrize(
    "payload",
    [
        {"profile_id": 3},
        {
            "profile_id": 3,
            "job_ad": " \t\n ",
            "application_plan": "Valid application plan",
        },
        {
            "profile_id": 3,
            "job_ad": "x" * 50_001,
            "application_plan": "Valid application plan",
        },
        {
            "profile_id": 0,
            "job_ad": "Data scientist role",
            "application_plan": "Valid application plan",
        },
        {
            "profile_id": "not-an-integer",
            "job_ad": "Data scientist role",
            "application_plan": "Valid application plan",
        },
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "application_plan": "Valid application plan",
            "unexpected": "value",
        },
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "application_plan": " \t\n ",
        },
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "application_plan": "x" * 50_001,
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
    monkeypatch.setattr(applications, "get_profile_object", load_profile)
    monkeypatch.setattr(
        application_generator,
        "generate_job_application",
        generate,
    )

    response = client.post("/applications/generate", json=payload)

    assert response.status_code == 422
    load_profile.assert_not_called()
    generate.assert_not_called()


@pytest.mark.parametrize(
    "payload",
    [
        {"profile_id": 3},
        {"profile_id": 3, "job_ad": " \t\n "},
        {"profile_id": 3, "job_ad": "x" * 50_001},
        {"profile_id": 0, "job_ad": "Data scientist role"},
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "user_guidance": "x" * 5_001,
        },
        {
            "profile_id": 3,
            "job_ad": "Data scientist role",
            "unexpected": "value",
        },
    ],
)
def test_invalid_plan_requests_do_not_load_profile_or_call_provider(
    client,
    monkeypatch,
    payload,
):
    load_profile = Mock()
    generate = Mock()
    monkeypatch.setattr(applications, "get_profile_object", load_profile)
    monkeypatch.setattr(application_generator, "generate_plan", generate)

    response = client.post("/applications/plan", json=payload)

    assert response.status_code == 422
    load_profile.assert_not_called()
    generate.assert_not_called()
