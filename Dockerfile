# ==========================================
# STAGE 1: Builder (All installations & build happen here)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Cache Backend Dependencies (Changes least frequently)
# If backend files don't change, this heavy npm install is entirely skipped
COPY backend/package*.json backend/
RUN npm install --omit=dev --prefix backend

# 2. Cache Frontend Dependencies
# If frontend packages haven't changed, this install step is skipped
COPY frontend/package*.json frontend/
RUN npm install --prefix frontend

# 3. Copy the remaining source files
# This breaks cache for everything below it whenever any code changes
COPY . .

# 4. Build Frontend Assets
# Because frontend code changes often, this runs near the end of the builder stage
RUN npm run build


# ==========================================
# STAGE 2: Production Runtime (Lean & Clean)
# ==========================================
FROM node:22-alpine
RUN apk add --no-cache ripgrep findutils
WORKDIR /app

# Copy root package files needed for 'npm run start'
COPY package*.json ./

# Copy everything pre-built/pre-installed from the builder stage
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production

# Runs npm run start directly as PID 1 without an implicit shell wrapper
ENTRYPOINT ["npm", "run", "start"]
