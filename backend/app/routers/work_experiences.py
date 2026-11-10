from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.dependencies import get_existing_profile
from app.models import (
    ProfileResponse,
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
def add_work_experience(profile_id: int, work_experience: WorkExperienceCreate):
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
def get_work_experiences(profile: ProfileResponse = Depends(get_existing_profile)):
    return database.get_work_experiences(profile.profile_id)


@router.patch(
    "/work_experiences/{work_experience_id}",
    response_model=WorkExperienceResponse,
)
def update_work_experience(work_experience_id: int, work_experience: WorkExperience):
    fields = work_experience.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )
    updated = database.update_work_experience(work_experience_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Work experience not found")
    return updated


@router.delete("/work_experiences/{work_experience_id}", status_code=204)
def delete_work_experience(work_experience_id: int):
    deleted = database.delete_work_experience(work_experience_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Work experience not found")
