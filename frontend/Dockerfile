FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Configurar diretório de trabalho
WORKDIR /app

# Etapa de instalação de dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa de build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurar variáveis de ambiente para build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ARG NEXT_PUBLIC_RD_STATION_ENABLED
ENV NEXT_PUBLIC_RD_STATION_ENABLED=${NEXT_PUBLIC_RD_STATION_ENABLED}

# Construir a aplicação
RUN npm run build

# Etapa de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Criar usuário não-root para produção
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para o usuário não-root
USER nextjs

# Expor a porta que a aplicação usa
EXPOSE 3000

# Configurar variáveis de ambiente
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"] 