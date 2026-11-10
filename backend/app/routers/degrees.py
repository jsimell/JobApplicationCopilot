from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.dependencies import get_existing_profile
from app.models import Degree, DegreeCreate, DegreeResponse, ProfileResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/degrees",
    status_code=201,
    response_model=DegreeResponse,
)
def create_degree(profile_id: int, degree: DegreeCreate):
    try:
        return database.create_degree(
            profile_id,
            **degree.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/degrees",
    response_model=list[DegreeResponse],
)
def get_degrees(profile: ProfileResponse = Depends(get_existing_profile)):
    return database.get_degrees(profile.profile_id)


@router.patch("/degrees/{degree_id}", response_model=DegreeResponse)
def update_degree(degree_id: int, degree: Degree):
    fields = degree.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )
    updated = database.update_degree(degree_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Degree not found")
    return updated


@router.delete("/degrees/{degree_id}", status_code=204)
def delete_degree(degree_id: int):
    deleted = database.delete_degree(degree_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Degree not found")
