from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

from fastapi import HTTPException

router = APIRouter(tags=["history"])

@router.get("/history", response_model=List[schemas.HistoryItem])
def list_history(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    interviews = (
        db.query(models.Interview)
        .filter(models.Interview.user_id == user.id)
        .order_by(models.Interview.started_at.desc()).all()
    )
    items: list[schemas.HistoryItem] = []
    for iv in interviews:
        score = int(iv.report.overall_score) if iv.report else 0
        match = int(iv.report.resume_match) if iv.report else 0
        items.append(schemas.HistoryItem(
            id=iv.report.id if iv.report else iv.id, role=iv.role or "General",
            date=iv.started_at.strftime("%b %d, %Y"),
            score=score, resume_match=match,
            difficulty=iv.difficulty, duration_minutes=iv.duration_minutes,
        ))
    return items

@router.delete("/history/{id}")
def delete_history(
    id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    interview = (
        db.query(models.Interview)
        .outerjoin(models.Report)
        .filter(
            models.Interview.user_id == user.id,
            (
                (models.Report.id == id) |
                (models.Interview.id == id)
            )
        )
        .first()
    )

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    db.delete(interview)
    db.commit()

    return {"message": "Interview deleted successfully"}