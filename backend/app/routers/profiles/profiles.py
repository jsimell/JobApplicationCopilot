from fastapi import APIRouter, HTTPException
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from app import database
from app.models import Profile, ProfileCreate, ProfileResponse
from app.routers.profiles.dependencies import get_existing_profile

router = APIRouter()

# Profile Endpoints


@router.post("/profiles", status_code=201, response_model=ProfileResponse)
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


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def read_profile(profile_id: int):
    return get_existing_profile(profile_id)


@router.get("/profiles", response_model=list[ProfileResponse])
def read_profiles():
    return database.get_profiles()


@router.patch("/profiles/{profile_id}", response_model=ProfileResponse)
def update_profile(profile_id: int, profile: Profile):
    fields = profile.model_dump(exclude_unset=True)

    if not fields:
        raise HTTPException(400, "No fields provided for update")

    updated = database.update_profile(profile_id, **fields)

    if updated is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return updated


@router.delete("/profiles/{profile_id}", status_code=204)
def delete_profile(profile_id: int):
    deleted = database.delete_profile(profile_id)

    if deleted is None:
        raise HTTPException(status_code=404, detail="Profile not found")
