from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    ensure_profile_exists,
)
from app.models import Skill, SkillCreate, SkillResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/skills",
    status_code=201,
    response_model=SkillResponse,
)
def create_skill(
    profile_id: PositivePathId,
    skill: SkillCreate,
):
    try:
        return database.create_skill(
            profile_id,
            **skill.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/skills",
    response_model=list[SkillResponse],
)
def get_skills(
    profile_id: PositivePathId,
    _: None = Depends(ensure_profile_exists),
):
    return database.get_skills(profile_id)


@router.patch("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: PositivePathId,
    skill: Skill,
):
    fields = skill.model_dump(exclude_unset=True)
    updated = database.update_skill(skill_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Skill not found")
    return updated


@router.delete("/skills/{skill_id}", status_code=204)
def delete_skill(skill_id: PositivePathId):
    deleted = database.delete_skill(skill_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Skill not found")
