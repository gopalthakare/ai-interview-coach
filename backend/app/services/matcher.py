"""Resume/JD skill matcher with normalization, alias expansion, and fuzzy comparison.

Design notes (read before tuning):
- `normalize()` produces a lowercase comparison KEY only. It is never returned
  to the API — display strings always come from the original resume/JD text,
  so the frontend shows one consistent casing instead of mixing raw JD/resume
  casing with lowercased internal keys.
- Matching happens in three widening passes: exact key, then a loose
  singular/plural-insensitive key, then fuzzy string similarity. This absorbs
  minor wording differences (e.g. "Vector Databases" vs "Vector DBs") that
  would otherwise sink an otherwise-strong match down to a misleadingly low
  percentage.
- ALIASES is intentionally a living list, not exhaustive. Add entries here as
  you notice more real-world resume/JD phrasing gaps.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher

ALIASES = {
    # REST
    "rest": "rest apis",
    "rest api": "rest apis",
    "restful api": "rest apis",
    "restful apis": "rest apis",

    # Python ML
    "np": "numpy",
    "scikit learn": "scikit-learn",
    "scikitlearn": "scikit-learn",
    "sklearn": "scikit-learn",

    # AI / LLMs
    "llm": "llm apis",
    "llms": "llm apis",
    "openai": "llm apis",
    "gemini": "llm apis",
    "gpt": "llm apis",
    "chatgpt": "llm apis",

    # Transformers / NLP
    "transformer": "transformers",
    "transformer models": "transformers",
    "huggingface": "transformers",
    "hugging face": "transformers",
    "hugging face transformers": "transformers",
    "bert": "transformers",

    # Vector databases
    "vector db": "vector dbs",
    "vector database": "vector dbs",
    "vector databases": "vector dbs",
    "vector store": "vector dbs",
    "vector stores": "vector dbs",
    "pinecone": "vector dbs",
    "faiss": "vector dbs",
    "chromadb": "vector dbs",
    "chroma": "vector dbs",
    "weaviate": "vector dbs",
    "milvus": "vector dbs",
    "qdrant": "vector dbs",

    # Cloud
    "gcp": "google cloud",
    "google cloud platform": "google cloud",
    "aws": "aws",
    "amazon web services": "aws",

    # CV
    "opencv-python": "opencv",
    "cv2": "opencv",

    # Version control
    "github": "git",

    # Containers
    "docker containers": "docker",

    # Database
    "postgres": "postgresql",
    "postgresql": "postgresql",

    # Frameworks
    "fast api": "fastapi",
}

FUZZY_THRESHOLD = 0.86


def normalize(skill: str) -> str:
    """Normalize a skill string into a comparison key (internal use only)."""
    skill = skill.lower().strip()
    skill = re.sub(r"[(),/]", " ", skill)
    skill = re.sub(r"\s+", " ", skill).strip()
    return ALIASES.get(skill, skill)


def _loose(key: str) -> str:
    """Singular/plural-insensitive variant of a normalized key."""
    if len(key) > 4 and key.endswith("s") and not key.endswith("ss"):
        singular = key[:-1]
        return ALIASES.get(singular, singular)
    return key


_VERSION_SUFFIX = re.compile(r"v?\d+$")


def _versionless(key: str) -> str | None:
    stripped = _VERSION_SUFFIX.sub("", key).strip()
    if stripped and len(stripped) >= 3 and stripped != key:
        return ALIASES.get(stripped, stripped)
    return None


def _similar(a: str, b: str) -> bool:
    if not a or not b:
        return False
    return SequenceMatcher(None, a, b).ratio() >= FUZZY_THRESHOLD


def _index(skills: list[str]) -> dict[str, str]:
    """normalized key -> first-seen original string (for display)."""
    out: dict[str, str] = {}
    for s in skills:
        if not s or not s.strip():
            continue
        key = normalize(s)
        out.setdefault(key, s.strip())
    return out


def _has_match(target_key: str, resume_index: dict[str, str]) -> bool:
    if target_key in resume_index:
        return True

    loose_target = _loose(target_key)
    for key in resume_index:
        if _loose(key) == loose_target:
            return True

    version_target = _versionless(target_key)
    for key in resume_index:
        version_key = _versionless(key)
        if version_target and (version_target == key or version_target == version_key):
            return True
        if version_key and (version_key == target_key or version_key == version_target):
            return True

    for key in resume_index:
        if _similar(target_key, key):
            return True
    return False


def _resolve(skills: list[str], resume_index: dict[str, str]) -> tuple[list[str], list[str]]:
    """Split a JD skill list into (present, absent), each returned using the
    ORIGINAL casing from the JD list (so it matches how required_skills /
    preferred_skills are already shown on the frontend)."""
    present, absent = [], []
    seen: set[str] = set()
    for s in skills:
        if not s or not s.strip():
            continue
        key = normalize(s)
        if key in seen:
            continue
        seen.add(key)
        original = s.strip()
        if _has_match(key, resume_index):
            present.append(original)
        else:
            absent.append(original)
    return present, absent


def match_resume_to_jd(
    resume_skills: list[str],
    required: list[str],
    preferred: list[str],
) -> dict:
    resume_index = _index(resume_skills)

    matched_required, missing = _resolve(required, resume_index)
    matched_preferred, unmatched_preferred = _resolve(preferred, resume_index)

    suggested = unmatched_preferred[:5]

    required_weight = 0.8
    preferred_weight = 0.2

    required_total = len(matched_required) + len(missing)
    preferred_total = len(matched_preferred) + len(unmatched_preferred)

    required_score = (len(matched_required) / required_total) if required_total else 1
    preferred_score = (len(matched_preferred) / preferred_total) if preferred_total else 1

    percentage = round(
        (required_score * required_weight + preferred_score * preferred_weight) * 100
    )

    return {
        "percentage": min(100, percentage),
        "matched": matched_required + matched_preferred,
        "missing": missing,
        "suggested": suggested,
    }
