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

    def score(name, default):
        try:
            value = float(data.get(name, default))

            # Normalize providers that return 0–10
            if value <= 10:
                value *= 10

            return max(0, min(100, value))
        except Exception:
            return default

    technical = score("technical_accuracy", 70)
    communication = score("communication", 70)
    completeness = score("completeness", 70)
    problem = score("problem_solving", 70)

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