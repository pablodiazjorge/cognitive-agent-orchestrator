# Backend build stage — Node.js 20.18.0 LTS
FROM node:20.18.0-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Backend runtime stage — Node.js 20.18.0 LTS
FROM node:20.18.0-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
ENV LLM_PROVIDER=simulated

EXPOSE 3000

CMD ["node", "dist/index.js"]
