from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB = os.getenv("MONGO_DB", "task_manager")
client = MongoClient(MONGO_URL)
db = client[MONGO_DB]
users_collection = db["users"]
tasks_collection = db["tasks"]