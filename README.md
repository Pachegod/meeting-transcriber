# Meeting Transcriber - Sistema de Gravação e Transcrição de Reuniões

Sistema para gravação, transcrição e análise de reuniões com integração ao RD Station.

## Funcionalidades Principais

- Gravação de áudio multi-plataforma (web, desktop, mobile)
- Transcrição em tempo real usando OpenAI Whisper
- Análise de sentimento e extração de palavras-chave
- Identificação de falantes
- Exportação de transcrições em múltiplos formatos
- Integração com RD Station para acompanhamento de leads
- Interface responsiva e intuitiva

## Estrutura do Projeto

```
meeting-transcriber/
├── frontend/         # Aplicação Next.js
├── backend/          # API FastAPI
└── docs/             # Documentação
    ├── api-reference.md      # Referência da API
    ├── deployment.md         # Guia de implantação
    └── troubleshooting.md    # Solução de problemas
```

## Requisitos do Sistema

### Frontend
- Node.js 18+
- npm 9+

### Backend
- Python 3.9+
- PostgreSQL 13+
- Redis 6+

## Instalação e Execução

### Clonando o Repositório

```powershell
# Clone o repositório
git clone https://github.com/seu-usuario/meeting-transcriber.git
cd meeting-transcriber
```

### Backend

1. Navegue até o diretório do backend:
   ```powershell
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Instale as dependências:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente (crie um arquivo `.env`):
   ```
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/meeting_transcriber
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=sua_chave_secreta
   ```

5. Execute o servidor:
   ```powershell
   python run.py
   ```

### Frontend

1. Navegue até o diretório do frontend:
   ```powershell
   cd frontend
   ```

2. Instale as dependências:
   ```powershell
   npm install
   ```

3. Configure as variáveis de ambiente (crie um arquivo `.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Execute o servidor de desenvolvimento:
   ```powershell
   npm run dev
   ```

5. Acesse a aplicação em `http://localhost:3000`

## Configuração de Ambiente

### Variáveis de Ambiente do Backend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | URL de conexão com o PostgreSQL | postgresql://usuario:senha@localhost:5432/meeting_transcriber |
| REDIS_URL | URL de conexão com o Redis | redis://localhost:6379 |
| SECRET_KEY | Chave secreta para tokens JWT | chave_aleatoria_segura |
| OPENAI_API_KEY | Chave da API OpenAI (opcional) | sk-... |
| RDSTATION_API_KEY | Chave da API RD Station (opcional) | chave_rdstation |

### Variáveis de Ambiente do Frontend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| NEXT_PUBLIC_API_URL | URL da API backend | http://localhost:8000 |

## Arquitetura

O projeto segue uma arquitetura cliente-servidor:

- **Frontend**: Aplicação Next.js com React, TypeScript e TailwindCSS
- **Backend**: API RESTful com FastAPI, SQLAlchemy e Pydantic
- **Banco de Dados**: PostgreSQL para armazenamento persistente
- **Cache**: Redis para armazenamento em cache e filas de tarefas

## Melhorias Recentes

- Tratamento de erros centralizado
- Logging aprimorado
- Cliente HTTP avançado com retry e circuit breaker
- Otimização de performance na transcrição
- Melhorias de acessibilidade na interface

## Solução de Problemas Comuns

Consulte nossa [documentação de solução de problemas](docs/troubleshooting.md) para resolver problemas comuns.

## Documentação da API

Para detalhes sobre os endpoints disponíveis, consulte a [documentação da API](docs/api-reference.md).

## Implantação

Para instruções detalhadas sobre como implantar o projeto em diferentes ambientes, consulte o [guia de implantação](docs/deployment.md).

## Convenções de Desenvolvimento

- **Estilo de código**: Seguimos o PEP 8 para Python e o Airbnb Style Guide para JavaScript/TypeScript
- **Commits**: Utilizamos Conventional Commits (feat, fix, docs, etc.)
- **Branches**: Utilizamos GitFlow (main, develop, feature/, release/, hotfix/)

## Fluxo de Trabalho para Contribuições

1. Crie uma branch a partir de `develop`
2. Implemente suas alterações
3. Envie um Pull Request para `develop`
4. Após revisão, o PR será mesclado

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes. 