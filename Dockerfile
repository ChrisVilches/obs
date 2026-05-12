FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm install && npm run install-all
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY --from=builder /app/package*.json /app/
ENV NODE_ENV=production
RUN npm install --omit=dev --prefix backend
CMD ["node", "backend/src/server.js"]
