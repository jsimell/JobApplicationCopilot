from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import get_existing_basic_details
from app.models import BasicDetailsResponse, Hobby, HobbyCreate, HobbyResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/hobbies",
    status_code=201,
    response_model=HobbyResponse,
)
def create_hobby(profile_id: int, hobby: HobbyCreate):
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
    basic_details: BasicDetailsResponse = Depends(get_existing_basic_details),
):
    return database.get_hobbies(basic_details.profile_id)


@router.patch("/hobbies/{hobby_id}", response_model=HobbyResponse)
def update_hobby(hobby_id: int, hobby: Hobby):
    fields = hobby.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )
    updated = database.update_hobby(hobby_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Hobby not found")
    return updated


@router.delete("/hobbies/{hobby_id}", status_code=204)
def delete_hobby(hobby_id: int):
    deleted = database.delete_hobby(hobby_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Hobby not found")
