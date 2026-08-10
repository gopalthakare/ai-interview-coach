"""Per-answer LLM evaluator."""
from __future__ import annotations

from ..prompts import ANSWER_EVAL_PROMPT
from .ai_provider import complete_json

def evaluate_answer(*, question: str, answer: str, role: str) -> dict:
    if not answer.strip():
        return {
            "technical_accuracy": 0,
            "communication": 0,
            "completeness": 0,
            "problem_solving": 0,
            "overall": 0,
            "missing_concepts": ["No answer provided"],
            "correct_explanation": "",
            "improvements": ["Provide an answer, even if it's brief."],
        }

    data = complete_json(
        ANSWER_EVAL_PROMPT.format(
            role=role or "Software Engineer",
            question=question,
            answer=answer,
        )
    ) or {}

    def raw(name, default):
        try:
            return float(data.get(name, default))
        except Exception:
            return float(default)

    raw_technical = raw("technical_accuracy", 70)
    raw_communication = raw("communication", 70)
    raw_completeness = raw("completeness", 70)
    raw_problem = raw("problem_solving", 70)

    # Some providers occasionally answer on a 0-10 scale despite the prompt
    # asking for 0-100. Decide the scale ONCE from all four values together —
    # deciding per-field would wrongly 10x a single genuinely-low 0-100 score
    # (e.g. communication=8/100 on an otherwise strong answer).
    scale = 10 if max(raw_technical, raw_communication, raw_completeness, raw_problem) <= 10 else 1

    def clamp(value):
        return max(0, min(100, value * scale))

    technical = clamp(raw_technical)
    communication = clamp(raw_communication)
    completeness = clamp(raw_completeness)
    problem = clamp(raw_problem)

    overall = round(
        technical * 0.40
        + communication * 0.20
        + completeness * 0.20
        + problem * 0.20
    )

    return {
        "technical_accuracy": technical,
        "communication": communication,
        "completeness": completeness,
        "problem_solving": problem,
        "overall": overall,
        "missing_concepts": data.get("missing_concepts", []),
        "correct_explanation": data.get("correct_explanation", ""),
        "improvements": data.get("improvements", []),
    }