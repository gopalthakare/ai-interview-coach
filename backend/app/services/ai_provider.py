"""Pluggable LLM provider. Swap providers without touching downstream services.

AI_PROVIDER env: openai | gemini | mock (default). Mock keeps everything working
with no API keys so the full flow is exercised end-to-end.
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

import httpx

from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AIProvider:
    def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        body: dict[str, Any] = {
            "model": settings.OPENAI_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        r = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json=body, timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

class GroqProvider(AIProvider):
    def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        body = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6,
        }

        if json_mode:
            body["response_format"] = {"type": "json_object"}

        r = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=60,
        )

        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

class GeminiProvider(AIProvider):
    MAX_RETRIES = 3
    def _call_api(self, api_key: str, prompt: str, json_mode: bool) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent?key={api_key}"
        )
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.6
            }
        }

        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"
        response = httpx.post(
            url,
            json=body,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        try:
            logger.info("Trying Gemini")
            return self._call_api(
                settings.GEMINI_API_KEY,
                prompt,
                json_mode,
            )
        except Exception:
            logger.warning("Gemini failed.")
            raise

class MockProvider(AIProvider):
    def complete(self, prompt: str, *, json_mode: bool = False) -> str:
        p = prompt.lower()
        if "ats resume parser" in p or "extract information from the resume" in p:
            return json.dumps({
                "skills": ["Python", "FastAPI", "SQL", "React", "TypeScript", "Docker", "AWS"],
                "education": [{"degree": "B.S. Computer Science", "institution": "State University", "year": "2021"}],
                "experience": [{"role": "Software Engineer", "company": "TechCorp", "duration": "2022-Present", "details": "Backend services and data pipelines."}],
                "projects": [{"name": "Realtime chat", "description": "Websocket chat app.", "tech": ["Node", "Redis"]}],
                "certifications": ["AWS Certified Developer"],
            })
        if "recruiter" in p or "job description" in p:
            return json.dumps({
                "role": "Software Engineer",
                "required_skills": ["Python", "SQL", "REST APIs", "Git"],
                "preferred_skills": ["FastAPI", "Docker", "AWS"],
                "responsibilities": ["Design and build backend services.", "Collaborate with product.", "Own features end-to-end."],
            })
        if "grade this" in p or "grading" in p:
            return json.dumps({
                "technical_accuracy": 75, "communication": 78, "completeness": 70,
                "problem_solving": 74, "overall": 74,
                "missing_concepts": ["Edge cases", "Complexity analysis"],
                "correct_explanation": "A strong answer covers tradeoffs and gives a concrete example.",
                "improvements": ["Be more concise.", "Discuss tradeoffs.", "Add a worked example."],
            })
        if "interview report" in p:
            return json.dumps({
                "strengths": ["Clear structure", "Good domain knowledge"],
                "weaknesses": ["Missed edge cases", "Answers ran long"],
                "skill_gaps": ["System design at scale", "Distributed tracing"],
                "topics_to_improve": ["System design", "Concurrency", "SQL indexing"],
                "roadmap": [
                    {"step": "Study distributed systems", "detail": "Read DDIA ch. 5-9."},
                    {"step": "Practice system design", "detail": "5 mocks: caching, sharding, queues."},
                    {"step": "Communication drills", "detail": "Cut fillers; aim for 90s STAR."},
                ],
            })
        if "senior interviewer" in p or "ask one next question" in p or "ask one" in p:
            questions = [
                "Walk me through your resume — what work are you most proud of and why?",
                "Explain the difference between a process and a thread. When would you pick one?",
                "Design a URL shortener. How would you handle 10x traffic growth?",
                "Describe a time you disagreed with a teammate. How did you resolve it?",
                "How does gradient descent work, and what causes it to get stuck?",
                "Explain database indexing. When can an index hurt performance?",
                "How would you debug a production service that suddenly slowed down?",
            ]
            return questions[sum(map(ord, prompt)) % len(questions)]
        return "Tell me about a challenging problem you solved recently."


def get_provider() -> AIProvider:
    """Return the primary provider for the configured AI_PROVIDER setting."""
    p = settings.AI_PROVIDER.lower()

    if p == "gemini":
        return GeminiProvider()
    if p == "groq":
        return GroqProvider()
    if p == "openai":
        return OpenAIProvider()
    return MockProvider()


def _provider_chain() -> list[AIProvider]:
    """Providers to try in order, based on AI_PROVIDER. Mock is a deliberate
    dead end (no network fallback) so local/demo mode never makes live calls;
    every other setting falls back to Gemini/Groq so a rate limit or outage
    on the primary provider doesn't take the feature down entirely."""
    p = settings.AI_PROVIDER.lower()

    if p == "mock":
        return [MockProvider()]
    if p == "openai":
        return [OpenAIProvider(), GeminiProvider(), GroqProvider()]
    if p == "groq":
        return [GroqProvider(), GeminiProvider()]
    return [GeminiProvider(), GroqProvider()]  # default: gemini


def complete_json(prompt: str) -> dict:
    for provider in _provider_chain():
        try:
            logger.info("Using %s", provider.__class__.__name__)
            return _extract_json(provider.complete(prompt, json_mode=True))
        except Exception:
            logger.warning("%s failed.", provider.__class__.__name__)

    return {}


def complete_text(prompt: str) -> str:
    for provider in _provider_chain():
        try:
            logger.info("Using %s", provider.__class__.__name__)
            return provider.complete(prompt).strip()
        except Exception:
            logger.warning("%s failed.", provider.__class__.__name__)

    return ""


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    logger.warning("LLM did not return valid JSON: %s", raw[:200])
    return {}