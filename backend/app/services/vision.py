"""Interview behavior analytics (NOT cheating detection).
Interfaces for future MediaPipe/OpenCV integration.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class BehaviorFrame:
    faces_detected: int = 0
    head_yaw_deg: float = 0.0
    head_pitch_deg: float = 0.0
    engagement_score: float = 0.0


@dataclass
class BehaviorReport:
    average_engagement: float = 0.0
    time_looking_away_pct: float = 0.0
    multiple_faces_events: int = 0
    notes: list[str] = field(default_factory=list)


class BehaviorAnalyzer:
    def analyze_frame(self, frame_bytes: bytes) -> BehaviorFrame:
        # TODO: MediaPipe FaceMesh + PnP head pose.
        return BehaviorFrame()

    def summarize(self, frames: list[BehaviorFrame]) -> BehaviorReport:
        if not frames:
            return BehaviorReport(notes=["No frames captured."])
        avg = sum(f.engagement_score for f in frames) / len(frames)
        away = sum(1 for f in frames if abs(f.head_yaw_deg) > 30) / len(frames)
        return BehaviorReport(
            average_engagement=round(avg, 2),
            time_looking_away_pct=round(away * 100, 1),
            multiple_faces_events=sum(1 for f in frames if f.faces_detected > 1),
        )