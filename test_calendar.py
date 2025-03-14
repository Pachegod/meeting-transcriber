from config import Config
from google_calendar_service import GoogleCalendarService
import asyncio
from datetime import datetime, timedelta

async def test_calendar():
    try:
        # Inicializa a configuração e o serviço do Google Calendar
        config = Config()
        calendar_service = GoogleCalendarService(config)
        
        # Define o horário do evento para 1 hora a partir de agora
        start_time = datetime.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=1)
        
        # Testa a criação de um evento
        meeting_link = await calendar_service.create_meeting(
            title="Teste de Reunião",
            description="Esta é uma reunião de teste",
            start_time=start_time,
            end_time=end_time,
            attendees=["seu.email@gmail.com"]
        )
        
        print("Evento criado com sucesso!")
        print(f"Link da reunião: {meeting_link}")
        
        # Lista os próximos eventos
        events = await calendar_service.get_meetings()
        print("\nPróximos eventos:")
        for event in events:
            start = event.get('start', {})
            start_time = start.get('dateTime') or start.get('date')
            print(f"- {event['summary']} em {start_time}")
            
    except Exception as e:
        print(f"Erro durante o teste: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_calendar()) 