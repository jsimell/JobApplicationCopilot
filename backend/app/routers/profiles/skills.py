from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import get_existing_basic_details
from app.models import BasicDetailsResponse, Skill, SkillCreate, SkillResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/skills",
    status_code=201,
    response_model=SkillResponse,
)
def create_skill(profile_id: int, skill: SkillCreate):
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
    basic_details: BasicDetailsResponse = Depends(get_existing_basic_details),
):
    return database.get_skills(basic_details.profile_id)


@router.patch("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(skill_id: int, skill: Skill):
    fields = skill.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )
    updated = database.update_skill(skill_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Skill not found")
    return updated


@router.delete("/skills/{skill_id}", status_code=204)
def delete_skill(skill_id: int):
    deleted = database.delete_skill(skill_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Skill not found")
