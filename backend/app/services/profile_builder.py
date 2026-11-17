from fastapi.encoders import jsonable_encoder

from app import database


def _without_database_ids(record: dict) -> dict:
    return {
        key: value
        for key, value in record.items()
        if not key.endswith("_id")
    }


def get_profile_object(profile_id: int) -> dict | None:
    profile = database.get_basic_details(profile_id)
    if profile is None:
        return None

    skills = database.get_skills(profile_id)
    skills_by_id = {skill["skill_id"]: skill for skill in skills}

    project_skills: dict[int, list[dict]] = {}
    for association in database.get_project_skills_for_profile(profile_id):
        skill = skills_by_id.get(association["skill_id"])
        if skill is not None:
            project_skills.setdefault(association["project_id"], []).append(
                _without_database_ids(skill)
            )

    context = {
        **_without_database_ids(profile),
        "profile_id": profile_id,
        "work_experiences": [
            _without_database_ids(item)
            for item in database.get_work_experiences(profile_id)
        ],
        "degrees": [
            _without_database_ids(item)
            for item in database.get_degrees(profile_id)
        ],
        "projects": [
            {
                **_without_database_ids(project),
                "skills": project_skills.get(project["project_id"], []),
            }
            for project in database.get_projects(profile_id)
        ],
        "skills": [_without_database_ids(skill) for skill in skills],
        "languages": [
            _without_database_ids(item)
            for item in database.get_languages(profile_id)
        ],
        "hobbies": [
            _without_database_ids(item)
            for item in database.get_hobbies(profile_id)
        ],
    }
    return jsonable_encoder(context)
