from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services.jd_analyzer import analyze_jd, preset_jd
from ..services.matcher import match_resume_to_jd

router = APIRouter(prefix="/job", tags=["job"])

@router.post("/analyze", response_model=schemas.JobAnalysisOut)
def analyze(
    payload: schemas.JobAnalyzeIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if payload.preset:
        parsed = preset_jd(payload.preset); raw = f"[Preset] {payload.preset}"
    elif payload.text:
        parsed = analyze_jd(payload.text); raw = payload.text
    else:
        raise HTTPException(status_code=400, detail="Provide `text` or `preset`")

    jd = models.JobDescription(
        user_id=user.id, role=parsed.get("role", "Unknown"), raw_text=raw,
        required_skills=parsed.get("required_skills", []),
        preferred_skills=parsed.get("preferred_skills", []),
        responsibilities=parsed.get("responsibilities", []),
    )
    db.add(jd); db.commit(); db.refresh(jd)

    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user.id)
        .order_by(models.Resume.uploaded_at.desc()).first()
    )
    match = match_resume_to_jd(
        resume_skills=(resume.skills if resume else []),
        required=jd.required_skills, preferred=jd.preferred_skills,
    )
    return schemas.JobAnalysisOut(
        role=jd.role, required_skills=jd.required_skills,
        preferred_skills=jd.preferred_skills, responsibilities=jd.responsibilities,
        match=schemas.MatchOut(**match),
    )