import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import auth, resume, job, interview, report, history, dashboard

settings = get_settings()
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Interview Coach API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "AI Interview Coach API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy", "ai_provider": settings.AI_PROVIDER}


app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(job.router)
app.include_router(interview.router)
app.include_router(report.router)
app.include_router(history.router)
app.include_router(dashboard.router)