from uuid import UUID
from datetime import date
from decimal import Decimal
from typing import Annotated, ClassVar, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

RequiredText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=500),
]
OptionalText = Annotated[
    str,
    StringConstraints(max_length=20_000),
]
OptionalUrl = Annotated[
    str,
    StringConstraints(max_length=2_048),
]
NonEmptyText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=50_000,
    ),
]


class _PatchModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    _non_nullable_fields: ClassVar[tuple[str, ...]] = ()

    @model_validator(mode="after")
    def validate_patch_fields(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")

        for field in self._non_nullable_fields:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


# Profile Models
class BasicDetailsUpdate(_PatchModel):
    _non_nullable_fields = ("full_name", "headline")

    full_name: RequiredText | None = None
    headline: RequiredText | None = None
    location: OptionalText | None = None
    summary: OptionalText | None = None
    career_goals_description: OptionalText | None = None


class ProfileCreate(BasicDetailsUpdate):
    full_name: RequiredText
    headline: RequiredText
    user_id: UUID


class BasicDetailsResponse(ProfileCreate):
    profile_id: int


# Work Experience Models
class WorkExperience(_PatchModel):
    _non_nullable_fields = ("title", "company", "start_date")

    title: RequiredText | None = None
    company: RequiredText | None = None
    location: OptionalText | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: OptionalText | None = None

    @model_validator(mode="after")
    def validate_date_order(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("end_date must be on or after start_date")
        return self


class WorkExperienceCreate(WorkExperience):
    title: RequiredText
    company: RequiredText
    start_date: date


class WorkExperienceResponse(WorkExperienceCreate):
    work_experience_id: int
    profile_id: int


# Project Models
class Project(_PatchModel):
    _non_nullable_fields = ("title", "status")

    title: RequiredText | None = None
    subtitle: OptionalText | None = None
    project_date: date | None = None
    status: Literal["ongoing", "completed"] = "completed"
    description: OptionalText | None = None
    url: OptionalUrl | None = None


class ProjectCreate(Project):
    title: RequiredText


class ProjectResponse(ProjectCreate):
    project_id: int
    profile_id: int


# Skill Models
class Skill(_PatchModel):
    _non_nullable_fields = ("name",)

    name: RequiredText | None = None
    proficiency: OptionalText | None = None


class SkillCreate(Skill):
    name: RequiredText


class SkillResponse(SkillCreate):
    skill_id: int
    profile_id: int


# Language Models
class Language(_PatchModel):
    _non_nullable_fields = ("language", "proficiency")

    language: RequiredText | None = None
    proficiency: RequiredText | None = None


class LanguageCreate(Language):
    language: RequiredText
    proficiency: RequiredText


class LanguageResponse(LanguageCreate):
    language_id: int
    profile_id: int


# Degree Models
class Degree(_PatchModel):
    _non_nullable_fields = ("title", "school")

    title: RequiredText | None = None
    school: RequiredText | None = None
    finished_date: date | None = None
    location: OptionalText | None = None
    gpa: Annotated[Decimal, Field(allow_inf_nan=False)] | None = None
    major: OptionalText | None = None
    minor: OptionalText | None = None
    additional_information: OptionalText | None = None


class DegreeCreate(Degree):
    title: RequiredText
    school: RequiredText


class DegreeResponse(DegreeCreate):
    degree_id: int
    profile_id: int


# Hobby Models
class Hobby(_PatchModel):
    _non_nullable_fields = ("name",)

    name: RequiredText | None = None
    description: OptionalText | None = None


class HobbyCreate(Hobby):
    name: RequiredText


class HobbyResponse(HobbyCreate):
    hobby_id: int
    profile_id: int


# Project-Skill Association Models
class ProjectSkill(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: int
    skill_id: int


####################################
# Application Generation Models

class ApplicationPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_ad: NonEmptyText
    profile_id: int = Field(gt=0)
    user_guidance: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            max_length=5_000,
        ),
    ] | None = None


class ApplicationPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application_plan: NonEmptyText


class ApplicationGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_ad: NonEmptyText
    profile_id: int = Field(gt=0)
    application_plan: NonEmptyText


class ApplicationGenerationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application_text: NonEmptyText
