# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/admin-portal

COPY admin-portal/package*.json ./
RUN npm ci

COPY admin-portal/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Backend & SPA
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source and compiled frontend distribution
COPY backend/ ./backend/
COPY --from=frontend-builder /app/admin-portal/dist ./admin-portal/dist

WORKDIR /app/backend

ENV ENVIRONMENT=production
ENV DEBUG=false
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
