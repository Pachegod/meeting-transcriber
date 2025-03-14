from fastapi import FastAPI, Request, Response
from agent import Agent
import uvicorn
import asyncio

app = FastAPI()
agent = Agent()

@app.post("/webhook")
async def webhook(request: Request):
    """
    Endpoint para receber webhooks do Twilio
    """
    try:
        # Obtém os dados do formulário
        form_data = await request.form()
        
        # Extrai informações da mensagem
        from_number = form_data.get("From", "").replace("whatsapp:", "")
        message = form_data.get("Body", "")
        
        # Processa a mensagem de forma assíncrona
        asyncio.create_task(agent.handle_message(from_number, message))
        
        # Retorna uma resposta vazia para o Twilio
        return Response(content="", media_type="text/plain")
        
    except Exception as e:
        print(f"Erro ao processar webhook: {str(e)}")
        return Response(
            content="Erro interno",
            media_type="text/plain",
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 