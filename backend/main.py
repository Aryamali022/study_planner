from fastapi import FastAPI
from backend.routes.auth_routes import router as auth_router
from backend.routes.planner_route import router as planner_router

app = FastAPI()
app.include_router(auth_router, prefix="/auth")
app.include_router(planner_router, prefix="/planner")

@app.get("/")
def home():
    return {"message" : "server is running"}



