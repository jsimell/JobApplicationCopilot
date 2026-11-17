from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    get_existing_basic_details,
)
from app.models import BasicDetailsResponse, Project, ProjectCreate, ProjectResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/projects",
    status_code=201,
    response_model=ProjectResponse,
)
def create_project(
    profile_id: PositivePathId,
    project: ProjectCreate,
):
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
def get_projects(
    basic_details: BasicDetailsResponse = Depends(get_existing_basic_details),
):
    return database.get_projects(basic_details.profile_id)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: PositivePathId,
    project: Project,
):
    fields = project.model_dump(exclude_unset=True)
    updated = database.update_project(project_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Project not found")
    return updated


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: PositivePathId):
    deleted = database.delete_project(project_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Project not found")
