from datetime import datetime
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base

def utcnow() -> datetime:
    return datetime.utcnow()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String)
    file_path = Column(String)
    raw_text = Column(Text)
    skills = Column(JSON, default=list)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    uploaded_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String)
    raw_text = Column(Text)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    responsibilities = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="jobs")
    interviews = relationship("Interview", back_populates="job")

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)

    type = Column(String)
    difficulty = Column(String)
    duration_minutes = Column(Integer, default=20)
    started_at = Column(DateTime, default=utcnow)
    ended_at = Column(DateTime, nullable=True)
    role = Column(String, default="")

    user = relationship("User", back_populates="interviews")

    resume = relationship("Resume", back_populates="interviews")
    job = relationship("JobDescription", back_populates="interviews")

    questions = relationship(
        "Question",
        back_populates="interview",
        cascade="all, delete-orphan",
    )

    report = relationship(
        "Report",
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan",
    )

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), index=True)
    index = Column(Integer)
    text = Column(Text)
    difficulty = Column(String)
    created_at = Column(DateTime, default=utcnow)

    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), index=True, unique=True)
    text = Column(Text)
    submitted_at = Column(DateTime, default=utcnow)

    question = relationship("Question", back_populates="answer")
    evaluation = relationship("Evaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True)
    answer_id = Column(Integer, ForeignKey("answers.id"), index=True, unique=True)
    technical_accuracy = Column(Float, default=0)
    communication = Column(Float, default=0)
    completeness = Column(Float, default=0)
    problem_solving = Column(Float, default=0)
    overall = Column(Float, default=0)
    missing_concepts = Column(JSON, default=list)
    correct_explanation = Column(Text, default="")
    improvements = Column(JSON, default=list)

    answer = relationship("Answer", back_populates="evaluation")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), index=True, unique=True)
    overall_score = Column(Float, default=0)
    technical_score = Column(Float, default=0)
    communication_score = Column(Float, default=0)
    resume_match = Column(Float, default=0)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=list)
    topics_to_improve = Column(JSON, default=list)
    roadmap = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow)

    interview = relationship("Interview", back_populates="report")