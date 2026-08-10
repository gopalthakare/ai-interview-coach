import os
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..security import get_current_user
from ..services.resume_parser import extract_text_from_pdf, parse_resume

router = APIRouter(prefix="/resume", tags=["resume"])
settings = get_settings()


def _sanitize_filename(filename: str) -> str:
    """Strip directory components and any character that isn't safe in a
    filename, so a crafted filename (e.g. containing "../") can't escape
    the uploads directory."""
    name = os.path.basename(filename).strip()
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    name = name.lstrip(".") or "resume.pdf"
    return name[-150:]

@router.post("/upload", response_model=schemas.ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_name = _sanitize_filename(file.filename)
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = (upload_dir / f"{user.id}_{safe_name}").resolve()
    if upload_dir not in dest.parents:
        raise HTTPException(status_code=400, detail="Invalid filename")
    dest.write_bytes(await file.read())
    text = extract_text_from_pdf(str(dest))
    parsed = parse_resume(text)
    existing = (
    db.query(models.Resume)
    .filter(models.Resume.user_id == user.id)
    .first()
)

    if existing:
        existing.filename = file.filename
        existing.file_path = str(dest)
        existing.raw_text = text
        existing.skills = parsed.get("skills", [])
        existing.education = parsed.get("education", [])
        existing.experience = parsed.get("experience", [])
        existing.projects = parsed.get("projects", [])
        existing.certifications = parsed.get("certifications", [])

        db.commit()
        db.refresh(existing)
        return existing

    resume = models.Resume(
        user_id=user.id,
        filename=file.filename,
        file_path=str(dest),
        raw_text=text,
        skills=parsed.get("skills", []),
        education=parsed.get("education", []),
        experience=parsed.get("experience", []),
        projects=parsed.get("projects", []),
        certifications=parsed.get("certifications", []),
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("", response_model=Optional[schemas.ResumeOut])
def get_latest(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user.id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )


@router.post("/extract", response_model=schemas.ResumeOut)
def re_extract(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == user.id)
        .order_by(models.Resume.uploaded_at.desc())
        .first()
    )
    if not resume or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="No resume file to extract")
    text = extract_text_from_pdf(resume.file_path)
    parsed = parse_resume(text)
    resume.raw_text = text
    resume.skills = parsed.get("skills", [])
    resume.education = parsed.get("education", [])
    resume.experience = parsed.get("experience", [])
    resume.projects = parsed.get("projects", [])
    resume.certifications = parsed.get("certifications", [])
    db.commit(); db.refresh(resume)
    return resume