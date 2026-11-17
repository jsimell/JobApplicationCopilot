from fastapi import APIRouter, HTTPException
from psycopg.errors import UniqueViolation

from app import database
from app.models import ProjectSkill

router = APIRouter()


@router.post(
    "/projects/{project_id}/skills/{skill_id}",
    status_code=201,
    response_model=ProjectSkill,
)
def create_project_skill(project_id: int, skill_id: int):
    try:
        created = database.create_project_skill(project_id, skill_id)

    except UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="Skill is already associated with this project"
        )

    if created is None:
        raise HTTPException(
            status_code=404,
            detail="Project or skill not found, or they belong to different profiles"
        )

    return created


@router.get(
    "/projects/{project_id}/skills",
    status_code=200,
    response_model=list[ProjectSkill],
)
def get_project_skills(project_id: int):

    if database.get_project(project_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return database.get_project_skills(project_id)


@router.delete(
    "/projects/{project_id}/skills/{skill_id}",
    status_code=204,
)
def delete_project_skill(project_id: int, skill_id: int):
    deleted = database.delete_project_skill(project_id, skill_id)

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Project-skill association not found"
        )
