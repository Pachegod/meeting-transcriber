# Guia de Implantação

Este documento fornece instruções detalhadas para implantar o Meeting Transcriber em diferentes ambientes.

## Índice

1. [Implantação Local](#implantação-local)
2. [Implantação com Docker](#implantação-com-docker)
3. [Implantação em Nuvem](#implantação-em-nuvem)
   - [Frontend (Vercel)](#frontend-vercel)
   - [Backend (VPS/Cloud)](#backend-vpscloud)
4. [Configuração de CI/CD](#configuração-de-cicd)
5. [Monitoramento e Logs](#monitoramento-e-logs)

## Implantação Local

### Pré-requisitos

- Python 3.9+
- Node.js 18+
- PostgreSQL
- Redis

### Backend

1. Clone o repositório:
   ```powershell
   git clone https://github.com/seu-usuario/meeting-transcriber.git
   cd meeting-transcriber
   ```

2. Configure o ambiente backend:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Configure as variáveis de ambiente:
   ```powershell
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Inicie o servidor:
   ```powershell
   python run.py
   ```

### Frontend

1. Configure o ambiente frontend:
   ```powershell
   cd frontend
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```powershell
   cp .env.local.example .env.local
   # Edite o arquivo .env.local com suas configurações
   ```

3. Inicie o servidor de desenvolvimento:
   ```powershell
   npm run dev
   ```

4. Para produção, construa o aplicativo:
   ```powershell
   npm run build
   npm start
   ```

## Implantação com Docker

### Pré-requisitos

- Docker
- Docker Compose

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/meeting-transcriber.git
   cd meeting-transcriber
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   # Edite os arquivos com suas configurações
   ```

3. Construa e inicie os contêineres:
   ```bash
   docker-compose up -d
   ```

4. Verifique se os serviços estão rodando:
   ```bash
   docker-compose ps
   ```

### Configuração do Docker Compose

O arquivo `docker-compose.yml` inclui:

- Serviço frontend (Next.js)
- Serviço backend (FastAPI)
- PostgreSQL
- Redis

## Implantação em Nuvem

### Frontend (Vercel)

1. Faça fork do repositório no GitHub.

2. Conecte o repositório ao Vercel:
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Selecione o repositório
   - Configure o projeto:
     - Framework Preset: Next.js
     - Root Directory: frontend
     - Build Command: npm run build
     - Output Directory: .next

3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL`: URL da sua API backend (ex: https://api.seu-dominio.com)
   - `NEXT_PUBLIC_RD_STATION_ENABLED`: "true" ou "false"

4. Implante o projeto.

### Backend (VPS/Cloud)

#### Usando Ubuntu 20.04+

1. Configure o servidor:
   ```bash
   apt-get update
   apt-get install -y python3 python3-pip python3-venv nginx postgresql redis ffmpeg
   ```

2. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/meeting-transcriber.git
   cd meeting-transcriber/backend
   ```

3. Configure o ambiente:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Configure o Gunicorn como serviço:
   ```bash
   sudo nano /etc/systemd/system/meeting-transcriber.service
   ```

   Conteúdo do arquivo:
   ```ini
   [Unit]
   Description=Meeting Transcriber API
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/meeting-transcriber/backend
   Environment="PATH=/home/ubuntu/meeting-transcriber/backend/venv/bin"
   ExecStart=/home/ubuntu/meeting-transcriber/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

5. Configure o Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/meeting-transcriber
   ```

   Conteúdo do arquivo:
   ```nginx
   server {
       listen 80;
       server_name api.seu-dominio.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. Ative a configuração:
   ```bash
   sudo ln -s /etc/nginx/sites-available/meeting-transcriber /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. Inicie o serviço:
   ```bash
   sudo systemctl start meeting-transcriber
   sudo systemctl enable meeting-transcriber
   ```

8. Configure HTTPS com Certbot:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.seu-dominio.com
   ```

## Configuração de CI/CD

### GitHub Actions

1. Crie os diretórios para os workflows:
   ```bash
   mkdir -p .github/workflows
   ```

2. Crie o workflow para o frontend:
   ```bash
   nano .github/workflows/frontend.yml
   ```

   Conteúdo do arquivo:
   ```yaml
   name: Frontend CI/CD

   on:
     push:
       branches: [ main ]
       paths:
         - 'frontend/**'
     pull_request:
       branches: [ main ]
       paths:
         - 'frontend/**'

   jobs:
     build:
       runs-on: ubuntu-latest
       
       steps:
       - uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           
       - name: Install dependencies
         run: |
           cd frontend
           npm ci
           
       - name: Lint
         run: |
           cd frontend
           npm run lint
           
       - name: Build
         run: |
           cd frontend
           npm run build
   ```

3. Crie o workflow para o backend:
   ```bash
   nano .github/workflows/backend.yml
   ```

   Conteúdo do arquivo:
   ```yaml
   name: Backend CI/CD

   on:
     push:
       branches: [ main ]
       paths:
         - 'backend/**'
     pull_request:
       branches: [ main ]
       paths:
         - 'backend/**'

   jobs:
     build:
       runs-on: ubuntu-latest
       
       services:
         postgres:
           image: postgres:13
           env:
             POSTGRES_USER: postgres
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: test_db
           ports:
             - 5432:5432
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
             
         redis:
           image: redis:6
           ports:
             - 6379:6379
             
       steps:
       - uses: actions/checkout@v3
       
       - name: Setup Python
         uses: actions/setup-python@v4
         with:
           python-version: '3.9'
           
       - name: Install dependencies
         run: |
           cd backend
           python -m pip install --upgrade pip
           pip install -r requirements.txt
           
       - name: Lint
         run: |
           cd backend
           pip install black flake8
           black --check .
           flake8 .
           
       - name: Test
         run: |
           cd backend
           pytest
         env:
           DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
           REDIS_URL: redis://localhost:6379
           SECRET_KEY: test_secret_key
   ```

## Monitoramento e Logs

### Frontend

Para monitorar o frontend em produção, recomendamos integrar com o Sentry:

1. Crie uma conta no [Sentry](https://sentry.io)
2. Crie um novo projeto para JavaScript/Next.js
3. Instale o SDK:
   ```bash
   cd frontend
   npm install @sentry/nextjs
   ```
4. Configure o Sentry seguindo a documentação oficial

### Backend

Para monitorar o backend em produção, recomendamos:

1. **Logging centralizado**:
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Graylog
   - Datadog

2. **Monitoramento de performance**:
   - New Relic
   - Datadog
   - Prometheus + Grafana

3. **Configuração de alertas**:
   - Configure alertas para erros críticos
   - Configure alertas para uso elevado de recursos
   - Configure alertas para tempos de resposta anormais

### Exemplo de Configuração do Datadog

1. Instale o agente Datadog no servidor:
   ```bash
   DD_API_KEY=sua_api_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
   ```

2. Configure o monitoramento para o PostgreSQL:
   ```bash
   sudo nano /etc/datadog-agent/conf.d/postgres.d/conf.yaml
   ```

3. Configure o monitoramento para o Redis:
   ```bash
   sudo nano /etc/datadog-agent/conf.d/redisdb.d/conf.yaml
   ```

4. Reinicie o agente:
   ```bash
   sudo systemctl restart datadog-agent
   ``` 