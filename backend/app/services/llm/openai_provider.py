import os
from functools import lru_cache

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    OpenAIError,
    RateLimitError,
)

REQUEST_TIMEOUT_SECONDS = 15.0
MAX_RETRIES = 1


class OpenAIProviderError(Exception):
    """Base class for sanitized errors raised by the OpenAI integration."""


class OpenAIConfigurationError(OpenAIProviderError):
    pass


class OpenAIAuthenticationError(OpenAIProviderError):
    pass


class OpenAIRateLimitError(OpenAIProviderError):
    pass


class OpenAITimeoutError(OpenAIProviderError):
    pass


class OpenAIConnectionError(OpenAIProviderError):
    pass


class OpenAIServerError(OpenAIProviderError):
    pass


class OpenAIRequestError(OpenAIProviderError):
    pass


# Cache the client to reuse connections without requiring credentials at import time.
@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise OpenAIConfigurationError(
            "Application generation is not configured."
        )
    return OpenAI(
        api_key=api_key,
        timeout=REQUEST_TIMEOUT_SECONDS,
        max_retries=MAX_RETRIES,
    )


def generate_text(instructions: str, input: str) -> str:
    model = os.environ.get("OPENAI_MODEL", "").strip()
    if not model:
        raise OpenAIConfigurationError(
            "Application generation is not configured."
        )

    client = get_openai_client()
    try:
        response = client.responses.create(
            model=model,
            instructions=instructions,
            input=input,
        )
    except AuthenticationError:
        raise OpenAIAuthenticationError from None
    except RateLimitError:
        raise OpenAIRateLimitError from None
    except APITimeoutError:
        raise OpenAITimeoutError from None
    except APIConnectionError:
        raise OpenAIConnectionError from None
    except APIStatusError as error:
        if error.status_code >= 500:
            raise OpenAIServerError from None
        raise OpenAIRequestError from None
    except OpenAIError:
        raise OpenAIProviderError from None

    return response.output_text
