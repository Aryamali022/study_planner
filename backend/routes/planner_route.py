from fastapi import APIRouter
from model.planner_route import Task
from controller.planner_route import (
    get_all_tasks,
    create_task,
    update_task,
    delete_task
)
router = APIRouter(
    prefix="/planner",
    tags=["planner"]
)

@router.get("/")
def read_tasks():
    return get_all_tasks()

@router.post("/")
def add_task(task: Task):
    return create_task(task)

@router.put("/{task_id}")
def toggle_task(task_id: str):
    return update_task(task_id)

@router.delete("/{task_id}")
def remove_task(task_id: str):
    return delete_task(task_id)

