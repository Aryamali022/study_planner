from fastapi import APIRouter, HTTPException
from backend.database import users_collection
from backend.model.auth_model import User
from backend.utils.auth_util import hash_password, verify_password, generate_token
from backend.utils.depandency import get_current_user
from fastapi import Depends
router = APIRouter()

@router.post("/register")
def sign_up(user : User):
    email = user.email
    password = user.password
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_password = hash_password(password).decode('utf-8')
    users_collection.insert_one({"email": email, "password": hashed_password})
    return {"message": "User created successfully"}

@router.post("/login")
def sign_in(user: User):
    email = user.email
    password = user.password

    db_user = users_collection.find_one({"email": email})

    if not db_user:
        raise HTTPException(status_code=400, detail="no user found with this email")

    stored_password = db_user["password"].encode('utf-8')
    if not isinstance(stored_password, bytes):
        stored_password = bytes(stored_password)

    if not verify_password(password, stored_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = generate_token({"email": email})
    return {"access_token": token}

@router.get("/profile")
def get_profile(user = Depends(get_current_user)):
    return {
        "message": "Welcome to your profile",
        "email": user["email"],
        "task": "this is your task"
    }