from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException

from app import database
from app.models import BasicDetailsResponse

router = APIRouter()

# User Creation Endpoint (only used when opening the app for the first time to create a user)


@router.post("/users", status_code=201)
def create_user():
    user_id = uuid4()
    database.create_user(user_id)
    return {"user_id": user_id}


@router.get("/users/{user_id}/profile", response_model=BasicDetailsResponse)
def get_user_profile(user_id: UUID):
    basic_details = database.get_basic_details_by_user_id(user_id)
    if basic_details is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return basic_details


@router.get("/users", status_code=200)  # For testing
def get_users():
    users = database.get_users()
    return users
