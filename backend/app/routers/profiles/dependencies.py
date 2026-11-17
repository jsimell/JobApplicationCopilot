from typing import Annotated, TypeAlias

from fastapi import HTTPException, Path

from app import database
from app.models import BasicDetailsResponse

PositivePathId: TypeAlias = Annotated[int, Path(gt=0)]


def get_existing_basic_details(
    profile_id: PositivePathId,
) -> BasicDetailsResponse:
    basic_details = database.get_basic_details(profile_id)

    if basic_details is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return BasicDetailsResponse.model_validate(basic_details)
