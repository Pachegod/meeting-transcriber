# Guia de Implantação - Meeting Transcriber

Este documento fornece instruções detalhadas para implantar o Meeting Transcriber em diferentes ambientes.

## Índice

1. [Requisitos](#requisitos)
2. [Implantação Local com Docker](#implantação-local-com-docker)
3. [Implantação em Produção](#implantação-em-produção)
   - [Frontend no Vercel](#frontend-no-vercel)
   - [Backend em VPS](#backend-em-vps)
4. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
5. [Monitoramento e Logs](#monitoramento-e-logs)
6. [Backups](#backups)
7. [Solução de Problemas](#solução-de-problemas)

## Requisitos

### Para Desenvolvimento Local

- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Redis 6+

### Para Implantação com Docker

- Docker 20.10+
- Docker Compose 2.0+

### Para Implantação em Produção

- Conta no Vercel (para o frontend)
- Servidor VPS com Ubuntu 20.04+ (para o backend)
- Domínio registrado
- Certificado SSL (Let's Encrypt)

## Implantação Local com Docker

A maneira mais simples de implantar o projeto completo localmente é usando Docker Compose:

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/meeting-transcriber.git
   cd meeting-transcriber
   ```

2. Execute o script de implantação:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   Ou manualmente:
   ```bash
   # Configurar variáveis de ambiente
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   
   # Construir e iniciar os contêineres
   docker-compose build
   docker-compose up -d
   ```

3. Acesse a aplicação:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Documentação da API: http://localhost:8000/docs

## Implantação em Produção

### Frontend no Vercel

1. Faça fork do repositório no GitHub

2. Conecte o repositório ao Vercel:
   - Acesse https://vercel.com/
   - Clique em "New Project"
   - Importe o repositório do GitHub
   - Selecione o diretório `frontend` como raiz do projeto

3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL`: URL da sua API backend (ex: https://api.meeting-transcriber.com.br/api)
   - `NEXT_PUBLIC_RD_STATION_ENABLED`: "true" ou "false"

4. Clique em "Deploy" para implantar o frontend

### Backend em VPS

1. Configure um servidor com Ubuntu 20.04+:
   ```bash
   # Atualize o sistema
   sudo apt-get update
   sudo apt-get upgrade -y
   
   # Instale as dependências
   sudo apt-get install -y python3 python3-pip python3-venv nginx postgresql redis-server ffmpeg
   ```

2. Configure o PostgreSQL:
   ```bash
   # Crie um usuário e banco de dados
   sudo -u postgres psql -c "CREATE USER meeting_transcriber WITH PASSWORD 'senha_segura';"
   sudo -u postgres psql -c "CREATE DATABASE meeting_transcriber OWNER meeting_transcriber;"
   ```

3. Configure o Redis:
   ```bash
   # Verifique se o Redis está funcionando
   sudo systemctl status redis-server
   ```

4. Clone o repositório e configure o backend:
   ```bash
   git clone https://github.com/seu-usuario/meeting-transcriber.git
   cd meeting-transcriber/backend
   
   # Crie um ambiente virtual
   python3 -m venv venv
   source venv/bin/activate
   
   # Instale as dependências
   pip install -r requirements.txt
   
   # Configure as variáveis de ambiente
   cp .env.example .env
   nano .env  # Edite as variáveis conforme necessário
   ```

5. Configure o Gunicorn e Nginx:
   ```bash
   # Instale o Gunicorn
   pip install gunicorn
   
   # Crie um serviço systemd
   sudo nano /etc/systemd/system/meeting-transcriber.service
   ```
   
   Conteúdo do arquivo de serviço:
   ```
   [Unit]
   Description=Meeting Transcriber API
   After=network.target
   
   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/meeting-transcriber/backend
   Environment="PATH=/home/ubuntu/meeting-transcriber/backend/venv/bin"
   ExecStart=/home/ubuntu/meeting-transcriber/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Configure o Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/meeting-transcriber
   ```
   
   Conteúdo do arquivo de configuração:
   ```
   server {
       listen 80;
       server_name api.meeting-transcriber.com.br;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   Ative a configuração:
   ```bash
   sudo ln -s /etc/nginx/sites-available/meeting-transcriber /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Configure HTTPS com Let's Encrypt:
   ```bash
   # Instale o Certbot
   sudo apt-get install -y certbot python3-certbot-nginx
   
   # Obtenha o certificado
   sudo certbot --nginx -d api.meeting-transcriber.com.br
   ```

7. Inicie o serviço:
   ```bash
   sudo systemctl start meeting-transcriber
   sudo systemctl enable meeting-transcriber
   ```

## Configuração de Variáveis de Ambiente

### Backend (.env)

```
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/meeting_transcriber

# Redis
REDIS_URL=redis://localhost:6379/0

# Segurança
SECRET_KEY=chave_secreta_muito_segura
TOKEN_EXPIRATION=3600
REFRESH_TOKEN_EXPIRATION=604800

# OpenAI Whisper
OPENAI_API_KEY=sua_chave_api_openai

# RD Station
RD_STATION_API_KEY=sua_chave_api_rdstation
RD_STATION_ENABLED=true

# Servidor
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://meeting-transcriber.com.br
```

### Frontend (.env.local)

```
# API URL
NEXT_PUBLIC_API_URL=https://api.meeting-transcriber.com.br/api

# RD Station
NEXT_PUBLIC_RD_STATION_ENABLED=true

# Analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ID=seu_id_analytics

# Monitoramento (opcional)
NEXT_PUBLIC_SENTRY_DSN=sua_dsn_sentry
```

## Monitoramento e Logs

### Frontend

Os logs do frontend são centralizados através do serviço de logger implementado em `frontend/src/lib/logger.ts`. Em produção, recomenda-se integrar com um serviço de monitoramento como Sentry.

Para integrar com o Sentry:
1. Crie uma conta no Sentry (https://sentry.io/)
2. Crie um projeto para o frontend
3. Adicione a DSN do Sentry às variáveis de ambiente
4. Descomente o código de integração com o Sentry no arquivo `logger.ts`

### Backend

Os logs do backend são gerenciados pelo sistema de logging do FastAPI. Em produção, recomenda-se configurar um serviço como ELK Stack ou Datadog para monitoramento.

Para visualizar os logs do backend:
```bash
# Logs do serviço systemd
sudo journalctl -u meeting-transcriber

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Backups

### Banco de Dados

Configure backups regulares do banco de dados PostgreSQL:

```bash
# Crie um script de backup
sudo nano /usr/local/bin/backup-db.sh
```

Conteúdo do script:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/meeting_transcriber_$TIMESTAMP.sql"

# Crie o diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Faça o backup
pg_dump -U meeting_transcriber -d meeting_transcriber -f $BACKUP_FILE

# Comprima o arquivo
gzip $BACKUP_FILE

# Mantenha apenas os últimos 7 backups
find $BACKUP_DIR -name "meeting_transcriber_*.sql.gz" -type f -mtime +7 -delete
```

Torne o script executável e configure um cron job:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
```

Adicione a seguinte linha para executar o backup diariamente às 2h da manhã:
```
0 2 * * * /usr/local/bin/backup-db.sh
```

## Solução de Problemas

### Problemas Comuns

1. **Erro de conexão com o banco de dados**
   - Verifique se o PostgreSQL está em execução: `sudo systemctl status postgresql`
   - Verifique as credenciais no arquivo `.env`
   - Verifique se o banco de dados existe: `sudo -u postgres psql -c "\l"`

2. **Erro de conexão com o Redis**
   - Verifique se o Redis está em execução: `sudo systemctl status redis-server`
   - Verifique a URL do Redis no arquivo `.env`

3. **Erro 502 Bad Gateway no Nginx**
   - Verifique se o backend está em execução: `sudo systemctl status meeting-transcriber`
   - Verifique os logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

4. **Problemas com CORS**
   - Verifique a configuração de `CORS_ORIGINS` no arquivo `.env` do backend
   - Certifique-se de que o domínio do frontend está incluído na lista de origens permitidas

5. **Problemas com o frontend no Vercel**
   - Verifique as variáveis de ambiente no painel do Vercel
   - Verifique os logs de build e implantação no painel do Vercel

### Comandos Úteis

```bash
# Reiniciar o backend
sudo systemctl restart meeting-transcriber

# Verificar status do backend
sudo systemctl status meeting-transcriber

# Reiniciar o Nginx
sudo systemctl restart nginx

# Verificar configuração do Nginx
sudo nginx -t

# Verificar logs do backend
sudo journalctl -u meeting-transcriber -f

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
``` 