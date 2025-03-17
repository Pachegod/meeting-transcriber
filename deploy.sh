#!/bin/bash

# Script de implantação para o Meeting Transcriber
# Uso: ./deploy.sh [ambiente]
# Exemplo: ./deploy.sh production

# Definir cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar argumentos
ENVIRONMENT=${1:-development}
echo -e "${YELLOW}Implantando para ambiente: ${ENVIRONMENT}${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker antes de continuar.${NC}"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
    exit 1
fi

# Configurar variáveis de ambiente com base no ambiente
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}Configurando variáveis de ambiente para produção...${NC}"
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env.local
    
    # Atualizar variáveis para produção
    sed -i 's|http://localhost:8000/api|https://api.meeting-transcriber.com.br/api|g' frontend/.env.local
    sed -i 's|NEXT_PUBLIC_RD_STATION_ENABLED=false|NEXT_PUBLIC_RD_STATION_ENABLED=true|g' frontend/.env.local
    
    # Configurar variáveis de segurança
    SECRET_KEY=$(openssl rand -hex 32)
    sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|g" backend/.env
    sed -i 's|ENVIRONMENT=development|ENVIRONMENT=production|g' backend/.env
else
    echo -e "${YELLOW}Configurando variáveis de ambiente para desenvolvimento...${NC}"
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env.local
fi

# Construir e iniciar os contêineres
echo -e "${YELLOW}Construindo e iniciando os contêineres...${NC}"
docker-compose build
docker-compose up -d

# Verificar se os contêineres estão em execução
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Implantação concluída com sucesso!${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
else
    echo -e "${RED}Falha na implantação. Verifique os logs para mais detalhes.${NC}"
    echo -e "${YELLOW}docker-compose logs${NC}"
    exit 1
fi

# Instruções adicionais
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Acesse o frontend em http://localhost:3000"
echo -e "2. Crie uma conta de administrador"
echo -e "3. Configure as integrações necessárias"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${YELLOW}Notas para produção:${NC}"
    echo -e "1. Configure um domínio para o frontend e backend"
    echo -e "2. Configure HTTPS usando Let's Encrypt"
    echo -e "3. Configure backups regulares do banco de dados"
fi

exit 0 