from uuid import UUID
from datetime import date
from decimal import Decimal
from typing import ClassVar, Literal

from pydantic import BaseModel, model_validator


class _PatchModel(BaseModel):
    _non_nullable_fields: ClassVar[tuple[str, ...]] = ()

    @model_validator(mode="after")
    def reject_null_non_nullable_fields(self):
        for field in self._non_nullable_fields:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


# Profile Models
class Profile(_PatchModel):
    _non_nullable_fields = ("full_name", "headline")

    full_name: str | None = None
    headline: str | None = None
    location: str | None = None
    summary: str | None = None
    career_goals_description: str | None = None


class ProfileCreate(Profile):
    full_name: str
    headline: str
    user_id: UUID


class ProfileResponse(ProfileCreate):
    profile_id: int


# Work Experience Models
class WorkExperience(_PatchModel):
    _non_nullable_fields = ("title", "company", "start_date")

    title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None


class WorkExperienceCreate(WorkExperience):
    title: str
    company: str
    start_date: date


class WorkExperienceResponse(WorkExperienceCreate):
    work_experience_id: int
    profile_id: int


# Project Models
class Project(_PatchModel):
    _non_nullable_fields = ("title", "status")

    title: str | None = None
    subtitle: str | None = None
    project_date: date | None = None
    status: Literal["ongoing", "completed"] = "completed"
    description: str | None = None
    url: str | None = None


class ProjectCreate(Project):
    title: str


class ProjectResponse(ProjectCreate):
    project_id: int
    profile_id: int


# Skill Models
class Skill(_PatchModel):
    _non_nullable_fields = ("name",)

    name: str | None = None
    proficiency: str | None = None


class SkillCreate(Skill):
    name: str


class SkillResponse(SkillCreate):
    skill_id: int
    profile_id: int


# Language Models
class Language(_PatchModel):
    _non_nullable_fields = ("language", "proficiency")

    language: str | None = None
    proficiency: str | None = None


class LanguageCreate(Language):
    language: str
    proficiency: str


class LanguageResponse(LanguageCreate):
    language_id: int
    profile_id: int


# Degree Models
class Degree(_PatchModel):
    _non_nullable_fields = ("title", "school")

    title: str | None = None
    school: str | None = None
    finished_date: date | None = None
    location: str | None = None
    gpa: Decimal | None = None
    major: str | None = None
    minor: str | None = None
    additional_information: str | None = None


class DegreeCreate(Degree):
    title: str
    school: str


class DegreeResponse(DegreeCreate):
    degree_id: int
    profile_id: int


# Hobby Models
class Hobby(_PatchModel):
    _non_nullable_fields = ("name",)

    name: str | None = None
    description: str | None = None


class HobbyCreate(Hobby):
    name: str


class HobbyResponse(HobbyCreate):
    hobby_id: int
    profile_id: int


# Project-Skill Association Models
class ProjectSkill(BaseModel):
    project_id: int
    skill_id: int
