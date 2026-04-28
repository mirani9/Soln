"""
SENTINEL — Pydantic Models
All request/response schemas for the FastAPI backend.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ─── Request Models ───────────────────────────────────────────────

class TextAnalysisRequest(BaseModel):
    message: str = Field(..., description="User message to analyze for distress")
    location: Optional[str] = Field(None, description="Optional location info")
    latitude: Optional[float] = Field(None)
    longitude: Optional[float] = Field(None)


class DecisionRequest(BaseModel):
    alert_id: str
    emergency_type: str
    severity: str
    distress_score: int
    location: Optional[str] = None
    context: Optional[str] = None


class PoseAlertRequest(BaseModel):
    pose_type: str = Field(..., description="Type of pose detected: running, falling, panic")
    confidence: float = Field(..., ge=0, le=1)
    latitude: Optional[float] = Field(None)
    longitude: Optional[float] = Field(None)
    location: Optional[str] = Field(None)


class UpdateAlertRequest(BaseModel):
    alert_id: str
    status: str = Field(..., description="new, acknowledged, responding, resolved")


# ─── Response Models ──────────────────────────────────────────────

class TextAnalysisResponse(BaseModel):
    distress_score: int = Field(..., ge=0, le=100)
    reason: str
    emergency_type: Optional[str] = None
    language_detected: str = "english"
    english_translation: str = ""
    severity: str = "low"
    recommended_staff_role: str = "general"
    confidence: float = 0.0
    false_alarm_score: float = 0.0
    vulnerability_flags: List[str] = []
    alert_triggered: bool = False
    alert_id: Optional[str] = None


class DecisionResponse(BaseModel):
    actions: List[str] = Field(..., max_length=3)
    alert_id: str
    reasoning: Optional[str] = None


class PoseAlertResponse(BaseModel):
    alert_id: str
    status: str
    emergency_type: str
    severity: str


class HealthResponse(BaseModel):
    status: str
    ollama_available: bool
    firebase_connected: bool
    timestamp: str


# ─── Internal Models ─────────────────────────────────────────────

class AlertModel(BaseModel):
    id: Optional[str] = None
    type: str
    severity: str  # critical, high, medium, low
    location: str = "Unknown"
    latitude: float = 28.6139  # Default: New Delhi
    longitude: float = 77.2090
    timestamp: str = ""
    confidence: float = 0.0
    false_alarm_score: float = 0.0
    distress_score: int = 0
    actions: List[str] = []
    status: str = "new"
    source: str = "text"  # text, camera, scenario
    message: str = ""
    vulnerability_flags: List[str] = []
    language_detected: str = "english"
    english_translation: str = ""
    recommended_staff_role: str = "general"
    response_time: Optional[float] = None

    def to_firebase_dict(self):
        data = self.dict()
        if data.get("id"):
            del data["id"]
        if not data.get("timestamp"):
            data["timestamp"] = datetime.utcnow().isoformat()
        return data
