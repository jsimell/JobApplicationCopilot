from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import ForeignKeyViolation

from app import database
from app.routers.profiles.dependencies import (
    PositivePathId,
    ensure_profile_exists,
)
from app.models import Language, LanguageCreate, LanguageResponse

router = APIRouter()


@router.post(
    "/profiles/{profile_id}/languages",
    status_code=201,
    response_model=LanguageResponse,
)
def create_language(
    profile_id: PositivePathId,
    language: LanguageCreate,
):
    try:
        return database.create_language(
            profile_id,
            **language.model_dump()
        )
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )


@router.get(
    "/profiles/{profile_id}/languages",
    response_model=list[LanguageResponse],
)
def get_languages(
    profile_id: PositivePathId,
    _: None = Depends(ensure_profile_exists),
):
    return database.get_languages(profile_id)


@router.patch("/languages/{language_id}", response_model=LanguageResponse)
def update_language(
    language_id: PositivePathId,
    language: Language,
):
    fields = language.model_dump(exclude_unset=True)
    updated = database.update_language(language_id, **fields)
    if updated is None:
        raise HTTPException(
            status_code=404, detail="Language not found")
    return updated


@router.delete("/languages/{language_id}", status_code=204)
def delete_language(language_id: PositivePathId):
    deleted = database.delete_language(language_id)
    if deleted is None:
        raise HTTPException(
            status_code=404, detail="Language not found")
