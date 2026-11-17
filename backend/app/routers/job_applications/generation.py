from fastapi import APIRouter, HTTPException

from app.models import (
    ApplicationGenerationRequest,
    ApplicationGenerationResponse,
)
from app.services import application_generator
from app.services.profile_context import get_profile_context

router = APIRouter()


@router.post("/applications/generate", response_model=ApplicationGenerationResponse)
def generate_application(request: ApplicationGenerationRequest):
    profile_context = get_profile_context(request.user_id)
    if profile_context is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    application_text = application_generator.generate_job_application(
        request.job_ad,
        profile_context,
    )
    return ApplicationGenerationResponse(application_text=application_text)
