from config import Config
from services.whatsapp_service import WhatsAppService
from services.google_calendar_service import GoogleCalendarService
from datetime import datetime, timedelta
import re
import asyncio

class Agent:
    def __init__(self):
        self.config = Config()
        self.whatsapp = WhatsAppService(self.config)
        self.calendar = GoogleCalendarService(self.config)
    
    def parse_datetime(self, date_str, time_str):
        """
        Converte strings de data e hora em objeto datetime
        """
        try:
            # Converte data no formato dd/mm/yyyy
            day, month, year = map(int, date_str.split('/'))
            # Converte hora no formato HH:MM
            hour, minute = map(int, time_str.split(':'))
            
            return datetime(year, month, day, hour, minute)
        except:
            return None
    
    async def handle_message(self, from_number, message):
        """
        Processa mensagens recebidas e retorna respostas apropriadas
        """
        message = message.lower().strip()
        
        # Comando de ajuda
        if message == "ajuda":
            help_text = (
                "🤖 *Comandos disponíveis:*\n\n"
                "• *agendar reunião* - Inicia o processo de agendamento\n"
                "• *listar eventos* - Mostra seus próximos eventos\n"
                "• *ajuda* - Mostra esta mensagem\n\n"
                "Para agendar uma reunião, envie:\n"
                "agendar reunião\n"
                "título: Sua reunião\n"
                "descrição: Detalhes da reunião\n"
                "data: dd/mm/yyyy\n"
                "hora: HH:MM\n"
                "duração: 60 (em minutos)\n"
                "participantes: email1@gmail.com, email2@gmail.com"
            )
            await self.whatsapp.send_message(from_number, help_text)
            return
        
        # Listar eventos
        if message == "listar eventos":
            events = await self.calendar.get_meetings()
            events_text = await self.whatsapp.format_calendar_list(events)
            await self.whatsapp.send_message(from_number, events_text)
            return
        
        # Agendar reunião
        if "agendar reunião" in message:
            # Extrai informações da mensagem
            title_match = re.search(r"título:\s*(.+)", message)
            desc_match = re.search(r"descrição:\s*(.+)", message)
            date_match = re.search(r"data:\s*(\d{2}/\d{2}/\d{4})", message)
            time_match = re.search(r"hora:\s*(\d{2}:\d{2})", message)
            duration_match = re.search(r"duração:\s*(\d+)", message)
            participants_match = re.search(r"participantes:\s*(.+)", message)
            
            if not all([title_match, date_match, time_match]):
                error_text = (
                    "❌ Formato inválido. Use:\n\n"
                    "agendar reunião\n"
                    "título: Sua reunião\n"
                    "descrição: Detalhes da reunião\n"
                    "data: dd/mm/yyyy\n"
                    "hora: HH:MM\n"
                    "duração: 60 (em minutos)\n"
                    "participantes: email1@gmail.com, email2@gmail.com"
                )
                await self.whatsapp.send_message(from_number, error_text)
                return
            
            # Processa os dados
            title = title_match.group(1)
            description = desc_match.group(1) if desc_match else ""
            start_time = self.parse_datetime(date_match.group(1), time_match.group(1))
            duration = int(duration_match.group(1)) if duration_match else 60
            end_time = start_time + timedelta(minutes=duration)
            attendees = []
            
            if participants_match:
                attendees = [
                    email.strip() 
                    for email in participants_match.group(1).split(',')
                ]
            
            try:
                # Cria o evento
                meeting_link = await self.calendar.create_meeting(
                    title=title,
                    description=description,
                    start_time=start_time,
                    end_time=end_time,
                    attendees=attendees
                )
                
                # Formata e envia a confirmação
                event_text = await self.whatsapp.format_calendar_event(
                    title=title,
                    description=description,
                    start_time=start_time,
                    end_time=end_time,
                    meeting_link=meeting_link
                )
                
                success_text = "✅ *Evento criado com sucesso!*\n\n" + event_text
                await self.whatsapp.send_message(from_number, success_text)
                
            except Exception as e:
                error_text = f"❌ Erro ao criar evento: {str(e)}"
                await self.whatsapp.send_message(from_number, error_text)
            
            return
        
        # Mensagem não reconhecida
        unknown_text = (
            "Desculpe, não entendi seu comando. "
            "Envie *ajuda* para ver os comandos disponíveis."
        )
        await self.whatsapp.send_message(from_number, unknown_text) 