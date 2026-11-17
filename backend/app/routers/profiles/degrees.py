from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    get_existing_basic_details,
)
from app.models import BasicDetailsResponse, Degree, DegreeCreate, DegreeResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/degrees",
    status_code=201,
    response_model=DegreeResponse,
)
def create_degree(
    profile_id: PositivePathId,
    degree: DegreeCreate,
):
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
def get_degrees(
    basic_details: BasicDetailsResponse = Depends(get_existing_basic_details),
):
    return database.get_degrees(basic_details.profile_id)


@router.patch("/degrees/{degree_id}", response_model=DegreeResponse)
def update_degree(
    degree_id: PositivePathId,
    degree: Degree,
):
    fields = degree.model_dump(exclude_unset=True)
    updated = database.update_degree(degree_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Degree not found")
    return updated


@router.delete("/degrees/{degree_id}", status_code=204)
def delete_degree(degree_id: PositivePathId):
    deleted = database.delete_degree(degree_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Degree not found")
