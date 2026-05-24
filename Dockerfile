# Dockerfile otimizado para o ambiente de desenvolvimento do Next.js
FROM node:22-alpine AS base

# Instalar dependências necessárias para bibliotecas do Node (compilações nativas)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Aproveitar o cache de camadas do Docker copiando os arquivos de dependências primeiro
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* bun.lockb* ./

# Instalar dependências de acordo com o gerenciador de pacotes detectado
RUN \
  if [ -f package-lock.json ]; then npm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  elif [ -f bun.lockb ]; then corepack enable bun && bun install; \
  else echo "Nenhum lockfile encontrado. Instalando com npm..." && npm install; \
  fi

# Copiar os demais arquivos do projeto
COPY . .

# Desabilitar a telemetria do Next.js em ambiente de desenvolvimento
ENV NEXT_TELEMETRY_DISABLED=1

# Expor a porta que o Next.js utiliza por padrão
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Executa em modo de desenvolvimento com hot-reloading ativo
CMD ["npm", "run", "dev"]
