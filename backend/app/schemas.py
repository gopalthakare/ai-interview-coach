from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ResumeOut(BaseModel):
    id: int
    filename: str
    skills: List[str]
    education: List[dict]
    experience: List[dict]
    projects: List[dict]
    certifications: List[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class JobAnalyzeIn(BaseModel):
    text: Optional[str] = None
    preset: Optional[str] = None


class MatchOut(BaseModel):
    percentage: int
    matched: List[str]
    missing: List[str]
    suggested: List[str]


class JobAnalysisOut(BaseModel):
    role: str
    required_skills: List[str]
    preferred_skills: List[str]
    responsibilities: List[str]
    match: MatchOut


class InterviewStartIn(BaseModel):
    type: str
    difficulty: str
    duration_minutes: int


class InterviewStartOut(BaseModel):
    interview_id: int


class NextQuestionIn(BaseModel):
    interview_id: int


class QuestionOut(BaseModel):
    id: int
    text: str
    index: int
    total: int
    difficulty: str


class SubmitAnswerIn(BaseModel):
    interview_id: int
    question_id: int
    answer: str


class EndInterviewIn(BaseModel):
    interview_id: int


class EndInterviewOut(BaseModel):
    report_id: int


class ReportOut(BaseModel):
    id: int
    role: str
    date: str
    overall_score: int
    technical_score: int
    communication_score: int
    strengths: List[str]
    weaknesses: List[str]
    skill_gaps: List[str]
    topics_to_improve: List[str]
    roadmap: List[dict]


class TrendPoint(BaseModel):
    date: str
    score: int


class RecentItem(BaseModel):
    id: int
    role: str
    score: int
    date: str


class DashboardOut(BaseModel):
    total_interviews: int
    avg_score: float
    technical_trend: List[TrendPoint]
    communication_trend: List[TrendPoint]
    recent: List[RecentItem]
    resume_match: int
    suggestions: List[str]


class HistoryItem(BaseModel):
    id: int
    role: str
    date: str
    score: int
    resume_match: int
    difficulty: str
    duration_minutes: int