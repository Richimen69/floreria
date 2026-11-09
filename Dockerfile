FROM node:24-alpine AS base

# Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Compilación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js necesita estos valores al compilar
ARG DATABASE_URL
ARG R2_PUBLIC_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run copiar-worker-mapa && npm run build

# Imagen para migraciones, seed y crear admin (tiene el código completo y drizzle-kit)
FROM builder AS migrador
CMD ["npx", "drizzle-kit", "migrate"]

# Imagen final, ligera
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]