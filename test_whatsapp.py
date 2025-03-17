from utils.config import Config
from services.whatsapp_service import WhatsAppService
import asyncio

async def main():
    config = Config()
    whatsapp = WhatsAppService(config)
    
    # Número para onde você quer enviar a mensagem (seu WhatsApp)
    to_number = input("Digite seu número do WhatsApp (ex: +5511999999999): ")
    
    # Testa o envio de mensagem
    print("\nEnviando mensagem de teste...")
    await whatsapp.send_message(
        to_number,
        "🤖 Olá! Sou seu assistente virtual.\n\n"
        "Você pode usar os seguintes comandos:\n"
        "• *ajuda* - Mostra esta mensagem\n"
        "• *listar eventos* - Mostra seus próximos eventos\n"
        "• *agendar reunião* - Inicia o processo de agendamento"
    )
    print("Mensagem enviada!")

if __name__ == "__main__":
    asyncio.run(main()) 