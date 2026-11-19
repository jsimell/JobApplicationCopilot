from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    ensure_profile_exists,
)
from app.models import Hobby, HobbyCreate, HobbyResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/hobbies",
    status_code=201,
    response_model=HobbyResponse,
)
def create_hobby(
    profile_id: PositivePathId,
    hobby: HobbyCreate,
):
    try:
        return database.create_hobby(
            profile_id,
            **hobby.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/hobbies",
    response_model=list[HobbyResponse],
)
def get_hobbies(
    profile_id: PositivePathId,
    _: None = Depends(ensure_profile_exists),
):
    return database.get_hobbies(profile_id)


@router.patch("/hobbies/{hobby_id}", response_model=HobbyResponse)
def update_hobby(
    hobby_id: PositivePathId,
    hobby: Hobby,
):
    fields = hobby.model_dump(exclude_unset=True)
    updated = database.update_hobby(hobby_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Hobby not found")
    return updated


@router.delete("/hobbies/{hobby_id}", status_code=204)
def delete_hobby(hobby_id: PositivePathId):
    deleted = database.delete_hobby(hobby_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Hobby not found")
