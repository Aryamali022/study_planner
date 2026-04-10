from fastapi import APIRouter,Depends
from backend.utils.depandency import get_current_user
from backend.database import tasks_collection
from backend.model.planner_model import Task
from fastapi import HTTPException
router = APIRouter(
    prefix="/planner",
    tags=["planner"]
)

@router.get("/get-tasks")
def get_tasks(user=Depends(get_current_user)):

    tasks = list(tasks_collection.find(
        {"user_email": user["email"]},
        {"_id": 0}
    ))

    return tasks

@router.post("/add-task")
def add_task(task: Task, user=Depends(get_current_user)):

    new_task = {
        "title": task.title,
        "description": task.description,
        "user_email": user["email"]
    }

    tasks_collection.insert_one(new_task)

    return {"message": "Task added successfully"}

@router.put("/update-task/{task_id}")
def update_task(task_id: str, task: Task, user=Depends(get_current_user)):

    result = tasks_collection.update_one(
        {"_id": task_id, "user_email": user["email"]},
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

    result = tasks_collection.delete_one(
        {"_id": task_id, "user_email": user["email"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}

