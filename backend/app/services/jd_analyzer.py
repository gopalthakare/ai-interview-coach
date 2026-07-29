"""Job description analyzer: presets + LLM structuring."""
from __future__ import annotations
from typing import Any

from ..prompts import JD_ANALYZE_PROMPT
from .ai_provider import complete_json

PRESETS: dict[str, dict[str, Any]] = {
    "Python Developer": {"role": "Python Developer",
        "required_skills": ["Python", "OOP", "REST APIs", "SQL", "Git"],
        "preferred_skills": ["FastAPI", "Docker", "AWS", "Redis"],
        "responsibilities": ["Build backend services", "Write tests", "Own features end-to-end"]},
    "AI Engineer": {"role": "AI Engineer",
        "required_skills": ["Python", "PyTorch", "Transformers", "LLMs", "Vector DBs"],
        "preferred_skills": ["LangChain", "RAG", "MLOps"],
        "responsibilities": ["Design LLM pipelines", "Fine-tune models", "Deploy to production"]},
    "Machine Learning Engineer": {"role": "Machine Learning Engineer",
        "required_skills": ["Python", "scikit-learn", "Pandas", "Deep Learning", "SQL"],
        "preferred_skills": ["MLflow", "Kubernetes", "GCP/AWS"],
        "responsibilities": ["Train models", "Build feature pipelines", "Monitor drift"]},
    "Data Scientist": {"role": "Data Scientist",
        "required_skills": ["Python", "Statistics", "SQL", "A/B Testing", "Pandas"],
        "preferred_skills": ["Causal inference", "dbt", "Airflow"],
        "responsibilities": ["Analyze product data", "Run experiments", "Present insights"]},
    "Java Developer": {"role": "Java Developer",
        "required_skills": ["Java", "Spring Boot", "SQL", "REST", "JUnit"],
        "preferred_skills": ["Kafka", "Kubernetes", "Microservices"],
        "responsibilities": ["Build services", "Optimize performance", "Mentor juniors"]},
    "Frontend Developer": {"role": "Frontend Developer",
        "required_skills": ["React", "TypeScript", "HTML", "CSS", "State Management"],
        "preferred_skills": ["Next.js", "Tailwind", "Testing Library"],
        "responsibilities": ["Build UIs", "Improve performance", "Collaborate with design"]},
    "Backend Developer": {"role": "Backend Developer",
        "required_skills": ["Python or Node", "REST APIs", "SQL", "Auth", "Testing"],
        "preferred_skills": ["Kafka", "gRPC", "Kubernetes"],
        "responsibilities": ["Design APIs", "Model data", "Own reliability"]},
    "Full Stack Developer": {"role": "Full Stack Developer",
        "required_skills": ["React", "TypeScript", "Node or Python", "SQL", "REST"],
        "preferred_skills": ["GraphQL", "AWS", "CI/CD"],
        "responsibilities": ["Ship features across stack", "Own quality", "Pair with product"]},
}


def preset_jd(name: str) -> dict[str, Any]:
    return PRESETS.get(name, {"role": name, "required_skills": [], "preferred_skills": [], "responsibilities": []})


def analyze_jd(text: str) -> dict[str, Any]:
    data = complete_json(JD_ANALYZE_PROMPT.format(jd_text=text[:8000])) or {}
    return {
        "role": data.get("role") or "Unknown Role",
        "required_skills": data.get("required_skills") or [],
        "preferred_skills": data.get("preferred_skills") or [],
        "responsibilities": data.get("responsibilities") or [],
    }