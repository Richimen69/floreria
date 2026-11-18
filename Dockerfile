FROM node:24-alpine AS base

# Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Código fuente con dependencias, sin compilar
FROM base AS fuente
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Migraciones, seed y crear admin
FROM fuente AS migrador
CMD ["npx", "drizzle-kit", "migrate"]

# Compilación (la base ya debe tener las tablas)
FROM fuente AS builder
ARG DATABASE_URL
ARG R2_PUBLIC_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run copiar-worker-mapa && npm run build

# Imagen final
FROM base AS runner
WORKDIR /app
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]