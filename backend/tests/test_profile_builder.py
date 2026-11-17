from datetime import date
from decimal import Decimal

from app import database
from app.services.profile_builder import get_profile_object


def test_get_profile_object_assembles_profile_and_related_records(monkeypatch):
    profile_id = 7
    monkeypatch.setattr(
        database,
        "get_basic_details",
        lambda requested_profile_id: {
            "profile_id": requested_profile_id,
            "full_name": "Avery Example",
            "headline": "Software Engineer",
            "location": "Remote",
            "summary": None,
            "career_goals_description": "Build useful products",
        },
    )
    monkeypatch.setattr(
        database,
        "get_work_experiences",
        lambda profile_id: [
            {
                "work_experience_id": 11,
                "profile_id": profile_id,
                "title": "Engineer",
                "company": "Example Co.",
                "start_date": date(2022, 1, 1),
            }
        ],
    )
    monkeypatch.setattr(
        database,
        "get_degrees",
        lambda profile_id: [
            {
                "degree_id": 12,
                "profile_id": profile_id,
                "title": "BSc",
                "school": "Example University",
                "gpa": Decimal("3.9"),
            }
        ],
    )
    monkeypatch.setattr(
        database,
        "get_projects",
        lambda profile_id: [
            {
                "project_id": 13,
                "profile_id": profile_id,
                "title": "Example Project",
            }
        ],
    )
    monkeypatch.setattr(
        database,
        "get_skills",
        lambda profile_id: [
            {
                "skill_id": 14,
                "profile_id": profile_id,
                "name": "Python",
                "proficiency": "Advanced",
            }
        ],
    )
    monkeypatch.setattr(
        database,
        "get_project_skills_for_profile",
        lambda profile_id: [{"project_id": 13, "skill_id": 14}],
    )
    monkeypatch.setattr(database, "get_languages", lambda profile_id: [])
    monkeypatch.setattr(database, "get_hobbies", lambda profile_id: [])

    context = get_profile_object(profile_id)

    assert context == {
        "profile_id": profile_id,
        "full_name": "Avery Example",
        "headline": "Software Engineer",
        "location": "Remote",
        "summary": None,
        "career_goals_description": "Build useful products",
        "work_experiences": [
            {
                "title": "Engineer",
                "company": "Example Co.",
                "start_date": "2022-01-01",
            }
        ],
        "degrees": [
            {
                "title": "BSc",
                "school": "Example University",
                "gpa": 3.9,
            }
        ],
        "projects": [
            {
                "title": "Example Project",
                "skills": [{"name": "Python", "proficiency": "Advanced"}],
            }
        ],
        "skills": [{"name": "Python", "proficiency": "Advanced"}],
        "languages": [],
        "hobbies": [],
    }


def test_get_profile_object_returns_none_for_unknown_profile(monkeypatch):
    monkeypatch.setattr(database, "get_basic_details", lambda profile_id: None)

    assert get_profile_object(999) is None
