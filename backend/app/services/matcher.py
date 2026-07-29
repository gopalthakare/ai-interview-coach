"""Resume/JD skill matcher with normalization and fuzzy comparison."""
from __future__ import annotations

import re


ALIASES = {
    # REST
    "rest": "rest apis",
    "rest api": "rest apis",
    "restful api": "rest apis",
    "restful apis": "rest apis",

    # Python ML
    "numpy": "numpy",
    "np": "numpy",

    "pandas": "pandas",

    "scikit learn": "scikit-learn",
    "scikitlearn": "scikit-learn",
    "sklearn": "scikit-learn",

    # AI
    "llm": "llm apis",
    "llms": "llm apis",
    "openai": "llm apis",
    "gemini": "llm apis",

    # Cloud
    "gcp": "google cloud",
    "google cloud platform": "google cloud",

    # CV
    "opencv-python": "opencv",

    # Version control
    "github": "git",

    # Containers
    "docker containers": "docker",

    # Database
    "postgres": "postgresql",
    "postgresql": "postgresql",

    # ML Explainability
    "lime": "lime",
    "shap": "shap",

    # Frameworks
    "fast api": "fastapi",
}


def normalize(skill: str) -> str:
    """
    Normalize skills so equivalent skills match.
    """

    skill = skill.lower().strip()

    skill = re.sub(r"[(),]", "", skill)
    skill = re.sub(r"\s+", " ", skill)

    return ALIASES.get(skill, skill)


def match_resume_to_jd(
    resume_skills: list[str],
    required: list[str],
    preferred: list[str],
) -> dict:

    resume = {normalize(s) for s in resume_skills if s}

    required = [normalize(s) for s in required if s]
    preferred = [normalize(s) for s in preferred if s]

    matched_required = sorted(
        {
            s
            for s in required
            if s in resume
        }
    )

    matched_preferred = sorted(
        {
            s
            for s in preferred
            if s in resume
        }
    )

    missing = sorted(
        {
            s
            for s in required
            if s not in resume
        }
    )

    suggested = sorted(
        {
            s
            for s in preferred
            if s not in resume
        }
    )[:5]

    required_weight = 0.8
    preferred_weight = 0.2

    required_score = (
        len(matched_required) / len(required)
        if required
        else 1
    )

    preferred_score = (
        len(matched_preferred) / len(preferred)
        if preferred
        else 1
    )

    percentage = round(
        (
            required_score * required_weight
            + preferred_score * preferred_weight
        )
        * 100
    )

    return {
        "percentage": min(100, percentage),
        "matched": matched_required + matched_preferred,
        "missing": missing,
        "suggested": suggested,
    }