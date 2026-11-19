from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    ensure_profile_exists,
)
from app.models import (
    WorkExperience,
    WorkExperienceCreate,
    WorkExperienceResponse,
)

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/work_experiences",
    status_code=201,
    response_model=WorkExperienceResponse,
)
def add_work_experience(
    profile_id: PositivePathId,
    work_experience: WorkExperienceCreate,
):
    try:
        return database.create_work_experience(
            profile_id,
            **work_experience.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/work_experiences",
    response_model=list[WorkExperienceResponse],
)
def get_work_experiences(
    profile_id: PositivePathId,
    _: None = Depends(ensure_profile_exists),
):
    return database.get_work_experiences(profile_id)


@router.patch(
    "/work_experiences/{work_experience_id}",
    response_model=WorkExperienceResponse,
)
def update_work_experience(
    work_experience_id: PositivePathId,
    work_experience: WorkExperience,
):
    fields = work_experience.model_dump(exclude_unset=True)
    existing = database.get_work_experience(work_experience_id)
    if existing is None:
        raise HTTPException(
            status_code=404, detail="Work experience not found")

    start_date = fields.get("start_date", existing["start_date"])
    end_date = fields.get("end_date", existing["end_date"])
    if end_date is not None and end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date",
        )

    updated = database.update_work_experience(work_experience_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Work experience not found")
    return updated


@router.delete("/work_experiences/{work_experience_id}", status_code=204)
def delete_work_experience(work_experience_id: PositivePathId):
    deleted = database.delete_work_experience(work_experience_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Work experience not found")
