from __future__ import annotations

import logging
from typing import Any

from pypdf import PdfReader

from ..prompts import RESUME_PARSE_PROMPT
from .ai_provider import complete_json

logger = logging.getLogger(__name__)

def extract_text_from_pdf(path: str) -> str:
    try:
        return "\n".join(
            (page.extract_text() or "")
            for page in PdfReader(path).pages
        )
    except Exception as e:
        logger.exception("Failed to read PDF %s: %s", path, e)
        return ""

def parse_resume(text: str) -> dict[str, Any]:
    if not text.strip():
        return {
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
        }

    data = complete_json(
        RESUME_PARSE_PROMPT.format(
            resume_text=text[:12000]
        )
    ) or {}

    def clean_list(value):
        if not isinstance(value, list):
            return []

        seen = set()
        cleaned = []

        for item in value:
            item = str(item).strip()

            if not item:
                continue

            key = item.lower()

            if key not in seen:
                seen.add(key)
                cleaned.append(item)

        return cleaned

    projects = data.get("projects", [])

    if not isinstance(projects, list):
        projects = []

    normalized_projects = []

    for project in projects:

        if not isinstance(project, dict):
            continue

        tech = project.get("tech", [])

        if isinstance(tech, str):
            tech = [
                t.strip()
                for t in tech.split(",")
                if t.strip()
            ]

        elif isinstance(tech, list):
            tech = [
                str(t).strip()
                for t in tech
                if str(t).strip()
            ]

        else:
            tech = []

        normalized_projects.append({
            "name": str(project.get("name", "")).strip(),
            "description": str(project.get("description", "")).strip(),
            "tech": tech,
        })

    return {
        "skills": clean_list(data.get("skills")),
        "education": data.get("education", []),
        "experience": data.get("experience", []),
        "projects": normalized_projects,
        "certifications": clean_list(data.get("certifications")),
    }