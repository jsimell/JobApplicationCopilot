import logging
from typing import NoReturn

from fastapi import APIRouter, HTTPException

from app.models import (
    ApplicationPlanRequest,
    ApplicationPlanResponse,
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


def handle_openai_error(error: OpenAIProviderError) -> NoReturn:
    if isinstance(error, OpenAIConfigurationError):
        logger.error("AI provider is missing required configuration")
        status_code = 503
        detail = "AI service is currently unavailable due to a configuration issue."
    elif isinstance(error, OpenAIAuthenticationError):
        logger.error("AI provider authentication failed")
        status_code = 503
        detail = "AI features are currently unavailable due to an AI service authentication issue."
    elif isinstance(error, OpenAIRateLimitError):
        logger.warning("AI provider rate-limited a response generation request")
        status_code = 503
        detail = "AI service is temporarily unavailable. Please try again later."
    elif isinstance(error, OpenAITimeoutError):
        logger.warning("AI provider timed out during response generation")
        status_code = 504
        detail = "The AI service took too long to respond. Please try again."
    elif isinstance(error, OpenAIConnectionError):
        logger.warning("Connection to the external AI service failed")
        status_code = 503
        detail = "Could not connect to the external AI service. Please try again later."
    elif isinstance(error, OpenAIServerError):
        logger.warning("The external AI service returned a server error")
        status_code = 502
        detail = "The external AI service encountered an error. Please try again later."
    else:
        logger.exception("Unexpected AI provider error during response generation")
        status_code = 502
        detail = "AI response generation failed due to an unknown error. Please try again later."

    raise HTTPException(status_code=status_code, detail=detail) from None


@router.post("/applications/plan", response_model=ApplicationPlanResponse)
def generate_application_plan(request: ApplicationPlanRequest):
    profile_context = get_profile_object(request.profile_id)
    if profile_context is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        application_plan = application_generator.generate_plan(
            request.job_ad,
            profile_context,
            request.user_guidance,
        )
    except OpenAIProviderError as error:
        handle_openai_error(error)

    return ApplicationPlanResponse(application_plan=application_plan)


@router.post("/applications/generate", response_model=ApplicationGenerationResponse)
def generate_application(request: ApplicationGenerationRequest):
    profile_context = get_profile_object(request.profile_id)
    if profile_context is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        application_text = application_generator.generate_job_application(
            request.job_ad,
            profile_context,
            request.application_plan,
        )
    except OpenAIProviderError as error:
        handle_openai_error(error)

    return ApplicationGenerationResponse(application_text=application_text)
