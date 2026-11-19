from fastapi import APIRouter, HTTPException
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from app import database
from app.models import BasicDetailsResponse, BasicDetailsUpdate, ProfileCreate
from app.routers.profiles.dependencies import PositivePathId
from app.services.profile_builder import get_profile_object

router = APIRouter()


# Profile creation
@router.post("/profiles", status_code=201, response_model=BasicDetailsResponse)
def create_profile(profile: ProfileCreate):
    try:
        return database.create_profile(
            **profile.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    except UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="User already has a profile"
        )


# Profile deletion
@router.delete("/profiles/{profile_id}", status_code=204)
def delete_profile(profile_id: PositivePathId):
    deleted = database.delete_profile(profile_id)

    if deleted is None:
        raise HTTPException(status_code=404, detail="Profile not found")


# Fetching entire profile data
@router.get("/profiles/{profile_id}")
def read_profile(profile_id: PositivePathId):
    profile_object = get_profile_object(profile_id)
    if profile_object is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_object


# Endpoints for reading and updating profile basic details
@router.get(
    "/profiles/{profile_id}/basic-details",
    response_model=BasicDetailsResponse,
)
def read_basic_details(profile_id: PositivePathId):
    basic_details = database.get_basic_details(profile_id)
    if basic_details is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return basic_details


@router.patch(
    "/profiles/{profile_id}/basic-details",
    response_model=BasicDetailsResponse,
)
def update_basic_details(
    profile_id: PositivePathId,
    basic_details: BasicDetailsUpdate,
):
    fields = basic_details.model_dump(exclude_unset=True)

    updated = database.update_basic_details(profile_id, **fields)

    if updated is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return updated
