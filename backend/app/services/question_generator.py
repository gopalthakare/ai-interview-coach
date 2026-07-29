"""Adaptive question generator."""
from __future__ import annotations

from ..prompts import (
    GENERAL_PROMPT,
    HR_PROMPT,
    TECHNICAL_PROMPT,
    BEHAVIORAL_PROMPT,
)
from .ai_provider import complete_text

# Mapping for interview type → prompt
TYPE_BLOCKS = {
    "hr": HR_PROMPT,
    "technical": TECHNICAL_PROMPT,
    "behavioral": BEHAVIORAL_PROMPT,
}


# Mixed interview flow
MIXED_SEQUENCES = {
    "beginner": [
        "hr",
        "technical",
        "behavioral",
        "technical",
        "hr",
    ],
    "intermediate": [
        "technical",
        "behavioral",
        "technical",
        "hr",
        "technical",
    ],
    "advanced": [
        "technical",
        "technical",
        "behavioral",
        "technical",
        "technical",
    ],
}


def resolve_subtype(
    interview_type: str,
    difficulty: str,
    previous_questions: list,
) -> str:
    """
    Resolves the actual interview type.

    If interview type is Mixed, choose the next subtype
    according to the configured sequence.
    """

    interview_type = interview_type.lower()

    if interview_type != "mixed":
        return interview_type

    seq = MIXED_SEQUENCES.get(
        difficulty.lower(),
        MIXED_SEQUENCES["intermediate"],
    )

    return seq[len(previous_questions) % len(seq)]

def build_prompt(
    *,
    role,
    interview_type,
    difficulty,
    avg_score,
    skills,
    required_skills,
    previous_questions,
    conversation_history,
    current_focus,
):
    subtype = resolve_subtype(
        interview_type,
        difficulty,
        previous_questions,
    )

    general = GENERAL_PROMPT.format(
        role=role or "Software Engineer",
        difficulty=difficulty,
        avg_score=round(avg_score),
        skills=", ".join(skills[:20]) or "n/a",
        required_skills=", ".join(required_skills[:20]) or "n/a",
        previous_questions="; ".join(previous_questions[-5:]) or "(none)",
        conversation_history=conversation_history,
        current_focus=current_focus,
    )

    return general + "\n\n" + TYPE_BLOCKS[subtype]

def generate_next_question(
    *,
    interview_type,
    role,
    base_difficulty,
    avg_score,
    skills,
    required_skills,
    previous_questions,
    conversation_history="",
    current_focus="General Role",
):
    """
    Generates the next interview question with adaptive difficulty.
    """

    adapted = base_difficulty

    if avg_score >= 85 and base_difficulty != "advanced":
        adapted = (
            "advanced"
            if base_difficulty == "intermediate"
            else "intermediate"
        )

    elif avg_score < 55 and base_difficulty != "beginner":
        adapted = (
            "beginner"
            if base_difficulty == "intermediate"
            else "intermediate"
        )

    prompt = build_prompt(
        role=role,
        interview_type=interview_type,
        difficulty=adapted,
        avg_score=avg_score,
        skills=skills,
        required_skills=required_skills,
        previous_questions=previous_questions,
        conversation_history=conversation_history,
        current_focus=current_focus,
    )

    return (
        complete_text(prompt)
        or "Tell me about a challenging problem you solved recently."
    )