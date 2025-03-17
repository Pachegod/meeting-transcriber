from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class PlatformType(str, Enum):
    ZOOM = "zoom"
    GOOGLE_MEET = "google_meet"
    MS_TEAMS = "ms_teams"
    OTHER = "other"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class UserBase(BaseModel):
    email: str
    name: str
    company: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True

    class Config:
        orm_mode = True


class MeetingBase(BaseModel):
    title: str
    platform: PlatformType
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    external_meeting_id: Optional[str] = None


class MeetingCreate(MeetingBase):
    owner_id: str
    participants: Optional[List[str]] = None


class Meeting(MeetingBase):
    id: str
    owner_id: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "scheduled"
    recording_url: Optional[str] = None

    class Config:
        orm_mode = True


class TranscriptSegment(BaseModel):
    start_time: float
    end_time: float
    speaker: Optional[str] = None
    text: str
    confidence: float


class TranscriptSummary(BaseModel):
    key_points: List[str]
    action_items: List[str]
    decisions: List[str]
    sentiment: SentimentType
    keywords: List[str]


class Transcript(BaseModel):
    meeting_id: str
    segments: List[TranscriptSegment]
    full_text: str
    language: str = "pt-BR"
    summary: Optional[TranscriptSummary] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        orm_mode = True


class RDStationExport(BaseModel):
    meeting_id: str
    rd_station_id: str
    export_type: str  # "contact", "opportunity", "deal", etc.
    status: str
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        orm_mode = True


class AudioProcessingRequest(BaseModel):
    meeting_id: str
    audio_chunk: str  # Base64 encoded audio
    timestamp: float
    speaker_id: Optional[str] = None


class TranscriptionResponse(BaseModel):
    meeting_id: str
    segment: TranscriptSegment
    is_final: bool = False 