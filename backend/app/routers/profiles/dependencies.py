from fastapi import HTTPException

from app import database
from app.models import BasicDetailsResponse


def get_existing_basic_details(profile_id: int) -> BasicDetailsResponse:
    basic_details = database.get_basic_details(profile_id)

    if basic_details is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return BasicDetailsResponse.model_validate(basic_details)
