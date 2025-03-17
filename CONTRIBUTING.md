# Guia de Contribuição

Obrigado pelo interesse em contribuir com o Meeting Transcriber! Este documento fornece diretrizes para contribuir com o projeto.

## Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Configuração do Ambiente de Desenvolvimento](#configuração-do-ambiente-de-desenvolvimento)
4. [Processo de Pull Request](#processo-de-pull-request)
5. [Padrões de Código](#padrões-de-código)
6. [Testes](#testes)
7. [Documentação](#documentação)

## Código de Conduta

Este projeto segue um Código de Conduta que todos os participantes devem respeitar. Por favor, leia [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) antes de contribuir.

## Como Contribuir

Existem várias maneiras de contribuir com o projeto:

1. **Reportar bugs**: Abra uma issue descrevendo o bug, como reproduzi-lo e qual o comportamento esperado.
2. **Sugerir melhorias**: Abra uma issue descrevendo sua ideia de melhoria.
3. **Implementar funcionalidades**: Escolha uma issue existente ou crie uma nova para discutir a funcionalidade antes de começar a implementação.
4. **Melhorar a documentação**: Ajude a melhorar a documentação existente ou crie novos guias.

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

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
   pip install -r requirements-dev.txt  # Dependências de desenvolvimento
   ```

3. Configure as variáveis de ambiente:
   ```powershell
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Execute os testes:
   ```powershell
   pytest
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

3. Execute os testes:
   ```powershell
   npm test
   ```

## Processo de Pull Request

1. **Crie uma branch**: Crie uma branch a partir de `develop` com um nome descritivo:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nome-da-funcionalidade
   ```

2. **Faça suas alterações**: Implemente suas alterações seguindo os padrões de código do projeto.

3. **Teste suas alterações**: Certifique-se de que seus testes passam e que não há regressões.

4. **Commit suas alterações**: Use mensagens de commit claras e descritivas seguindo o padrão Conventional Commits:
   ```bash
   git commit -m "feat: adiciona funcionalidade X"
   git commit -m "fix: corrige problema Y"
   git commit -m "docs: atualiza documentação Z"
   ```

5. **Push para o repositório**:
   ```bash
   git push origin feature/nome-da-funcionalidade
   ```

6. **Abra um Pull Request**: Abra um PR para a branch `develop` e preencha o template com as informações necessárias.

7. **Revisão de código**: Aguarde a revisão do seu código. Faça as alterações solicitadas, se necessário.

8. **Merge**: Após a aprovação, seu PR será mesclado à branch `develop`.

## Padrões de Código

### Backend (Python)

- Siga o [PEP 8](https://www.python.org/dev/peps/pep-0008/) para estilo de código
- Use [Black](https://github.com/psf/black) para formatação automática
- Use [Flake8](https://flake8.pycqa.org/) para linting
- Escreva docstrings para todas as funções, classes e módulos

### Frontend (JavaScript/TypeScript)

- Siga o [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint e Prettier para formatação e linting
- Use TypeScript para tipagem estática
- Escreva JSDoc para todas as funções e componentes

## Testes

### Backend

- Escreva testes unitários usando pytest
- Mantenha a cobertura de código acima de 80%
- Execute `pytest` antes de enviar um PR

### Frontend

- Escreva testes unitários usando Jest
- Escreva testes de componentes usando React Testing Library
- Execute `npm test` antes de enviar um PR

## Documentação

- Mantenha a documentação atualizada com suas alterações
- Documente novas funcionalidades em `docs/`
- Atualize o README.md quando necessário
- Adicione comentários claros em código complexo

---

Agradecemos suas contribuições para tornar o Meeting Transcriber melhor para todos! 