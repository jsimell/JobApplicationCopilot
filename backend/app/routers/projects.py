from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.dependencies import get_existing_profile
from app.models import ProfileResponse, Project, ProjectCreate, ProjectResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/projects",
    status_code=201,
    response_model=ProjectResponse,
)
def create_project(profile_id: int, project: ProjectCreate):
    try:
        return database.create_project(
            profile_id,
            **project.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/projects",
    response_model=list[ProjectResponse],
)
def get_projects(profile: ProfileResponse = Depends(get_existing_profile)):
    return database.get_projects(profile.profile_id)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project: Project):
    fields = project.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )
    updated = database.update_project(project_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Project not found")
    return updated


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: int):
    deleted = database.delete_project(project_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Project not found")
