import logging

from fastapi import APIRouter, HTTPException

from app.models import (
    ApplicationGenerationRequest,
    ApplicationGenerationResponse,
)
from app.services import application_generator
from app.services.llm.openai_provider import (
    OpenAIAuthenticationError,
    OpenAIConfigurationError,
    OpenAIConnectionError,
    OpenAIProviderError,
    OpenAIRateLimitError,
    OpenAIServerError,
    OpenAITimeoutError,
)
from app.services.profile_builder import get_profile_object

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/applications/generate", response_model=ApplicationGenerationResponse)
def generate_application(request: ApplicationGenerationRequest):
    profile_context = get_profile_object(request.profile_id)
    if profile_context is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        application_text = application_generator.generate_job_application(
            request.job_ad,
            profile_context,
        )
    except OpenAIConfigurationError:
        logger.error("Application generation is missing provider configuration")
        raise HTTPException(
            status_code=503,
            detail="Application generation is currently unavailable due to a configuration issue.",
        ) from None
    except OpenAIAuthenticationError:
        logger.error("OpenAI authentication failed for application generation")
        raise HTTPException(
            status_code=503,
            detail="Application generation is currently unavailable due to an AI service authentication issue.",
        ) from None
    except OpenAIRateLimitError:
        logger.warning("OpenAI rate-limited an application generation request")
        raise HTTPException(
            status_code=503,
            detail="Application generation is temporarily unavailable. Please try again later.",
        ) from None
    except OpenAITimeoutError:
        logger.warning("OpenAI timed out during application generation")
        raise HTTPException(
            status_code=504,
            detail="Application generation took too long. Please try again.",
        ) from None
    except OpenAIConnectionError:
        logger.warning("Connection to OpenAI failed during application generation")
        raise HTTPException(
            status_code=503,
            detail="Could not connect to the external AI service. Please try again later.",
        ) from None
    except OpenAIServerError:
        logger.warning("OpenAI server error during application generation")
        raise HTTPException(
            status_code=502,
            detail="The external AI service encountered an error. Please try again later.",
        ) from None
    except OpenAIProviderError:
        logger.exception("Unexpected OpenAI provider error during application generation")
        raise HTTPException(
            status_code=502,
            detail="Application generation failed due to an unknown error. Please try again later.",
        ) from None

    return ApplicationGenerationResponse(application_text=application_text)
