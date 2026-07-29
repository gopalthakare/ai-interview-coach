"""Aggregate per-answer evaluations into a final report + PDF."""
from __future__ import annotations

import json
from io import BytesIO
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from ..prompts import REPORT_PROMPT
from .ai_provider import complete_json


def build_report(db, interview) -> dict[str, Any]:
    evals = []

    tech = []
    comm = []
    overall = []

    strengths = []
    weaknesses = []

    skill_gaps = set()
    improvements = set()

    for q in interview.questions:

        if not (q.answer and q.answer.evaluation):
            continue

        e = q.answer.evaluation

        tech.append(e.technical_accuracy)
        comm.append(e.communication)
        overall.append(e.overall)

        evals.append({
            "question": q.text,
            "answer": q.answer.text,
            "technical_accuracy": e.technical_accuracy,
            "communication": e.communication,
            "completeness": e.completeness,
            "problem_solving": e.problem_solving,
            "overall": e.overall,
            "missing_concepts": e.missing_concepts or [],
            "improvements": e.improvements or [],
            "correct_explanation": e.correct_explanation or "",
        })

    if len(evals) < 3:
        return {
            "overall_score": 0,
            "technical_score": 0,
            "communication_score": 0,
            "resume_match": 0.0,

            "strengths": [],
            "weaknesses": [
                "Interview ended before enough responses were collected to evaluate performance."
            ],
            "skill_gaps": [],
            "topics_to_improve": [
                "Complete at least three interview questions to receive personalized feedback."
            ],
            "roadmap": [
                {
                    "step": "Complete the interview",
                    "detail": "Answer at least three interview questions to generate an accurate report."
                }
            ],
        }

    tech_s = int(sum(tech) / len(tech)) if tech else 0
    comm_s = int(sum(comm) / len(comm)) if comm else 0
    over_s = int(sum(overall) / len(overall)) if overall else 0

    ai = complete_json(
    REPORT_PROMPT.format(
        role=interview.role or "Software Engineer",
        interview_type=interview.type,
        evaluations_json=json.dumps(
            {
                "average_scores": {
                    "overall": over_s,
                    "technical": tech_s,
                    "communication": comm_s,
                },
                "questions": evals,
            },
            ensure_ascii=False,
        ),
        required_skills=json.dumps(
            interview.job.required_skills if interview.job else []
        ),
    )
    ) or {}

    strengths = ai.get("strengths", [])
    weaknesses = ai.get("weaknesses", [])
    skill_gaps = set(ai.get("skill_gaps", []))
    improvements = set(ai.get("topics_to_improve", []))
    roadmap = ai.get("roadmap", [])

    return {
        "overall_score": over_s,
        "technical_score": tech_s,
        "communication_score": comm_s,
        "resume_match": 0.0,

        "strengths": strengths[:8],
        "weaknesses": weaknesses[:8],
        "skill_gaps": list(skill_gaps)[:12],
        "topics_to_improve": list(improvements)[:10],
        "roadmap": roadmap,
    }


def report_to_pdf(report, buf: BytesIO) -> None:
    doc = SimpleDocTemplate(buf, pagesize=letter, title="Interview Report")
    styles = getSampleStyleSheet()
    story = [Paragraph("Interview Report", styles["Title"]), Spacer(1, 12)]
    story.append(Paragraph(f"<b>Role:</b> {report.interview.role or 'General'}", styles["Normal"]))
    story.append(Paragraph(f"<b>Overall:</b> {int(report.overall_score)}%", styles["Normal"]))
    story.append(Paragraph(f"<b>Technical:</b> {int(report.technical_score)}%", styles["Normal"]))
    story.append(Paragraph(f"<b>Communication:</b> {int(report.communication_score)}%", styles["Normal"]))
    story.append(Spacer(1, 12))
    for title, items in [
        ("Strengths", report.strengths or []),
        ("Weaknesses", report.weaknesses or []),
        ("Skill gaps", report.skill_gaps or []),
        ("Topics to improve", report.topics_to_improve or []),
    ]:
        story.append(Paragraph(f"<b>{title}</b>", styles["Heading3"]))
        for i in items:
            story.append(Paragraph(f"&bull; {i}", styles["Normal"]))
        story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Recommended roadmap</b>", styles["Heading3"]))
    for i, step in enumerate(report.roadmap or [], 1):
        story.append(Paragraph(f"<b>{i}. {step.get('step','')}</b>", styles["Normal"]))
        story.append(Paragraph(step.get("detail",""), styles["Normal"]))
        story.append(Spacer(1, 4))
    doc.build(story)