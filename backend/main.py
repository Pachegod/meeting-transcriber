from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Body, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional, Dict, Any
import asyncio
import json
import uuid
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

# Importar módulos do projeto
from database import get_db, create_tables, create_meeting, add_transcript, get_meeting_by_id, get_transcript_by_meeting_id, search_transcripts
from models import UserBase, UserCreate, User, MeetingBase, MeetingCreate, Meeting, TranscriptSegment, TranscriptSummary, Transcript, RDStationExport, AudioProcessingRequest, TranscriptionResponse
from auth import authenticate_user, create_access_token, get_current_active_user, register_new_user
from transcription import process_audio_chunk, generate_summary
from rdstation import export_meeting_to_rdstation
from platforms import get_platform_client

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar aplicação FastAPI
app = FastAPI(
    title="Meeting Transcriber API",
    description="API para sistema de gravação e transcrição de reuniões",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexões WebSocket ativas
active_connections: Dict[str, List[WebSocket]] = {}

# Criar tabelas do banco de dados
@app.on_event("startup")
async def startup_event():
    create_tables()
    logger.info("Tabelas do banco de dados criadas")


# Rota raiz
@app.get("/")
async def read_root():
    return {
        "status": "online",
        "message": "API do Sistema de Transcrição de Reuniões",
        "version": "1.0.0"
    }


# Autenticação e usuários
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return register_new_user(db, user.email, user.password, user.name, user.company)


@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# Gerenciamento de reuniões
@app.post("/meetings", response_model=Meeting)
async def create_new_meeting(meeting: MeetingCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Gerar ID único para a reunião
    meeting_id = str(uuid.uuid4())
    
    # Criar reunião na plataforma escolhida
    platform_client = get_platform_client(meeting.platform)
    
    platform_meeting = platform_client.create_meeting(
        title=meeting.title,
        start_time=meeting.scheduled_start or datetime.now(),
        duration_minutes=60,  # Padrão de 1 hora
        description=meeting.description
    )
    
    if "error" in platform_meeting:
        raise HTTPException(status_code=400, detail=f"Erro ao criar reunião na plataforma: {platform_meeting['error']}")
    
    # Criar reunião no banco de dados
    meeting_data = {
        "id": meeting_id,
        "title": meeting.title,
        "platform": meeting.platform,
        "description": meeting.description,
        "owner_id": current_user.id,
        "external_meeting_id": platform_meeting.get("id", ""),
        "scheduled_start": meeting.scheduled_start,
        "created_at": datetime.now(),
        "status": "scheduled"
    }
    
    db_meeting = create_meeting(db, meeting_data)
    
    return db_meeting


@app.get("/meetings", response_model=List[Meeting])
async def list_meetings(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Meeting).filter(Meeting.owner_id == current_user.id)
    
    if status:
        query = query.filter(Meeting.status == status)
    
    meetings = query.offset(skip).limit(limit).all()
    return meetings


@app.get("/meetings/{meeting_id}", response_model=Meeting)
async def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta reunião")
    
    return meeting


@app.post("/meetings/{meeting_id}/start")
async def start_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta reunião")
    
    # Atualizar status da reunião
    meeting.status = "in_progress"
    meeting.started_at = datetime.now()
    db.commit()
    
    return {"meeting_id": meeting_id, "status": "started"}


@app.post("/meetings/{meeting_id}/stop")
async def stop_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta reunião")
    
    # Atualizar status da reunião
    meeting.status = "completed"
    meeting.ended_at = datetime.now()
    
    if meeting.started_at:
        duration = meeting.ended_at - meeting.started_at
        meeting.duration_seconds = int(duration.total_seconds())
    
    db.commit()
    
    # Obter URL da gravação
    platform_client = get_platform_client(meeting.platform)
    recording_url = platform_client.get_recording_url(meeting.external_meeting_id)
    
    if recording_url:
        meeting.recording_url = recording_url
        db.commit()
    
    return {"meeting_id": meeting_id, "status": "stopped"}


# Transcrição e processamento de áudio
@app.websocket("/ws/meeting/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    meeting_id: str
):
    await websocket.accept()
    
    # Adicionar conexão à lista de conexões ativas
    if meeting_id not in active_connections:
        active_connections[meeting_id] = []
    
    active_connections[meeting_id].append(websocket)
    
    try:
        while True:
            # Receber dados de áudio
            data = await websocket.receive_text()
            data_json = json.loads(data)
            
            # Processar áudio e obter transcrição
            audio_chunk = data_json.get("audio_chunk", "")
            timestamp = data_json.get("timestamp", 0.0)
            
            if audio_chunk:
                # Processar áudio em background para não bloquear o WebSocket
                asyncio.create_task(process_and_broadcast(meeting_id, audio_chunk, timestamp))
            
            # Enviar resposta imediata
            await websocket.send_json({
                "status": "processing",
                "meeting_id": meeting_id,
                "timestamp": datetime.now().isoformat()
            })
    
    except WebSocketDisconnect:
        logger.info(f"Cliente desconectado do WebSocket para reunião {meeting_id}")
    except Exception as e:
        logger.error(f"Erro na conexão WebSocket: {e}")
    finally:
        # Remover conexão da lista de conexões ativas
        if meeting_id in active_connections:
            active_connections[meeting_id].remove(websocket)
            if not active_connections[meeting_id]:
                del active_connections[meeting_id]


async def process_and_broadcast(meeting_id: str, audio_chunk: str, timestamp: float):
    """Processa áudio e transmite resultados para todos os clientes conectados."""
    try:
        # Processar áudio
        result = process_audio_chunk(audio_chunk, meeting_id, timestamp)
        
        # Transmitir resultado para todos os clientes conectados
        if meeting_id in active_connections:
            for connection in active_connections[meeting_id]:
                await connection.send_json(result)
    
    except Exception as e:
        logger.error(f"Erro ao processar áudio: {e}")


@app.post("/meetings/{meeting_id}/audio")
async def process_audio(
    meeting_id: str,
    audio_data: AudioProcessingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta reunião")
    
    # Processar áudio
    result = process_audio_chunk(audio_data.audio_chunk, meeting_id, audio_data.timestamp)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@app.get("/meetings/{meeting_id}/transcript", response_model=Dict)
async def get_transcript(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    transcript = get_transcript_by_meeting_id(db, meeting_id)
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcrição não encontrada")
    
    # Construir resposta
    segments = [
        {
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "speaker": segment.speaker,
            "text": segment.text,
            "confidence": segment.confidence
        }
        for segment in transcript.segments
    ]
    
    summary = None
    if transcript.summary:
        summary = {
            "key_points": transcript.summary.get_key_points(),
            "action_items": transcript.summary.get_action_items(),
            "decisions": transcript.summary.get_decisions(),
            "sentiment": transcript.summary.sentiment,
            "keywords": transcript.summary.get_keywords()
        }
    
    return {
        "meeting_id": meeting_id,
        "full_text": transcript.full_text,
        "language": transcript.language,
        "segments": segments,
        "summary": summary,
        "created_at": transcript.created_at.isoformat(),
        "updated_at": transcript.updated_at.isoformat()
    }


@app.post("/meetings/{meeting_id}/generate-summary")
async def generate_transcript_summary(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    transcript = get_transcript_by_meeting_id(db, meeting_id)
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcrição não encontrada")
    
    # Gerar resumo
    summary = generate_summary(transcript.full_text)
    
    # Atualizar resumo no banco de dados
    if transcript.summary:
        transcript.summary.key_points = summary["key_points"]
        transcript.summary.action_items = summary["action_items"]
        transcript.summary.decisions = summary["decisions"]
        transcript.summary.sentiment = summary["sentiment"]
        transcript.summary.keywords = summary["keywords"]
    else:
        # Criar novo resumo
        summary_data = {
            "transcript_id": transcript.id,
            "key_points": summary["key_points"],
            "action_items": summary["action_items"],
            "decisions": summary["decisions"],
            "sentiment": summary["sentiment"],
            "keywords": summary["keywords"],
            "created_at": datetime.now()
        }
        
        db.add(TranscriptSummary(**summary_data))
    
    db.commit()
    
    return summary


# Integração com RD Station
@app.post("/meetings/{meeting_id}/export-to-rdstation")
async def export_to_rdstation(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    meeting = get_meeting_by_id(db, meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    if meeting.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso não autorizado a esta reunião")
    
    transcript = get_transcript_by_meeting_id(db, meeting_id)
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcrição não encontrada")
    
    # Obter participantes
    participants = []
    for participant in meeting.participants:
        participants.append({
            "email": participant.email or "",
            "name": participant.name,
            "company": ""
        })
    
    # Adicionar proprietário da reunião se não estiver na lista
    owner_in_list = any(p.get("email") == current_user.email for p in participants)
    if not owner_in_list:
        participants.append({
            "email": current_user.email,
            "name": current_user.name,
            "company": current_user.company or ""
        })
    
    # Construir dados da transcrição
    transcript_data = {
        "meeting_id": meeting_id,
        "full_text": transcript.full_text,
        "segments": [
            {
                "start_time": segment.start_time,
                "end_time": segment.end_time,
                "speaker": segment.speaker,
                "text": segment.text
            }
            for segment in transcript.segments
        ]
    }
    
    if transcript.summary:
        transcript_data["summary"] = {
            "key_points": transcript.summary.get_key_points(),
            "action_items": transcript.summary.get_action_items(),
            "decisions": transcript.summary.get_decisions(),
            "sentiment": transcript.summary.sentiment,
            "keywords": transcript.summary.get_keywords()
        }
    
    # Exportar para RD Station
    meeting_data = {
        "id": meeting.id,
        "title": meeting.title,
        "started_at": meeting.started_at.isoformat() if meeting.started_at else None,
        "ended_at": meeting.ended_at.isoformat() if meeting.ended_at else None,
        "duration_seconds": meeting.duration_seconds
    }
    
    result = export_meeting_to_rdstation(meeting_data, transcript_data, participants)
    
    # Registrar exportação no banco de dados
    for contact_result in result.get("contacts", []):
        if "error" not in contact_result:
            export_data = {
                "meeting_id": meeting_id,
                "rd_station_id": contact_result.get("id", ""),
                "export_type": "contact",
                "status": "success",
                "created_at": datetime.now()
            }
            db.add(RDStationExport(**export_data))
    
    for opportunity_result in result.get("opportunities", []):
        if "error" not in opportunity_result:
            export_data = {
                "meeting_id": meeting_id,
                "rd_station_id": opportunity_result.get("id", ""),
                "export_type": "opportunity",
                "status": "success",
                "created_at": datetime.now()
            }
            db.add(RDStationExport(**export_data))
    
    db.commit()
    
    return result


# Busca em transcrições
@app.get("/search")
async def search(
    query: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    results = search_transcripts(db, query, limit)
    
    # Filtrar resultados para mostrar apenas reuniões do usuário
    filtered_results = []
    for result in results:
        meeting = get_meeting_by_id(db, result["meeting_id"])
        if meeting and meeting.owner_id == current_user.id:
            filtered_results.append(result)
    
    return filtered_results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 