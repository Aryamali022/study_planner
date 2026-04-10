from uuid import uuid4

tasks = []

def get_all_tasks():
    return tasks

def create_task(task):
    new_task = {
        "id": str(uuid4()),
        "title": task.title,
        "completed": False
    }
    tasks.append(new_task)
    return new_task

def update_task(task_id):
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            return task
    return {"error": "Task not found"}

def delete_task(task_id):
    global tasks
    tasks = [task for task in tasks if task["id"] != task_id]
    return {"message": "Task deleted"}