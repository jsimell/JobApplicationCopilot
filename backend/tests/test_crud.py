
"""
Integration tests for the Career Profile Manager API.

These tests were generated with AI. By describing the test cases and
expected behaviors to an LLM, a comprehensive prompt was created to
guide GitHub Copilot in generating the actual test implementations.

The tests use pytest, FastAPI's TestClient, and a separate PostgreSQL
test database to verify CRUD operations, error handling, input validation,
and database constraints.
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from decimal import Decimal
import os
from typing import Any
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.encoders import jsonable_encoder
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.main import app

TEST_DATABASE = "career_profiles_test"

RESOURCE_CASES = [
    pytest.param(
        {
            "name": "work_experiences",
            "id_field": "work_experience_id",
            "fields": [
                "title", "company", "location", "start_date", "end_date",
                "description",
            ],
            "required_fields": ["title", "company"],
            "all_payload": {
                "title": "Engineer",
                "company": "Example Corp",
                "location": "Remote",
                "start_date": "2020-01-02",
                "end_date": "2023-04-05",
                "description": "Built reliable systems",
            },
            "update_field": "title",
            "update_value": "Senior engineer",
            "second_update": {"company": "Updated Corp", "location": "London"},
            "nullable_field": "location",
            "empty_string_field": "description",
            "invalid_type_field": "title",
        },
        id="work_experiences",
    ),
    pytest.param(
        {
            "name": "projects",
            "id_field": "project_id",
            "fields": [
                "title", "subtitle", "start_date", "end_date",
                "description", "url",
            ],
            "required_fields": ["title"],
            "all_payload": {
                "title": "Portfolio",
                "subtitle": "Personal website",
                "start_date": "2021-02-03",
                "end_date": "2022-05-06",
                "description": "A portfolio project",
                "url": "https://example.test/portfolio",
            },
            "update_field": "title",
            "update_value": "Updated portfolio",
            "second_update": {
                "subtitle": "Updated subtitle",
                "description": "Updated description",
            },
            "nullable_field": "subtitle",
            "empty_string_field": "description",
            "invalid_type_field": "title",
        },
        id="projects",
    ),
    pytest.param(
        {
            "name": "degrees",
            "id_field": "degree_id",
            "fields": [
                "finished_date", "title", "school", "location", "gpa",
                "major", "minor", "additional_information",
            ],
            "required_fields": ["title", "school"],
            "all_payload": {
                "finished_date": "2019-06-15",
                "title": "Bachelor of Science",
                "school": "Example University",
                "location": "Boston",
                "gpa": "3.75",
                "major": "Computer Science",
                "minor": "Mathematics",
                "additional_information": "Honors",
            },
            "update_field": "title",
            "update_value": "Master of Science",
            "second_update": {
                "school": "Updated University",
                "major": "Data Science",
            },
            "nullable_field": "major",
            "empty_string_field": "additional_information",
            "invalid_type_field": "title",
        },
        id="degrees",
    ),
    pytest.param(
        {
            "name": "skills",
            "id_field": "skill_id",
            "fields": ["name", "proficiency"],
            "required_fields": ["name"],
            "all_payload": {"name": "Python", "proficiency": "Advanced"},
            "update_field": "name",
            "update_value": "Rust",
            "second_update": {"name": "TypeScript", "proficiency": "Expert"},
            "nullable_field": "proficiency",
            "empty_string_field": "name",
            "invalid_type_field": "name",
        },
        id="skills",
    ),
    pytest.param(
        {
            "name": "languages",
            "id_field": "language_id",
            "fields": ["language", "proficiency"],
            "required_fields": ["language", "proficiency"],
            "all_payload": {"language": "English", "proficiency": "Fluent"},
            "update_field": "language",
            "update_value": "French",
            "second_update": {"language": "Spanish", "proficiency": "Native"},
            "nullable_field": None,
            "empty_string_field": "language",
            "invalid_type_field": "language",
        },
        id="languages",
    ),
    pytest.param(
        {
            "name": "hobbies",
            "id_field": "hobby_id",
            "fields": ["name", "description"],
            "required_fields": ["name"],
            "all_payload": {
                "name": "Cycling",
                "description": "Weekend road cycling",
            },
            "update_field": "name",
            "update_value": "Hiking",
            "second_update": {
                "name": "Photography",
                "description": "Landscape photography",
            },
            "nullable_field": "description",
            "empty_string_field": "description",
            "invalid_type_field": "name",
        },
        id="hobbies",
    ),
]

RESOURCE_BY_NAME = {case.values[0]["name"]: case.values[0] for case in RESOURCE_CASES}
NULLABLE_RESOURCE_CASES = [
    pytest.param(case.values[0], id=case.id)
    for case in RESOURCE_CASES
    if case.values[0]["nullable_field"] is not None
]


def _checked_connection() -> psycopg.Connection:
    connection = psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row,
    )
    database_name = connection.execute(
        "SELECT current_database() AS database_name"
    ).fetchone()["database_name"]
    if database_name != TEST_DATABASE:
        connection.close()
        raise AssertionError(
            f"Refusing database operation against {database_name!r}; "
            f"expected {TEST_DATABASE!r}"
        )
    return connection


def _fetch_one(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with _checked_connection() as connection:
        return connection.execute(query, params).fetchone()


def _fetch_all(
    query: str, params: tuple[Any, ...] = ()
) -> list[dict[str, Any]]:
    with _checked_connection() as connection:
        return connection.execute(query, params).fetchall()


def _profile_payload(user_id: UUID, **overrides: Any) -> dict[str, Any]:
    return {
        "user_id": str(user_id),
        "full_name": "Test User",
        "headline": "Original headline",
        "location": "Original location",
        "summary": "Original summary",
        "career_goals_description": "Original career goal",
        **overrides,
    }


def _assert_resource_data(
    response_data: dict[str, Any],
    resource: dict[str, Any],
    profile_id: int,
    payload: dict[str, Any],
) -> int:
    record_id = response_data[resource["id_field"]]
    assert isinstance(record_id, int) and record_id > 0
    assert response_data["profile_id"] == profile_id
    for field in resource["fields"]:
        assert response_data[field] == jsonable_encoder(payload.get(field))
    return record_id


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def created_users(client: TestClient) -> Iterator[Callable[[], UUID]]:
    user_ids: list[UUID] = []

    def create_user() -> UUID:
        response = client.post("/users")
        assert response.status_code == 201, response.text
        user_id = UUID(response.json()["user_id"])
        user_ids.append(user_id)
        return user_id

    yield create_user

    if user_ids:
        with _checked_connection() as connection:
            connection.execute(
                "DELETE FROM profiles WHERE user_id = ANY(%s)",
                (user_ids,),
            )
            connection.execute(
                "DELETE FROM users WHERE user_id = ANY(%s)",
                (user_ids,),
            )


@pytest.fixture
def user_id(created_users: Callable[[], UUID]) -> UUID:
    return created_users()


@pytest.fixture
def profile_factory(
    client: TestClient, created_users: Callable[[], UUID]
) -> Callable[..., dict[str, Any]]:
    def create_profile(
        *,
        user_id: UUID | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        owner_id = user_id or created_users()
        response = client.post(
            "/profiles",
            json=payload if payload is not None else _profile_payload(
                owner_id),
        )
        assert response.status_code == 201, response.text
        return response.json()

    return create_profile


@pytest.fixture
def profile(
    profile_factory: Callable[..., dict[str, Any]], user_id: UUID
) -> dict[str, Any]:
    return profile_factory(user_id=user_id)


@pytest.fixture
def child_factory(
    client: TestClient,
) -> Callable[[dict[str, Any], int, dict[str, Any] | None], dict[str, Any]]:
    def create_child(
        resource: dict[str, Any],
        profile_id: int,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        response = client.post(
            f"/profiles/{profile_id}/{resource['name']}",
            json=payload if payload is not None else resource["all_payload"],
        )
        assert response.status_code == 201, response.text
        return response.json()

    return create_child


@pytest.fixture
def child_record(
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
    resource: dict[str, Any],
) -> dict[str, Any]:
    return child_factory(resource, profile["profile_id"])


@pytest.fixture
def project_and_skill(
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    project = child_factory(
        RESOURCE_BY_NAME["projects"], profile["profile_id"])
    skill = child_factory(RESOURCE_BY_NAME["skills"], profile["profile_id"])
    return project, skill


# 1. User tests
def test_1_1_get_users_when_none_exist(client: TestClient) -> None:
    response = client.get("/users")
    assert response.status_code == 200
    assert response.json() == []


def test_1_2_1_3_create_two_users_with_distinct_uuids(
    client: TestClient,
    created_users: Callable[[], UUID],
) -> None:
    first_id = created_users()
    second_id = created_users()
    assert first_id != second_id

    first_response = client.get("/users")
    assert first_response.status_code == 200
    returned_ids = {UUID(user["user_id"]) for user in first_response.json()}
    assert {first_id, second_id} <= returned_ids


def test_1_4_1_5_get_and_verify_two_created_users(
    client: TestClient,
    created_users: Callable[[], UUID],
) -> None:
    user_ids = {created_users(), created_users()}
    response = client.get("/users")
    assert response.status_code == 200
    returned_ids = {UUID(user["user_id"]) for user in response.json()}
    assert user_ids <= returned_ids

    database_users = _fetch_all(
        "SELECT user_id FROM users WHERE user_id = ANY(%s)",
        (list(user_ids),),
    )
    assert {row["user_id"] for row in database_users} == user_ids


def test_get_profile_for_existing_user(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.get(f"/users/{profile['user_id']}/profile")
    assert response.status_code == 200
    assert response.json() == profile


def test_get_profile_for_user_without_profile(
    client: TestClient, created_users: Callable[[], UUID]
) -> None:
    user_id = created_users()
    response = client.get(f"/users/{user_id}/profile")
    assert response.status_code == 404


# 2. Profile tests
def test_2_1_1_create_profile_with_all_fields(
    client: TestClient, user_id: UUID
) -> None:
    payload = _profile_payload(user_id)
    response = client.post("/profiles", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["profile_id"] > 0
    assert data["user_id"] == str(user_id)
    for field, value in payload.items():
        if field != "user_id":
            assert data[field] == value


def test_2_1_2_create_profile_with_only_required_fields(
    client: TestClient, user_id: UUID
) -> None:
    response = client.post(
        "/profiles",
        json={
            "user_id": str(user_id),
            "full_name": "Test User",
            "headline": "Test headline",
        },
    )
    assert response.status_code == 201
    assert response.json()["user_id"] == str(user_id)
    for field in ("location", "summary", "career_goals_description"):
        assert response.json()[field] is None


def test_2_1_3_create_profile_for_nonexistent_user(client: TestClient) -> None:
    response = client.post(
        "/profiles", json=_profile_payload(uuid4())
    )
    assert response.status_code == 404


def test_2_1_4_second_profile_for_same_user_returns_conflict(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.post(
        "/profiles",
        json=_profile_payload(UUID(profile["user_id"]), headline="Duplicate"),
    )
    assert response.status_code == 409


def test_2_1_5_empty_profile_payload_returns_validation_error(
    client: TestClient,
) -> None:
    response = client.post("/profiles", json={})
    assert response.status_code == 422


def test_2_1_6_invalid_user_uuid_returns_validation_error(
    client: TestClient,
) -> None:
    response = client.post("/profiles", json={"user_id": "not-a-uuid"})
    assert response.status_code == 422


def test_profile_create_rejects_missing_or_null_required_fields(
    client: TestClient, user_id: UUID
) -> None:
    payload = _profile_payload(user_id)
    for field in ("user_id", "full_name", "headline"):
        missing_field_payload = payload.copy()
        del missing_field_payload[field]
        assert client.post(
            "/profiles", json=missing_field_payload).status_code == 422

        null_field_payload = {**payload, field: None}
        assert client.post(
            "/profiles", json=null_field_payload).status_code == 422


def test_2_2_1_get_profiles_when_none_exist(client: TestClient) -> None:
    response = client.get("/profiles")
    assert response.status_code == 200
    assert response.json() == []


def test_2_2_2_get_existing_profile_by_id(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.get(f"/profiles/{profile['profile_id']}")
    assert response.status_code == 200
    assert response.json() == profile


def test_2_2_3_get_nonexistent_profile(client: TestClient) -> None:
    response = client.get("/profiles/2147483647")
    assert response.status_code == 404


def test_2_2_4_get_all_profiles_after_creating_two(
    client: TestClient, profile_factory: Callable[..., dict[str, Any]]
) -> None:
    first = profile_factory()
    second = profile_factory()
    response = client.get("/profiles")
    assert response.status_code == 200
    returned = {item["profile_id"]: item for item in response.json()}
    assert returned[first["profile_id"]] == first
    assert returned[second["profile_id"]] == second


def test_2_2_5_different_users_have_distinct_profiles(
    profile_factory: Callable[..., dict[str, Any]]
) -> None:
    first = profile_factory()
    second = profile_factory()
    assert first["profile_id"] != second["profile_id"]
    assert first["user_id"] != second["user_id"]


def test_2_3_1_2_patch_one_profile_field_and_preserve_omitted_fields(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.patch(
        f"/profiles/{profile['profile_id']}",
        json={"headline": "Updated headline"},
    )
    assert response.status_code == 200
    assert response.json()["headline"] == "Updated headline"
    for field in ("full_name", "location", "summary", "career_goals_description"):
        assert response.json()[field] == profile[field]


def test_2_3_3_patch_multiple_profile_fields(
    client: TestClient, profile: dict[str, Any]
) -> None:
    changes = {"headline": "New headline", "location": "Paris"}
    response = client.patch(f"/profiles/{profile['profile_id']}", json=changes)
    assert response.status_code == 200
    assert all(response.json()[field] ==
               value for field, value in changes.items())


def test_2_3_4_explicit_null_optional_profile_field_is_stored_as_null(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.patch(
        f"/profiles/{profile['profile_id']}", json={"location": None}
    )
    assert response.status_code == 200
    assert response.json()["location"] is None
    row = _fetch_one(
        "SELECT location FROM profiles WHERE profile_id = %s",
        (profile["profile_id"],),
    )
    assert row is not None and row["location"] is None


def test_patch_profile_rejects_null_required_fields(
    client: TestClient, profile: dict[str, Any]
) -> None:
    for field in ("full_name", "headline"):
        response = client.patch(
            f"/profiles/{profile['profile_id']}", json={field: None}
        )
        assert response.status_code == 422


def test_2_3_5_empty_string_profile_field_is_stored(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.patch(
        f"/profiles/{profile['profile_id']}", json={"headline": ""}
    )
    assert response.status_code == 200
    assert response.json()["headline"] == ""
    row = _fetch_one(
        "SELECT headline FROM profiles WHERE profile_id = %s",
        (profile["profile_id"],),
    )
    assert row is not None and row["headline"] == ""


def test_2_3_6_empty_profile_patch_returns_bad_request(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.patch(f"/profiles/{profile['profile_id']}", json={})
    assert response.status_code == 400


def test_2_3_7_patch_nonexistent_profile(client: TestClient) -> None:
    response = client.patch("/profiles/2147483647",
                            json={"headline": "Missing"})
    assert response.status_code == 404


def test_2_3_8_patch_profile_with_invalid_field_type(
    client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.patch(
        f"/profiles/{profile['profile_id']}",
        json={"headline": ["invalid"]},
    )
    assert response.status_code == 422


def test_2_4_1_to_2_4_3_delete_profile_once_and_confirm_absence(
    client: TestClient, profile: dict[str, Any]
) -> None:
    profile_id = profile["profile_id"]
    assert client.delete(f"/profiles/{profile_id}").status_code == 204
    assert client.get(f"/profiles/{profile_id}").status_code == 404
    assert client.delete(f"/profiles/{profile_id}").status_code == 404


# 3. Child resource tests. Each case uses the same scenarios against all six routes.
@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_1_1_create_child_with_all_fields_and_generated_id(
    child_record: dict[str, Any],
    profile: dict[str, Any],
    resource: dict[str, Any],
) -> None:
    record_id = _assert_resource_data(
        child_record, resource, profile["profile_id"], resource["all_payload"]
    )
    assert record_id > 0


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_1_2_create_child_with_some_fields_omits_others_as_null(
    resource: dict[str, Any],
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> None:
    payload = {
        field: resource["all_payload"][field]
        for field in resource["required_fields"]
    }
    response = child_factory(resource, profile["profile_id"], payload)
    for name in resource["fields"]:
        expected = payload.get(name)
        if name == "gpa" and expected is not None:
            expected = float(Decimal(expected))
        assert response[name] == expected


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_1_3_create_child_with_empty_payload(
    resource: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
) -> None:
    response = client.post(
        f"/profiles/{profile['profile_id']}/{resource['name']}", json={}
    )
    assert response.status_code == 422


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_child_create_rejects_missing_or_null_required_fields(
    resource: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
) -> None:
    url = f"/profiles/{profile['profile_id']}/{resource['name']}"
    for field in resource["required_fields"]:
        missing_field_payload = resource["all_payload"].copy()
        del missing_field_payload[field]
        assert client.post(url, json=missing_field_payload).status_code == 422

        null_field_payload = {**resource["all_payload"], field: None}
        assert client.post(url, json=null_field_payload).status_code == 422


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_child_create_rejects_invalid_pydantic_field_type(
    resource: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
) -> None:
    payload = {
        **resource["all_payload"],
        resource["invalid_type_field"]: ["invalid"],
    }
    response = client.post(
        f"/profiles/{profile['profile_id']}/{resource['name']}", json=payload
    )
    assert response.status_code == 422


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_1_4_create_child_for_nonexistent_profile(
    resource: dict[str, Any], client: TestClient
) -> None:
    response = client.post(
        f"/profiles/2147483647/{resource['name']}",
        json=resource["all_payload"],
    )
    assert response.status_code == 404


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_1_5_multiple_children_have_distinct_ids(
    resource: dict[str, Any],
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> None:
    first = child_factory(resource, profile["profile_id"])
    second = child_factory(resource, profile["profile_id"])
    assert first[resource["id_field"]] != second[resource["id_field"]]


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_2_1_get_empty_child_collection(
    resource: dict[str, Any], client: TestClient, profile: dict[str, Any]
) -> None:
    response = client.get(
        f"/profiles/{profile['profile_id']}/{resource['name']}"
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_2_2_get_child_collection_with_one_record(
    resource: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    created = child_factory(resource, profile["profile_id"])
    response = client.get(
        f"/profiles/{profile['profile_id']}/{resource['name']}"
    )
    assert response.status_code == 200
    assert created in response.json()


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_2_3_get_child_collection_with_multiple_records(
    resource: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    created = [
        child_factory(resource, profile["profile_id"]),
        child_factory(resource, profile["profile_id"]),
    ]
    response = client.get(
        f"/profiles/{profile['profile_id']}/{resource['name']}"
    )
    assert response.status_code == 200
    returned = {item[resource["id_field"]] for item in response.json()}
    assert {item[resource["id_field"]] for item in created} <= returned


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_2_4_get_children_for_nonexistent_profile(
    resource: dict[str, Any], client: TestClient
) -> None:
    response = client.get(f"/profiles/2147483647/{resource['name']}")
    assert response.status_code == 404


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_2_5_get_another_profiles_empty_child_collection(
    resource: dict[str, Any],
    client: TestClient,
    profile_factory: Callable[..., dict[str, Any]],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    first = profile_factory()
    second = profile_factory()
    first_child = child_factory(resource, first["profile_id"])
    response = client.get(
        f"/profiles/{second['profile_id']}/{resource['name']}"
    )
    assert response.status_code == 200
    assert all(
        item[resource["id_field"]] != first_child[resource["id_field"]]
        for item in response.json()
    )
    assert response.json() == []


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_3_1_2_patch_child_field_and_preserve_omitted_fields(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    record_id = child_record[resource["id_field"]]
    response = client.patch(
        f"/{resource['name']}/{record_id}",
        json={resource["update_field"]: resource["update_value"]},
    )
    assert response.status_code == 200
    assert response.json()[resource["update_field"]
                           ] == resource["update_value"]
    for field in resource["fields"]:
        if field != resource["update_field"]:
            assert response.json()[field] == child_record[field]


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_3_3_patch_multiple_child_fields(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    response = client.patch(
        f"/{resource['name']}/{child_record[resource['id_field']]}",
        json=resource["second_update"],
    )
    assert response.status_code == 200
    for field, expected in resource["second_update"].items():
        assert response.json()[field] == expected


@pytest.mark.parametrize("resource", NULLABLE_RESOURCE_CASES)
def test_3_3_4_explicit_null_optional_child_field_is_stored_as_null(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    field = resource["nullable_field"]
    record_id = child_record[resource["id_field"]]
    response = client.patch(
        f"/{resource['name']}/{record_id}", json={field: None})
    assert response.status_code == 200
    assert response.json()[field] is None
    row = _fetch_one(
        f"SELECT {field} FROM {resource['name']} "
        f"WHERE {resource['id_field']} = %s",
        (record_id,),
    )
    assert row is not None and row[field] is None


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_patch_child_rejects_null_required_fields(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    record_id = child_record[resource["id_field"]]
    for field in resource["required_fields"]:
        response = client.patch(
            f"/{resource['name']}/{record_id}", json={field: None}
        )
        assert response.status_code == 422


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_3_5_empty_child_patch_returns_bad_request(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    response = client.patch(
        f"/{resource['name']}/{child_record[resource['id_field']]}", json={}
    )
    assert response.status_code == 400


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_3_6_patch_nonexistent_child(
    resource: dict[str, Any], client: TestClient
) -> None:
    response = client.patch(
        f"/{resource['name']}/2147483647",
        json={resource["update_field"]: "Missing"},
    )
    assert response.status_code == 404


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_3_7_patch_child_with_invalid_field_type(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    response = client.patch(
        f"/{resource['name']}/{child_record[resource['id_field']]}",
        json={resource["invalid_type_field"]: ["invalid"]},
    )
    assert response.status_code == 422


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_4_1_2_delete_child_and_confirm_collection_absence(
    child_record: dict[str, Any],
    client: TestClient,
    profile: dict[str, Any],
    resource: dict[str, Any],
) -> None:
    record_id = child_record[resource["id_field"]]
    response = client.delete(f"/{resource['name']}/{record_id}")
    assert response.status_code == 204
    collection = client.get(
        f"/profiles/{profile['profile_id']}/{resource['name']}"
    )
    assert collection.status_code == 200
    assert all(
        item[resource["id_field"]] != record_id for item in collection.json()
    )


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_4_3_delete_same_child_again_returns_not_found(
    child_record: dict[str, Any],
    client: TestClient,
    resource: dict[str, Any],
) -> None:
    record_id = child_record[resource["id_field"]]
    assert client.delete(f"/{resource['name']}/{record_id}").status_code == 204
    assert client.delete(f"/{resource['name']}/{record_id}").status_code == 404


@pytest.mark.parametrize("resource", RESOURCE_CASES)
def test_3_4_4_delete_nonexistent_child(
    resource: dict[str, Any], client: TestClient
) -> None:
    assert client.delete(f"/{resource['name']}/2147483647").status_code == 404


# 4. Project-skill association tests
def test_4_1_1_associate_project_and_skill_from_same_profile(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    response = client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    )
    assert response.status_code == 201
    assert response.json() == {
        "project_id": project["project_id"],
        "skill_id": skill["skill_id"],
    }


def test_4_1_2_duplicate_project_skill_association_returns_conflict(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    path = f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    assert client.post(path).status_code == 201
    assert client.post(path).status_code == 409


def test_4_1_3_nonexistent_project_association_returns_not_found(
    client: TestClient, project_and_skill: tuple[dict[str, Any], dict[str, Any]]
) -> None:
    _, skill = project_and_skill
    response = client.post(f"/projects/2147483647/skills/{skill['skill_id']}")
    assert response.status_code == 404


def test_4_1_4_nonexistent_skill_association_returns_not_found(
    client: TestClient, project_and_skill: tuple[dict[str, Any], dict[str, Any]]
) -> None:
    project, _ = project_and_skill
    response = client.post(
        f"/projects/{project['project_id']}/skills/2147483647")
    assert response.status_code == 404


def test_4_1_5_associate_resources_from_different_profiles_returns_not_found(
    client: TestClient,
    profile_factory: Callable[..., dict[str, Any]],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    first = profile_factory()
    second = profile_factory()
    project = child_factory(RESOURCE_BY_NAME["projects"], first["profile_id"])
    skill = child_factory(RESOURCE_BY_NAME["skills"], second["profile_id"])
    response = client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    )
    assert response.status_code == 404


def test_4_1_6_associate_multiple_skills_with_one_project(
    client: TestClient,
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> None:
    project = child_factory(
        RESOURCE_BY_NAME["projects"], profile["profile_id"])
    skills = [
        child_factory(RESOURCE_BY_NAME["skills"], profile["profile_id"])
        for _ in range(2)
    ]
    for skill in skills:
        response = client.post(
            f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
        )
        assert response.status_code == 201


def test_4_1_7_associate_one_skill_with_multiple_projects(
    client: TestClient,
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> None:
    skill = child_factory(RESOURCE_BY_NAME["skills"], profile["profile_id"])
    projects = [
        child_factory(RESOURCE_BY_NAME["projects"], profile["profile_id"])
        for _ in range(2)
    ]
    for project in projects:
        response = client.post(
            f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
        )
        assert response.status_code == 201


def test_4_2_1_get_project_skill_associations_when_empty(
    client: TestClient,
    child_factory: Callable[..., dict[str, Any]],
    profile: dict[str, Any],
) -> None:
    project = child_factory(
        RESOURCE_BY_NAME["projects"], profile["profile_id"])
    response = client.get(f"/projects/{project['project_id']}/skills")
    assert response.status_code == 200
    assert response.json() == []


def test_4_2_2_get_project_skill_associations_after_creation(
    client: TestClient,
    profile: dict[str, Any],
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    create_response = client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    )
    assert create_response.status_code == 201
    response = client.get(f"/projects/{project['project_id']}/skills")
    assert response.status_code == 200
    assert response.json() == [
        {"project_id": project["project_id"], "skill_id": skill["skill_id"]}
    ]


def test_4_2_3_get_associations_for_nonexistent_project(
    client: TestClient,
) -> None:
    assert client.get("/projects/2147483647/skills").status_code == 404


def test_4_2_4_get_associations_isolated_by_project_and_profile(
    client: TestClient,
    profile_factory: Callable[..., dict[str, Any]],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    first = profile_factory()
    second = profile_factory()
    first_project = child_factory(
        RESOURCE_BY_NAME["projects"], first["profile_id"]
    )
    first_skill = child_factory(
        RESOURCE_BY_NAME["skills"], first["profile_id"])
    second_project = child_factory(
        RESOURCE_BY_NAME["projects"], second["profile_id"]
    )

    create_response = client.post(
        f"/projects/{first_project['project_id']}/skills/{first_skill['skill_id']}"
    )
    assert create_response.status_code == 201

    first_response = client.get(
        f"/projects/{first_project['project_id']}/skills"
    )
    assert first_response.status_code == 200
    assert first_response.json() == [
        {
            "project_id": first_project["project_id"],
            "skill_id": first_skill["skill_id"],
        }
    ]

    second_response = client.get(
        f"/projects/{second_project['project_id']}/skills"
    )
    assert second_response.status_code == 200
    assert second_response.json() == []


def test_4_3_1_2_delete_project_skill_association(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    path = f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    assert client.post(path).status_code == 201
    assert client.delete(path).status_code == 204
    row = _fetch_one(
        "SELECT project_id FROM project_skills "
        "WHERE project_id = %s AND skill_id = %s",
        (project["project_id"], skill["skill_id"]),
    )
    assert row is None
    response = client.get(f"/projects/{project['project_id']}/skills")
    assert response.status_code == 200
    assert response.json() == []


def test_4_3_3_delete_same_association_again_returns_not_found(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    path = f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    assert client.post(path).status_code == 201
    assert client.delete(path).status_code == 204
    assert client.delete(path).status_code == 404


# 5. Cascading deletion tests
def test_5_1_deleting_skill_cascades_project_skill_association(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    assert client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    ).status_code == 201
    assert client.delete(f"/skills/{skill['skill_id']}").status_code == 204
    assert _fetch_one(
        "SELECT project_id FROM project_skills "
        "WHERE project_id = %s AND skill_id = %s",
        (project["project_id"], skill["skill_id"]),
    ) is None


def test_5_2_deleting_project_cascades_project_skill_association(
    client: TestClient,
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    assert client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    ).status_code == 201
    assert client.delete(
        f"/projects/{project['project_id']}").status_code == 204
    assert _fetch_one(
        "SELECT project_id FROM project_skills "
        "WHERE project_id = %s AND skill_id = %s",
        (project["project_id"], skill["skill_id"]),
    ) is None


def test_5_3_profile_deletion_cascades_all_six_child_tables(
    client: TestClient,
    profile: dict[str, Any],
    child_factory: Callable[..., dict[str, Any]],
) -> None:
    created = {
        resource["name"]: child_factory(resource, profile["profile_id"])
        for resource in RESOURCE_BY_NAME.values()
    }
    assert client.delete(
        f"/profiles/{profile['profile_id']}").status_code == 204

    table_ids = {
        "work_experiences": "work_experience_id",
        "projects": "project_id",
        "degrees": "degree_id",
        "skills": "skill_id",
        "languages": "language_id",
        "hobbies": "hobby_id",
    }
    for table, primary_key in table_ids.items():
        row = _fetch_one(
            f"SELECT {primary_key} FROM {table} WHERE {primary_key} = %s",
            (created[table][primary_key],),
        )
        assert row is None


def test_5_4_profile_deletion_removes_project_skill_association(
    client: TestClient,
    profile: dict[str, Any],
    project_and_skill: tuple[dict[str, Any], dict[str, Any]],
) -> None:
    project, skill = project_and_skill
    assert client.post(
        f"/projects/{project['project_id']}/skills/{skill['skill_id']}"
    ).status_code == 201
    assert client.delete(
        f"/profiles/{profile['profile_id']}").status_code == 204
    assert _fetch_one(
        "SELECT project_id FROM project_skills "
        "WHERE project_id = %s AND skill_id = %s",
        (project["project_id"], skill["skill_id"]),
    ) is None


def test_5_5_user_remains_after_profile_deletion(
    client: TestClient, profile: dict[str, Any]
) -> None:
    user_id = UUID(profile["user_id"])
    assert client.delete(
        f"/profiles/{profile['profile_id']}").status_code == 204
    row = _fetch_one(
        "SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    assert row is not None and row["user_id"] == user_id


def test_5_6_deleting_same_profile_again_returns_not_found(
    client: TestClient, profile: dict[str, Any]
) -> None:
    path = f"/profiles/{profile['profile_id']}"
    assert client.delete(path).status_code == 204
    assert client.delete(path).status_code == 404
