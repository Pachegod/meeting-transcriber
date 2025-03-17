from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime
import json
from typing import Dict, List, Optional, Any

# Configuração do banco de dados
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./meetings.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    company = Column(String, nullable=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    
    meetings = relationship("Meeting", back_populates="owner")


class Meeting(Base):
    __tablename__ = "meetings"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    platform = Column(String)  # "zoom", "google_meet", "ms_teams", "other"
    description = Column(Text, nullable=True)
    owner_id = Column(String, ForeignKey("users.id"))
    external_meeting_id = Column(String, nullable=True)
    scheduled_start = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String, default="scheduled")  # "scheduled", "in_progress", "completed", "cancelled"
    recording_url = Column(String, nullable=True)
    
    owner = relationship("User", back_populates="meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting")
    transcript = relationship("Transcript", back_populates="meeting", uselist=False)
    rd_station_exports = relationship("RDStationExport", back_populates="meeting")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=True)
    name = Column(String)
    role = Column(String, nullable=True)  # "host", "presenter", "attendee"
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    
    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User")


class Transcript(Base):
    __tablename__ = "transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), unique=True)
    full_text = Column(Text)
    language = Column(String, default="pt-BR")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    meeting = relationship("Meeting", back_populates="transcript")
    segments = relationship("TranscriptSegment", back_populates="transcript")
    summary = relationship("TranscriptSummary", back_populates="transcript", uselist=False)


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    
    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"))
    start_time = Column(Float)
    end_time = Column(Float)
    speaker = Column(String, nullable=True)
    text = Column(Text)
    confidence = Column(Float)
    
    transcript = relationship("Transcript", back_populates="segments")


class TranscriptSummary(Base):
    __tablename__ = "transcript_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"), unique=True)
    key_points = Column(JSON)
    action_items = Column(JSON)
    decisions = Column(JSON)
    sentiment = Column(String)
    keywords = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)
    
    transcript = relationship("Transcript", back_populates="summary")
    
    def get_key_points(self) -> List[str]:
        return json.loads(self.key_points) if isinstance(self.key_points, str) else self.key_points
    
    def get_action_items(self) -> List[str]:
        return json.loads(self.action_items) if isinstance(self.action_items, str) else self.action_items
    
    def get_decisions(self) -> List[str]:
        return json.loads(self.decisions) if isinstance(self.decisions, str) else self.decisions
    
    def get_keywords(self) -> List[str]:
        return json.loads(self.keywords) if isinstance(self.keywords, str) else self.keywords


class RDStationExport(Base):
    __tablename__ = "rd_station_exports"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"))
    rd_station_id = Column(String)
    export_type = Column(String)  # "contact", "opportunity", "deal", etc.
    status = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    
    meeting = relationship("Meeting", back_populates="rd_station_exports")


# Criar todas as tabelas
def create_tables():
    Base.metadata.create_all(bind=engine)


# Obter uma sessão de banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Funções de acesso ao banco de dados
def create_user(db, user_data: Dict) -> User:
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_meeting(db, meeting_data: Dict) -> Meeting:
    db_meeting = Meeting(**meeting_data)
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def add_transcript(db, transcript_data: Dict) -> Transcript:
    # Extrair segmentos e resumo
    segments_data = transcript_data.pop("segments", [])
    summary_data = transcript_data.pop("summary", None)
    
    # Criar transcrição
    db_transcript = Transcript(**transcript_data)
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)
    
    # Adicionar segmentos
    for segment_data in segments_data:
        segment_data["transcript_id"] = db_transcript.id
        db_segment = TranscriptSegment(**segment_data)
        db.add(db_segment)
    
    # Adicionar resumo se existir
    if summary_data:
        summary_data["transcript_id"] = db_transcript.id
        db_summary = TranscriptSummary(**summary_data)
        db.add(db_summary)
    
    db.commit()
    db.refresh(db_transcript)
    return db_transcript


def add_rd_station_export(db, export_data: Dict) -> RDStationExport:
    db_export = RDStationExport(**export_data)
    db.add(db_export)
    db.commit()
    db.refresh(db_export)
    return db_export


def get_meeting_by_id(db, meeting_id: str) -> Optional[Meeting]:
    return db.query(Meeting).filter(Meeting.id == meeting_id).first()


def get_transcript_by_meeting_id(db, meeting_id: str) -> Optional[Transcript]:
    return db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()


def search_transcripts(db, query: str, limit: int = 10) -> List[Dict]:
    """Pesquisa nas transcrições por texto."""
    results = []
    
    # Pesquisar no texto completo
    transcripts = db.query(Transcript).filter(Transcript.full_text.ilike(f"%{query}%")).limit(limit).all()
    
    for transcript in transcripts:
        meeting = get_meeting_by_id(db, transcript.meeting_id)
        results.append({
            "meeting_id": transcript.meeting_id,
            "meeting_title": meeting.title if meeting else "Desconhecido",
            "created_at": transcript.created_at,
            "match_type": "full_text"
        })
    
    # Pesquisar em segmentos específicos
    segments = db.query(TranscriptSegment).filter(TranscriptSegment.text.ilike(f"%{query}%")).limit(limit).all()
    
    for segment in segments:
        transcript = db.query(Transcript).filter(Transcript.id == segment.transcript_id).first()
        if transcript and not any(r["meeting_id"] == transcript.meeting_id for r in results):
            meeting = get_meeting_by_id(db, transcript.meeting_id)
            results.append({
                "meeting_id": transcript.meeting_id,
                "meeting_title": meeting.title if meeting else "Desconhecido",
                "created_at": transcript.created_at,
                "match_type": "segment",
                "segment_text": segment.text,
                "start_time": segment.start_time
            })
    
    return results 