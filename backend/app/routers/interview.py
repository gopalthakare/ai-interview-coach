from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..services.question_generator import generate_next_question
from ..services.answer_evaluator import evaluate_answer
from ..services.report_builder import build_report

router = APIRouter(prefix="/interview", tags=["interview"])
TOTAL_QUESTIONS = 5


def _latest_resume(db, uid):
    return db.query(models.Resume).filter(models.Resume.user_id == uid).order_by(models.Resume.uploaded_at.desc()).first()


def _latest_job(db, uid):
    return db.query(models.JobDescription).filter(models.JobDescription.user_id == uid).order_by(models.JobDescription.created_at.desc()).first()


def _avg_score(db, interview_id):
    evals = (
        db.query(models.Evaluation)
        .join(models.Answer, models.Evaluation.answer_id == models.Answer.id)
        .join(models.Question, models.Answer.question_id == models.Question.id)
        .filter(models.Question.interview_id == interview_id).all()
    )
    return (sum(e.overall for e in evals) / len(evals)) if evals else 70.0


def _gen_question(db, interview, resume, job):
    prev = []
    history = []

    for q in sorted(interview.questions, key=lambda x: x.index):

        prev.append(q.text)

        if q.answer and q.answer.evaluation:
            history.append(
                f"""
Question:
{q.text}

Candidate Answer:
{q.answer.text}

Overall Score:
{int(q.answer.evaluation.overall)}

Missing Concepts:
{", ".join(q.answer.evaluation.missing_concepts)}

"""
    )

    plan = []

    if resume and resume.projects:
        plan.append("Resume Project")

    if job:
        for r in job.responsibilities:
            if len(plan) >= TOTAL_QUESTIONS:
                break
            plan.append(r)

        for s in job.required_skills:
            if len(plan) >= TOTAL_QUESTIONS:
                break
            if s not in plan:
                plan.append(s)

        for s in job.preferred_skills:
            if len(plan) >= TOTAL_QUESTIONS:
                break
            if s not in plan:
                plan.append(s)

    current_focus = plan[min(len(prev), len(plan)-1)] if plan else "General Role"

    text = generate_next_question(
        interview_type=interview.type,
        role=interview.role,
        base_difficulty=interview.difficulty,
        avg_score=_avg_score(db, interview.id),
        skills=(resume.skills if resume else []),
        required_skills=(job.required_skills if job else []),
        previous_questions=prev,
        conversation_history="\n".join(history),
        current_focus=current_focus,
    )
    if len(text) > 250:
        text = text[:250].rsplit(".", 1)[0] + "."
    q = models.Question(interview_id=interview.id, index=len(prev), text=text, difficulty=interview.difficulty)
    db.add(q); db.commit(); db.refresh(q)
    return q


@router.post("/start", response_model=schemas.InterviewStartOut)
def start(payload: schemas.InterviewStartIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    resume = _latest_resume(db, user.id); job = _latest_job(db, user.id)
    interview = models.Interview(
        user_id=user.id, resume_id=(resume.id if resume else None), job_id=(job.id if job else None),
        role=(job.role if job else "General"),
        type=payload.type, difficulty=payload.difficulty, duration_minutes=payload.duration_minutes,
    )
    db.add(interview); db.commit(); db.refresh(interview)
    _gen_question(db, interview, resume, job)
    return schemas.InterviewStartOut(interview_id=interview.id)


@router.post("/question", response_model=schemas.QuestionOut)
def next_question(payload: schemas.NextQuestionIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    interview = db.query(models.Interview).filter(models.Interview.id == payload.interview_id, models.Interview.user_id == user.id).first()
    if not interview: raise HTTPException(status_code=404, detail="Interview not found")
    for q in sorted(interview.questions, key=lambda x: x.index):
        if q.answer is None:
            return schemas.QuestionOut(id=q.id, text=q.text, index=q.index, total=TOTAL_QUESTIONS, difficulty=q.difficulty)
    q = _gen_question(db, interview, _latest_resume(db, user.id), _latest_job(db, user.id))
    return schemas.QuestionOut(id=q.id, text=q.text, index=q.index, total=TOTAL_QUESTIONS, difficulty=q.difficulty)


@router.post("/answer", response_model=schemas.QuestionOut)
def submit_answer(payload: schemas.SubmitAnswerIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    interview = db.query(models.Interview).filter(models.Interview.id == payload.interview_id, models.Interview.user_id == user.id).first()
    if not interview: raise HTTPException(status_code=404, detail="Interview not found")
    question = db.query(models.Question).filter(models.Question.id == payload.question_id).first()
    if not question or question.interview_id != interview.id:
        raise HTTPException(status_code=404, detail="Question not found")
    answer = models.Answer(question_id=question.id, text=payload.answer)
    db.add(answer); db.commit(); db.refresh(answer)
    eval_data = evaluate_answer(
        question=question.text,
        answer=payload.answer,
        role=interview.role,
    )
    db.add(models.Evaluation(answer_id=answer.id, **eval_data))
    db.commit()

    answered = sum(1 for q in interview.questions if q.answer)

    if answered >= TOTAL_QUESTIONS:
        return schemas.QuestionOut(
            id=question.id,
            text="Interview completed.",
            index=question.index,
            total=TOTAL_QUESTIONS,
            difficulty=question.difficulty,
        )

    q = _gen_question(
        db,
        interview,
        _latest_resume(db, user.id),
        _latest_job(db, user.id),
    )

    return schemas.QuestionOut(
        id=q.id,
        text=q.text,
        index=q.index,
        total=TOTAL_QUESTIONS,
        difficulty=q.difficulty,
    )

@router.post("/end", response_model=schemas.EndInterviewOut)
def end_interview(
    payload: schemas.EndInterviewIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    interview = (
        db.query(models.Interview)
        .filter(
            models.Interview.id == payload.interview_id,
            models.Interview.user_id == user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    existing = (
        db.query(models.Report)
        .filter(models.Report.interview_id == interview.id)
        .first()
    )

    if existing:
        return schemas.EndInterviewOut(report_id=existing.id)

    interview.ended_at = datetime.utcnow()

    data = build_report(db, interview)

    report = models.Report(
        interview_id=interview.id,
        **data
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return schemas.EndInterviewOut(report_id=report.id)