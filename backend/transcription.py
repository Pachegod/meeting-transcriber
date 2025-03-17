import whisper
import numpy as np
import torch
from typing import Dict, List, Optional, Tuple
import base64
import io
import wave
import logging
from datetime import datetime
import os
from transformers import pipeline

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Verificar disponibilidade de GPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Usando dispositivo: {DEVICE}")

# Carregar modelo Whisper
MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "medium")
logger.info(f"Carregando modelo Whisper {MODEL_SIZE}...")

try:
    model = whisper.load_model(MODEL_SIZE, device=DEVICE)
    logger.info("Modelo Whisper carregado com sucesso")
except Exception as e:
    logger.error(f"Erro ao carregar modelo Whisper: {e}")
    model = None

# Carregar modelo de análise de sentimento
try:
    sentiment_analyzer = pipeline(
        "sentiment-analysis", 
        model="neuralmind/bert-base-portuguese-cased", 
        device=0 if DEVICE == "cuda" else -1
    )
    logger.info("Modelo de análise de sentimento carregado com sucesso")
except Exception as e:
    logger.error(f"Erro ao carregar modelo de análise de sentimento: {e}")
    sentiment_analyzer = None

# Carregar modelo de extração de palavras-chave
try:
    keyword_extractor = pipeline(
        "token-classification", 
        model="pierreguillou/bert-base-cased-pt-ner", 
        device=0 if DEVICE == "cuda" else -1
    )
    logger.info("Modelo de extração de palavras-chave carregado com sucesso")
except Exception as e:
    logger.error(f"Erro ao carregar modelo de extração de palavras-chave: {e}")
    keyword_extractor = None


def decode_audio(base64_audio: str, sample_rate: int = 16000) -> np.ndarray:
    """Decodifica áudio em base64 para numpy array."""
    try:
        # Decodificar base64
        audio_bytes = base64.b64decode(base64_audio)
        
        # Converter bytes para numpy array
        with io.BytesIO(audio_bytes) as buffer:
            with wave.open(buffer, 'rb') as wf:
                frames = wf.readframes(wf.getnframes())
                audio_array = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                
                # Converter para mono se necessário
                if wf.getnchannels() > 1:
                    audio_array = audio_array.reshape(-1, wf.getnchannels())
                    audio_array = audio_array.mean(axis=1)
                
                # Resample para 16kHz se necessário
                if wf.getframerate() != sample_rate:
                    # Implementar resampling aqui se necessário
                    pass
                
                return audio_array
    except Exception as e:
        logger.error(f"Erro ao decodificar áudio: {e}")
        return np.array([])


def transcribe_audio_chunk(audio_data: np.ndarray, language: str = "pt") -> Dict:
    """Transcreve um trecho de áudio usando Whisper."""
    if model is None:
        return {"error": "Modelo Whisper não carregado"}
    
    try:
        # Transcrever áudio
        result = model.transcribe(
            audio_data,
            language=language,
            task="transcribe",
            fp16=torch.cuda.is_available()
        )
        
        return result
    except Exception as e:
        logger.error(f"Erro na transcrição: {e}")
        return {"error": str(e)}


def analyze_sentiment(text: str) -> str:
    """Analisa o sentimento do texto."""
    if sentiment_analyzer is None or not text:
        return "neutral"
    
    try:
        result = sentiment_analyzer(text)
        if result[0]["label"] == "POSITIVE":
            return "positive"
        elif result[0]["label"] == "NEGATIVE":
            return "negative"
        else:
            return "neutral"
    except Exception as e:
        logger.error(f"Erro na análise de sentimento: {e}")
        return "neutral"


def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """Extrai palavras-chave do texto."""
    if keyword_extractor is None or not text:
        return []
    
    try:
        results = keyword_extractor(text)
        
        # Extrair entidades únicas
        keywords = []
        for result in results:
            if result["entity"] in ["B-PER", "B-ORG", "B-LOC", "B-MISC"]:
                keyword = result["word"].replace("##", "")
                if keyword not in keywords:
                    keywords.append(keyword)
        
        return keywords[:max_keywords]
    except Exception as e:
        logger.error(f"Erro na extração de palavras-chave: {e}")
        return []


def generate_summary(transcript: str) -> Dict:
    """Gera um resumo da transcrição."""
    # Aqui seria ideal usar um modelo de linguagem como GPT para gerar resumos
    # Por enquanto, implementamos uma versão simplificada
    
    if not transcript:
        return {
            "key_points": [],
            "action_items": [],
            "decisions": [],
            "sentiment": "neutral",
            "keywords": []
        }
    
    # Análise de sentimento
    sentiment = analyze_sentiment(transcript)
    
    # Extração de palavras-chave
    keywords = extract_keywords(transcript)
    
    # Identificação de pontos-chave (simplificada)
    sentences = transcript.split('.')
    key_points = [s.strip() for s in sentences if len(s.strip()) > 20][:5]
    
    # Identificação de itens de ação (simplificada)
    action_items = []
    action_keywords = ["precisa", "deve", "vamos", "faremos", "será", "prazo"]
    for sentence in sentences:
        if any(keyword in sentence.lower() for keyword in action_keywords):
            action_items.append(sentence.strip())
    
    # Identificação de decisões (simplificada)
    decisions = []
    decision_keywords = ["decidimos", "decidido", "acordo", "concordamos", "aprovado"]
    for sentence in sentences:
        if any(keyword in sentence.lower() for keyword in decision_keywords):
            decisions.append(sentence.strip())
    
    return {
        "key_points": key_points[:5],
        "action_items": action_items[:5],
        "decisions": decisions[:3],
        "sentiment": sentiment,
        "keywords": keywords
    }


def process_audio_chunk(base64_audio: str, meeting_id: str, timestamp: float) -> Dict:
    """Processa um trecho de áudio e retorna a transcrição e análises."""
    # Decodificar áudio
    audio_data = decode_audio(base64_audio)
    if len(audio_data) == 0:
        return {"error": "Falha ao decodificar áudio"}
    
    # Transcrever áudio
    transcription = transcribe_audio_chunk(audio_data)
    if "error" in transcription:
        return transcription
    
    # Extrair texto
    text = transcription.get("text", "")
    
    # Criar segmento
    segment = {
        "start_time": timestamp,
        "end_time": timestamp + len(audio_data) / 16000,  # Estimativa baseada na taxa de amostragem
        "speaker": None,  # Identificação de falante seria implementada separadamente
        "text": text,
        "confidence": transcription.get("segments", [{}])[0].get("confidence", 0.0) if transcription.get("segments") else 0.0
    }
    
    return {
        "meeting_id": meeting_id,
        "segment": segment,
        "is_final": True
    } 