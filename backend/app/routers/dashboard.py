from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services.matcher import match_resume_to_jd

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    interviews = (
        db.query(models.Interview)
        .filter(models.Interview.user_id == user.id)
        .order_by(models.Interview.started_at.asc()).all()
    )
    total = len(interviews)
    scores = [i.report.overall_score for i in interviews if i.report]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0
    tech = [schemas.TrendPoint(date=i.started_at.strftime("%b %d"), score=int(i.report.technical_score) if i.report else 0) for i in interviews]
    comm = [schemas.TrendPoint(date=i.started_at.strftime("%b %d"), score=int(i.report.communication_score) if i.report else 0) for i in interviews]
    recent = [schemas.RecentItem(id=i.id, role=i.role or "General",
                                 score=int(i.report.overall_score) if i.report else 0,
                                 date=i.started_at.strftime("%b %d, %Y")) for i in reversed(interviews[-5:])]
    resume = db.query(models.Resume).filter(models.Resume.user_id == user.id).order_by(models.Resume.uploaded_at.desc()).first()
    job = db.query(models.JobDescription).filter(models.JobDescription.user_id == user.id).order_by(models.JobDescription.created_at.desc()).first()
    resume_match = 0
    if resume and job:
        resume_match = match_resume_to_jd(resume.skills or [], job.required_skills or [], job.preferred_skills or [])["percentage"]
    topics: dict[str, int] = {}
    for iv in interviews[-5:]:
        if iv.report and iv.report.topics_to_improve:
            for t in iv.report.topics_to_improve:
                topics[t] = topics.get(t, 0) + 1
    suggestions = [t for t, _ in sorted(topics.items(), key=lambda kv: kv[1], reverse=True)[:5]] or [
        "Practice system design fundamentals.",
        "Sharpen behavioral answers with the STAR method.",
        "Review core data structures and complexity.",
        "Upload a resume and set a target JD for tailored suggestions.",
    ]
    return schemas.DashboardOut(
        total_interviews=total, avg_score=avg,
        technical_trend=tech, communication_trend=comm,
        recent=recent, resume_match=resume_match, suggestions=suggestions,
    )