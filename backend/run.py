import uvicorn
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    print(f"Iniciando servidor em {host}:{port}")
    print(f"Modo debug: {debug}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    ) 