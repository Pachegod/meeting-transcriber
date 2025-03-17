# Guia de Solução de Problemas

Este documento contém soluções para problemas comuns encontrados durante a instalação, configuração e execução do Meeting Transcriber.

## Índice

1. [Problemas de Instalação](#problemas-de-instalação)
2. [Problemas de Conexão](#problemas-de-conexão)
3. [Problemas de Autenticação](#problemas-de-autenticação)
4. [Problemas de Transcrição](#problemas-de-transcrição)
5. [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
6. [Problemas com Redis](#problemas-com-redis)
7. [Problemas com PowerShell](#problemas-com-powershell)

## Problemas de Instalação

### Erro ao instalar dependências Python

**Problema**: Erro ao instalar pacotes como `torch` ou `whisper`.

**Solução**:
1. Verifique se está usando Python 3.9 ou superior:
   ```powershell
   python --version
   ```
2. Atualize o pip:
   ```powershell
   python -m pip install --upgrade pip
   ```
3. Para problemas com PyTorch, tente instalar diretamente do site oficial:
   ```powershell
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

### Erro ao instalar dependências Node.js

**Problema**: Erros durante `npm install` no diretório frontend.

**Solução**:
1. Verifique se está usando Node.js 18 ou superior:
   ```powershell
   node --version
   ```
2. Limpe o cache do npm:
   ```powershell
   npm cache clean --force
   ```
3. Remova a pasta node_modules e reinstale:
   ```powershell
   rm -r node_modules
   rm package-lock.json
   npm install
   ```

## Problemas de Conexão

### "Failed to fetch" no frontend

**Problema**: O frontend exibe erro "Failed to fetch" ao tentar se comunicar com o backend.

**Solução**:
1. Verifique se o servidor backend está rodando na porta 8000:
   ```powershell
   curl http://localhost:8000/api/health
   ```
2. Verifique se a URL da API está configurada corretamente no frontend:
   - Arquivo `.env.local` deve conter `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Verifique se não há bloqueio de CORS:
   - O backend deve permitir requisições do frontend (geralmente já configurado)

### Porta já em uso

**Problema**: Erro "Address already in use" ao iniciar o servidor.

**Solução**:
1. Identifique o processo usando a porta:
   ```powershell
   netstat -ano | findstr :8000  # Para backend
   netstat -ano | findstr :3000  # Para frontend
   ```
2. Encerre o processo:
   ```powershell
   taskkill /PID [número_do_processo] /F
   ```

## Problemas de Autenticação

### Token inválido ou expirado

**Problema**: Mensagens de erro relacionadas a tokens JWT inválidos ou expirados.

**Solução**:
1. Verifique se o `SECRET_KEY` está configurado corretamente no backend
2. Limpe os cookies do navegador e faça login novamente
3. Verifique se o relógio do sistema está sincronizado

## Problemas de Transcrição

### Falha na transcrição de áudio

**Problema**: O sistema não consegue transcrever arquivos de áudio.

**Solução**:
1. Verifique se o modelo Whisper foi baixado corretamente:
   ```powershell
   cd backend
   python -c "import whisper; whisper.load_model('small')"
   ```
2. Verifique o formato do arquivo de áudio (deve ser WAV, MP3, etc.)
3. Verifique se há espaço suficiente em disco para processamento

## Problemas de Banco de Dados

### Erro de conexão com PostgreSQL

**Problema**: O backend não consegue se conectar ao PostgreSQL.

**Solução**:
1. Verifique se o PostgreSQL está rodando:
   ```powershell
   sc query postgresql
   ```
2. Verifique a string de conexão no arquivo `.env` do backend
3. Verifique se o usuário tem permissões adequadas:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE meeting_transcriber TO seu_usuario;
   ```

## Problemas com Redis

### Erro de conexão com Redis

**Problema**: O backend não consegue se conectar ao Redis.

**Solução**:
1. Verifique se o Redis está rodando:
   ```powershell
   sc query redis
   ```
2. Verifique a URL do Redis no arquivo `.env` do backend
3. Se estiver usando WSL, verifique se o Redis está acessível:
   ```powershell
   wsl -d Ubuntu -e redis-cli ping
   ```

## Problemas com PowerShell

### Erro ao ativar ambiente virtual

**Problema**: Erro de execução de scripts ao tentar ativar o ambiente virtual.

**Solução**:
1. Execute o PowerShell como administrador
2. Altere a política de execução temporariamente:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
3. Ative o ambiente virtual:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

### Erro com operador '&&' no PowerShell

**Problema**: Comandos com '&&' não funcionam no PowerShell.

**Solução**:
Use o operador `;` em vez de `&&` ou execute comandos separadamente:
```powershell
cd backend; python run.py
```

Ou use o operador `-and` em um bloco de script:
```powershell
cd backend
if ($?) { python run.py }
``` 