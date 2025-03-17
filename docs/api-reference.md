# Documentação da API

Este documento descreve os endpoints disponíveis na API do Meeting Transcriber.

## Base URL

```
http://localhost:8000
```

Em produção:
```
https://api.meeting-transcriber.com
```

## Autenticação

A maioria dos endpoints requer autenticação via token JWT. O token deve ser incluído no cabeçalho HTTP `Authorization` como um Bearer token:

```
Authorization: Bearer <seu_token>
```

Para obter um token, use o endpoint de login.

## Endpoints

### Autenticação

#### Login

```
POST /api/auth/login
```

**Corpo da Requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário"
  }
}
```

#### Registro

```
POST /api/auth/register
```

**Corpo da Requisição:**
```json
{
  "email": "novousuario@exemplo.com",
  "password": "senha123",
  "name": "Novo Usuário"
}
```

**Resposta de Sucesso (201 Created):**
```json
{
  "id": 2,
  "email": "novousuario@exemplo.com",
  "name": "Novo Usuário"
}
```

### Reuniões

#### Listar Reuniões

```
GET /api/meetings
```

**Parâmetros de Consulta:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Resposta de Sucesso (200 OK):**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Reunião de Planejamento",
      "date": "2023-05-15T14:30:00",
      "duration_minutes": 45,
      "status": "completed",
      "transcript_available": true
    },
    {
      "id": 2,
      "title": "Entrevista com Cliente",
      "date": "2023-05-16T10:00:00",
      "duration_minutes": 30,
      "status": "scheduled",
      "transcript_available": false
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

#### Obter Detalhes da Reunião

```
GET /api/meetings/{meeting_id}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "title": "Reunião de Planejamento",
  "description": "Discussão sobre o roadmap do próximo trimestre",
  "date": "2023-05-15T14:30:00",
  "duration_minutes": 45,
  "status": "completed",
  "transcript_available": true,
  "participants": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@exemplo.com"
    },
    {
      "id": 2,
      "name": "Maria Souza",
      "email": "maria@exemplo.com"
    }
  ],
  "created_at": "2023-05-10T09:15:00",
  "updated_at": "2023-05-15T15:20:00"
}
```

#### Criar Reunião

```
POST /api/meetings
```

**Corpo da Requisição:**
```json
{
  "title": "Nova Reunião",
  "description": "Descrição da reunião",
  "date": "2023-06-01T13:00:00",
  "duration_minutes": 60,
  "participant_emails": ["participante1@exemplo.com", "participante2@exemplo.com"]
}
```

**Resposta de Sucesso (201 Created):**
```json
{
  "id": 3,
  "title": "Nova Reunião",
  "description": "Descrição da reunião",
  "date": "2023-06-01T13:00:00",
  "duration_minutes": 60,
  "status": "scheduled",
  "participants": [
    {
      "id": 3,
      "name": "Participante 1",
      "email": "participante1@exemplo.com"
    },
    {
      "id": 4,
      "name": "Participante 2",
      "email": "participante2@exemplo.com"
    }
  ],
  "created_at": "2023-05-20T11:30:00",
  "updated_at": "2023-05-20T11:30:00"
}
```

#### Atualizar Reunião

```
PUT /api/meetings/{meeting_id}
```

**Corpo da Requisição:**
```json
{
  "title": "Reunião Atualizada",
  "description": "Descrição atualizada",
  "date": "2023-06-02T14:00:00",
  "duration_minutes": 45
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 3,
  "title": "Reunião Atualizada",
  "description": "Descrição atualizada",
  "date": "2023-06-02T14:00:00",
  "duration_minutes": 45,
  "status": "scheduled",
  "updated_at": "2023-05-21T09:45:00"
}
```

#### Excluir Reunião

```
DELETE /api/meetings/{meeting_id}
```

**Resposta de Sucesso (204 No Content)**

### Transcrições

#### Iniciar Gravação

```
POST /api/meetings/{meeting_id}/recording/start
```

**Resposta de Sucesso (200 OK):**
```json
{
  "meeting_id": 3,
  "recording_id": "rec_123456",
  "status": "recording",
  "started_at": "2023-06-01T13:00:00"
}
```

#### Parar Gravação

```
POST /api/meetings/{meeting_id}/recording/stop
```

**Resposta de Sucesso (200 OK):**
```json
{
  "meeting_id": 3,
  "recording_id": "rec_123456",
  "status": "processing",
  "started_at": "2023-06-01T13:00:00",
  "ended_at": "2023-06-01T14:00:00",
  "duration_seconds": 3600
}
```

#### Obter Transcrição

```
GET /api/meetings/{meeting_id}/transcript
```

**Parâmetros de Consulta:**
- `format` (opcional): Formato da transcrição (json, txt, srt) (padrão: json)

**Resposta de Sucesso (200 OK):**
```json
{
  "meeting_id": 1,
  "title": "Reunião de Planejamento",
  "date": "2023-05-15T14:30:00",
  "duration_minutes": 45,
  "transcript": [
    {
      "speaker": "João Silva",
      "text": "Bom dia a todos, vamos começar nossa reunião de planejamento.",
      "start_time": 0.0,
      "end_time": 4.2
    },
    {
      "speaker": "Maria Souza",
      "text": "Sim, temos vários tópicos para discutir hoje.",
      "start_time": 4.5,
      "end_time": 7.8
    }
  ],
  "sentiment_analysis": {
    "overall": "positive",
    "scores": {
      "positive": 0.65,
      "neutral": 0.30,
      "negative": 0.05
    }
  },
  "keywords": ["planejamento", "roadmap", "trimestre", "metas"]
}
```

### Usuários

#### Obter Perfil do Usuário

```
GET /api/users/me
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "created_at": "2023-01-15T10:30:00"
}
```

#### Atualizar Perfil do Usuário

```
PUT /api/users/me
```

**Corpo da Requisição:**
```json
{
  "name": "Novo Nome",
  "email": "novoemail@exemplo.com"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "email": "novoemail@exemplo.com",
  "name": "Novo Nome",
  "updated_at": "2023-05-22T16:45:00"
}
```

### Integração com RD Station

#### Configurar Integração

```
POST /api/integrations/rdstation
```

**Corpo da Requisição:**
```json
{
  "api_key": "sua_api_key_rdstation",
  "client_id": "seu_client_id",
  "client_secret": "seu_client_secret"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "status": "connected",
  "message": "Integração com RD Station configurada com sucesso"
}
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - A requisição contém parâmetros inválidos |
| 401 | Unauthorized - Autenticação necessária |
| 403 | Forbidden - Sem permissão para acessar o recurso |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito com o estado atual do recurso |
| 422 | Unprocessable Entity - Erro de validação |
| 429 | Too Many Requests - Limite de requisições excedido |
| 500 | Internal Server Error - Erro interno do servidor |

## Limites de Taxa

A API possui os seguintes limites de taxa:

- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário autenticado

Quando o limite é excedido, a API retorna o código de status 429 (Too Many Requests). 