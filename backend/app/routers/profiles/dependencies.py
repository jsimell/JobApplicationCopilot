from typing import Annotated, TypeAlias

from fastapi import HTTPException, Path

from app import database

PositivePathId: TypeAlias = Annotated[int, Path(gt=0)]


def ensure_profile_exists(
    profile_id: PositivePathId,
) -> None:
    basic_details = database.get_basic_details(profile_id)

    if basic_details is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )
