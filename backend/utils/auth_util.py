import bcrypt
from jose import jwt
from datetime import datetime , timedelta
import os
from dotenv import load_dotenv

load_dotenv()
def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'),bcrypt.gensalt())

def verify_password(password: str, hashed_password: bytes):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def generate_token(data : dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=2)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
    