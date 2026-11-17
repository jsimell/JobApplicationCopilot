from types import SimpleNamespace
from unittest.mock import Mock

import httpx2
import pytest
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)

from app.services.llm import openai_provider


def _sdk_errors():
    request = httpx2.Request("POST", "https://api.openai.com/v1/responses")
    response_by_status = {
        status: httpx2.Response(status, request=request)
        for status in (401, 429, 400, 500)
    }
    return [
        pytest.param(
            AuthenticationError(
                "private authentication details",
                response=response_by_status[401],
                body={"secret": "value"},
            ),
            openai_provider.OpenAIAuthenticationError,
            id="authentication",
        ),
        pytest.param(
            RateLimitError(
                "private rate limit details",
                response=response_by_status[429],
                body={"secret": "value"},
            ),
            openai_provider.OpenAIRateLimitError,
            id="rate-limit",
        ),
        pytest.param(
            APITimeoutError(request=request),
            openai_provider.OpenAITimeoutError,
            id="timeout",
        ),
        pytest.param(
            APIConnectionError(message="private connection details", request=request),
            openai_provider.OpenAIConnectionError,
            id="connection",
        ),
        pytest.param(
            APIStatusError(
                "private server details",
                response=response_by_status[500],
                body={"secret": "value"},
            ),
            openai_provider.OpenAIServerError,
            id="server-error",
        ),
        pytest.param(
            APIStatusError(
                "private request details",
                response=response_by_status[400],
                body={"secret": "value"},
            ),
            openai_provider.OpenAIRequestError,
            id="request-error",
        ),
    ]


def test_generate_text_returns_openai_output(monkeypatch):
    create = Mock(return_value=SimpleNamespace(output_text="Generated application"))
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr(
        openai_provider,
        "get_openai_client",
        lambda: SimpleNamespace(responses=SimpleNamespace(create=create)),
    )

    result = openai_provider.generate_text("instructions", "input")

    assert result == "Generated application"
    create.assert_called_once_with(
        model="test-model",
        instructions="instructions",
        input="input",
    )


@pytest.mark.parametrize(("sdk_error", "expected_error"), _sdk_errors())
def test_generate_text_translates_openai_errors(
    monkeypatch,
    sdk_error,
    expected_error,
):
    create = Mock(side_effect=sdk_error)
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr(
        openai_provider,
        "get_openai_client",
        lambda: SimpleNamespace(responses=SimpleNamespace(create=create)),
    )

    with pytest.raises(expected_error) as raised:
        openai_provider.generate_text("instructions", "input")

    assert "private" not in str(raised.value)
    assert raised.value.__suppress_context__


def test_openai_client_uses_bounded_timeout_and_single_retry(monkeypatch):
    client = Mock()
    constructor = Mock(return_value=client)
    openai_provider.get_openai_client.cache_clear()
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(openai_provider, "OpenAI", constructor)

    try:
        result = openai_provider.get_openai_client()
    finally:
        openai_provider.get_openai_client.cache_clear()

    assert result is client
    constructor.assert_called_once_with(
        api_key="test-key",
        timeout=30.0,
        max_retries=1,
    )


def test_generate_text_requires_model_configuration(monkeypatch):
    monkeypatch.delenv("OPENAI_MODEL", raising=False)

    with pytest.raises(openai_provider.OpenAIConfigurationError):
        openai_provider.generate_text("instructions", "input")


def test_client_requires_api_key_without_exposing_configuration(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    with pytest.raises(openai_provider.OpenAIConfigurationError) as raised:
        openai_provider.get_openai_client()

    assert "OPENAI_API_KEY" not in str(raised.value)
