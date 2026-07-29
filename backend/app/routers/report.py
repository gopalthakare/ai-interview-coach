from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..security import get_current_user
from ..services.report_builder import report_to_pdf

router = APIRouter(prefix="/report", tags=["report"])
settings = get_settings()


def _user_from_token(token, db):
    try:
        uid = int(jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]).get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user: raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.get("/{report_id}", response_model=schemas.ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r: raise HTTPException(status_code=404, detail="Report not found")
    if r.interview.user_id != user.id: raise HTTPException(status_code=403, detail="Forbidden")
    iv = r.interview
    return schemas.ReportOut(
        id=r.id, role=iv.role or "General",
        date=(iv.ended_at or iv.started_at or datetime.utcnow()).strftime("%b %d, %Y"),
        overall_score=int(r.overall_score), technical_score=int(r.technical_score),
        communication_score=int(r.communication_score),
        strengths=r.strengths or [], weaknesses=r.weaknesses or [],
        skill_gaps=r.skill_gaps or [], topics_to_improve=r.topics_to_improve or [],
        roadmap=r.roadmap or [],
    )


@router.get("/{report_id}/pdf")
def download_pdf(report_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    user = _user_from_token(token, db)
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r or r.interview.user_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    buf = BytesIO(); report_to_pdf(r, buf); buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="interview-report-{r.id}.pdf"'})