import requests
import json
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import base64
import time
import uuid
from abc import ABC, abstractmethod

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MeetingPlatform(ABC):
    """Classe base para integração com plataformas de reunião."""
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Autentica na plataforma."""
        pass
    
    @abstractmethod
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, 
                      description: Optional[str] = None) -> Dict:
        """Cria uma nova reunião."""
        pass
    
    @abstractmethod
    def get_meeting_details(self, meeting_id: str) -> Dict:
        """Obtém detalhes de uma reunião."""
        pass
    
    @abstractmethod
    def get_participants(self, meeting_id: str) -> List[Dict]:
        """Obtém lista de participantes de uma reunião."""
        pass
    
    @abstractmethod
    def get_recording_url(self, meeting_id: str) -> Optional[str]:
        """Obtém URL da gravação de uma reunião."""
        pass


class ZoomPlatform(MeetingPlatform):
    """Integração com a plataforma Zoom."""
    
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ZOOM_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("ZOOM_API_SECRET", "")
        self.base_url = "https://api.zoom.us/v2"
        self.token = None
        self.token_expiry = None
    
    def authenticate(self) -> bool:
        """Autentica na API do Zoom usando OAuth."""
        if not self.api_key or not self.api_secret:
            logger.error("Credenciais do Zoom não configuradas")
            return False
        
        # Verificar se o token ainda é válido
        if self.token and self.token_expiry and datetime.now() < self.token_expiry:
            return True
        
        try:
            # Codificar credenciais em base64
            credentials = f"{self.api_key}:{self.api_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            # Fazer requisição de token
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "client_credentials"
            }
            
            response = requests.post(
                "https://zoom.us/oauth/token",
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)
                self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
                return True
            else:
                logger.error(f"Erro na autenticação do Zoom: {response.text}")
                return False
        
        except Exception as e:
            logger.error(f"Erro na autenticação do Zoom: {e}")
            return False
    
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, 
                      description: Optional[str] = None) -> Dict:
        """Cria uma nova reunião no Zoom."""
        if not self.authenticate():
            return {"error": "Falha na autenticação"}
        
        url = f"{self.base_url}/users/me/meetings"
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "topic": title,
            "type": 2,  # Reunião agendada
            "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "duration": duration_minutes,
            "timezone": "America/Sao_Paulo",
            "settings": {
                "host_video": True,
                "participant_video": True,
                "join_before_host": True,
                "mute_upon_entry": False,
                "auto_recording": "cloud"
            }
        }
        
        if description:
            data["agenda"] = description
        
        try:
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Erro ao criar reunião no Zoom: {response.text}")
                return {"error": response.text}
        
        except Exception as e:
            logger.error(f"Erro ao criar reunião no Zoom: {e}")
            return {"error": str(e)}
    
    def get_meeting_details(self, meeting_id: str) -> Dict:
        """Obtém detalhes de uma reunião do Zoom."""
        if not self.authenticate():
            return {"error": "Falha na autenticação"}
        
        url = f"{self.base_url}/meetings/{meeting_id}"
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Erro ao obter detalhes da reunião no Zoom: {response.text}")
                return {"error": response.text}
        
        except Exception as e:
            logger.error(f"Erro ao obter detalhes da reunião no Zoom: {e}")
            return {"error": str(e)}
    
    def get_participants(self, meeting_id: str) -> List[Dict]:
        """Obtém lista de participantes de uma reunião do Zoom."""
        if not self.authenticate():
            return [{"error": "Falha na autenticação"}]
        
        url = f"{self.base_url}/report/meetings/{meeting_id}/participants"
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("participants", [])
            else:
                logger.error(f"Erro ao obter participantes da reunião no Zoom: {response.text}")
                return [{"error": response.text}]
        
        except Exception as e:
            logger.error(f"Erro ao obter participantes da reunião no Zoom: {e}")
            return [{"error": str(e)}]
    
    def get_recording_url(self, meeting_id: str) -> Optional[str]:
        """Obtém URL da gravação de uma reunião do Zoom."""
        if not self.authenticate():
            return None
        
        url = f"{self.base_url}/meetings/{meeting_id}/recordings"
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                recording_files = data.get("recording_files", [])
                
                # Procurar gravação de áudio
                for recording in recording_files:
                    if recording.get("file_type") == "M4A":
                        return recording.get("download_url")
                
                # Se não encontrar áudio, procurar vídeo
                for recording in recording_files:
                    if recording.get("file_type") == "MP4":
                        return recording.get("download_url")
                
                return None
            else:
                logger.error(f"Erro ao obter gravação da reunião no Zoom: {response.text}")
                return None
        
        except Exception as e:
            logger.error(f"Erro ao obter gravação da reunião no Zoom: {e}")
            return None


class GoogleMeetPlatform(MeetingPlatform):
    """Integração com a plataforma Google Meet."""
    
    def __init__(self, credentials_file: Optional[str] = None):
        self.credentials_file = credentials_file or os.environ.get("GOOGLE_CREDENTIALS_FILE", "")
        self.token = None
        self.token_expiry = None
        
        # Nota: Implementação completa requer autenticação OAuth2 com Google
        # e uso da API do Google Calendar para criar reuniões
    
    def authenticate(self) -> bool:
        """Autentica na API do Google."""
        # Implementação simplificada
        logger.info("Autenticação do Google Meet não implementada completamente")
        return False
    
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, 
                      description: Optional[str] = None) -> Dict:
        """Cria uma nova reunião no Google Meet."""
        # Implementação simplificada
        return {
            "id": f"meet-{uuid.uuid4()}",
            "title": title,
            "start_time": start_time.isoformat(),
            "duration": duration_minutes,
            "join_url": f"https://meet.google.com/mock-meet-url",
            "platform": "google_meet"
        }
    
    def get_meeting_details(self, meeting_id: str) -> Dict:
        """Obtém detalhes de uma reunião do Google Meet."""
        # Implementação simplificada
        return {
            "id": meeting_id,
            "status": "scheduled",
            "platform": "google_meet"
        }
    
    def get_participants(self, meeting_id: str) -> List[Dict]:
        """Obtém lista de participantes de uma reunião do Google Meet."""
        # Implementação simplificada
        return []
    
    def get_recording_url(self, meeting_id: str) -> Optional[str]:
        """Obtém URL da gravação de uma reunião do Google Meet."""
        # Implementação simplificada
        return None


class MSTeamsPlatform(MeetingPlatform):
    """Integração com a plataforma Microsoft Teams."""
    
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        self.client_id = client_id or os.environ.get("MS_TEAMS_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("MS_TEAMS_CLIENT_SECRET", "")
        self.token = None
        self.token_expiry = None
        
        # Nota: Implementação completa requer autenticação OAuth2 com Microsoft
        # e uso da API do Microsoft Graph para criar reuniões
    
    def authenticate(self) -> bool:
        """Autentica na API do Microsoft Teams."""
        # Implementação simplificada
        logger.info("Autenticação do Microsoft Teams não implementada completamente")
        return False
    
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, 
                      description: Optional[str] = None) -> Dict:
        """Cria uma nova reunião no Microsoft Teams."""
        # Implementação simplificada
        return {
            "id": f"teams-{uuid.uuid4()}",
            "title": title,
            "start_time": start_time.isoformat(),
            "duration": duration_minutes,
            "join_url": f"https://teams.microsoft.com/l/meetup-join/mock-teams-url",
            "platform": "ms_teams"
        }
    
    def get_meeting_details(self, meeting_id: str) -> Dict:
        """Obtém detalhes de uma reunião do Microsoft Teams."""
        # Implementação simplificada
        return {
            "id": meeting_id,
            "status": "scheduled",
            "platform": "ms_teams"
        }
    
    def get_participants(self, meeting_id: str) -> List[Dict]:
        """Obtém lista de participantes de uma reunião do Microsoft Teams."""
        # Implementação simplificada
        return []
    
    def get_recording_url(self, meeting_id: str) -> Optional[str]:
        """Obtém URL da gravação de uma reunião do Microsoft Teams."""
        # Implementação simplificada
        return None


def get_platform_client(platform_type: str) -> MeetingPlatform:
    """Retorna o cliente apropriado para a plataforma especificada."""
    if platform_type == "zoom":
        return ZoomPlatform()
    elif platform_type == "google_meet":
        return GoogleMeetPlatform()
    elif platform_type == "ms_teams":
        return MSTeamsPlatform()
    else:
        raise ValueError(f"Plataforma não suportada: {platform_type}") 