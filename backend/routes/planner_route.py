from fastapi import APIRouter,Depends
from backend.utils.depandency import get_current_user
from backend.database import tasks_collection
from backend.model.planner_model import Task
from fastapi import HTTPException
from bson.objectid import ObjectId

router = APIRouter(
    tags=["planner"]
)

@router.get("/get-tasks")
def get_tasks(user=Depends(get_current_user)):

    tasks = list(tasks_collection.find(
        {"user_email": user["email"]},
        {"title": 1, "description": 1}
    ))

    # Convert MongoDB ObjectId to string id for frontend usage
    for task in tasks:
        task["id"] = str(task["_id"])
        del task["_id"]

    return tasks

@router.post("/add-task")
def add_task(task: Task, user=Depends(get_current_user)):

    new_task = {
        "title": task.title,
        "description": task.description,
        "user_email": user["email"]
    }

    result = tasks_collection.insert_one(new_task)

    return {"message": "Task added successfully", "id": str(result.inserted_id)}

@router.put("/update-task/{task_id}")
def update_task(task_id: str, task: Task, user=Depends(get_current_user)):

    try:
        task_obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task id")

    result = tasks_collection.update_one(
        {"_id": task_obj_id, "user_email": user["email"]},
        {"$set": {
            "title": task.title,
            "description": task.description
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task updated"}

@router.delete("/delete-task/{task_id}")
def delete_task(task_id: str, user=Depends(get_current_user)):

    try:
        task_obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task id")

    result = tasks_collection.delete_one(
        {"_id": task_obj_id, "user_email": user["email"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}

