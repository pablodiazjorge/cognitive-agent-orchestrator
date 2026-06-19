# Frontend build stage — Node.js 20.18.0 LTS
FROM node:20.18.0-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npx ng build --configuration production

# Frontend runtime stage — nginx stable Alpine
FROM nginx:1.26-alpine

COPY --from=builder /app/dist/agent-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
