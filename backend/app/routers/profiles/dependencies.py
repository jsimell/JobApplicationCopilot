from fastapi import HTTPException

from app import database
from app.models import ProfileResponse


def get_existing_profile(profile_id: int):
    profile = database.get_profile(profile_id)

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return ProfileResponse.model_validate(profile)
