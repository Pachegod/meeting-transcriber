import os.path
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import pytz

class GoogleCalendarService:
    def __init__(self, config):
        self.config = config
        self.SCOPES = ['https://www.googleapis.com/auth/calendar']
        self.service = None
        self._authenticate()
    
    def _authenticate(self):
        """
        Realiza a autenticação com o Google Calendar API
        """
        creds = None
        token_path = 'token.pickle'
        
        # Carrega as credenciais salvas se existirem
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)
        
        # Se não há credenciais válidas, solicita ao usuário que faça login
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.config.google_calendar_credentials, 
                    self.SCOPES
                )
                creds = flow.run_local_server(port=0)
            
            # Salva as credenciais para a próxima execução
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
        
        self.service = build('calendar', 'v3', credentials=creds)
    
    async def create_meeting(self, title, description, start_time, end_time, attendees=None):
        """
        Cria um evento no Google Calendar com link para videoconferência
        """
        # Converte os horários para o timezone configurado
        tz = pytz.timezone(self.config.timezone)
        start_time = start_time.astimezone(tz)
        end_time = end_time.astimezone(tz)
        
        # Prepara o evento
        event = {
            'summary': title,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': self.config.timezone,
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': self.config.timezone,
            },
            'conferenceData': {
                'createRequest': {'requestId': f"{title}-{start_time.timestamp()}"}
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': self.config.reminder_minutes}
                ]
            }
        }
        
        # Adiciona os participantes se fornecidos
        if attendees:
            event['attendees'] = [{'email': email} for email in attendees]
        
        # Cria o evento
        event = self.service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        # Retorna o link da videoconferência
        return event.get('hangoutLink')
    
    async def get_meetings(self, max_results=10):
        """
        Retorna os próximos eventos do calendário
        """
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = self.service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', []) 