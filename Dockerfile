# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args become env vars at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ZITADEL_AUTHORITY
ARG NEXT_PUBLIC_ZITADEL_CLIENT_ID
ARG NEXT_PUBLIC_APP_URL

RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5173

CMD ["npm", "start"]