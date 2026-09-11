# Render Cloud Deployment Guide for Ecclesia

This guide covers deploying the Ecclesia Church Management Platform to [Render](https://render.com).

---

## 1. Issue Explanation & Resolution

### Error Encountered
```
File "/opt/render/project/src/backend/app/main.py", line 18, in <module>
    from app.core.metrics import PrometheusMetricsMiddleware, prometheus_metrics_response
File "/opt/render/project/src/backend/app/core/metrics.py", line 8, in <module>
    from prometheus_client import ( ... )
ModuleNotFoundError: No module named 'prometheus_client'
==> No open ports detected, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
```

### Why This Happened
1. **Missing Dependency in Requirements**: `prometheus-client` was instrumented in `backend/app/core/metrics.py` for operational telemetry, but was not included in `backend/requirements.txt` or root `requirements.txt`.
2. **Crash Before Port Binding**: Because the Python import crashed during startup, Uvicorn never reached the socket listen stage. Render's health checker continuously scanned for an open port and reported `No open ports detected`.

### How It Was Fixed
1. Added `prometheus-client>=0.20.0,<1.0` to both [backend/requirements.txt](file:///c:/Users/santh/ecclesia-1/backend/requirements.txt) and root [requirements.txt](file:///c:/Users/santh/ecclesia-1/requirements.txt).
2. Added defensive fallback in [backend/app/core/metrics.py](file:///c:/Users/santh/ecclesia-1/backend/app/core/metrics.py) with dummy metrics classes so that even if `prometheus-client` is unavailable, the application starts gracefully without crashing.
3. Created [render.yaml](file:///c:/Users/santh/ecclesia-1/render.yaml) blueprint with correct build/start commands and dynamic `$PORT` binding.

---

## 2. Recommended Deployment: Render Blueprint (Infrastructure as Code)

Ecclesia provides a turnkey [render.yaml](file:///c:/Users/santh/ecclesia-1/render.yaml) blueprint that provisions:
- **FastAPI Backend Web Service** (Python 3.11, automatic `$PORT` binding, `/health` check)
- **PostgreSQL Database** (Free-tier managed database)
- **React Admin Portal** (High-speed static CDN SPA with SPA redirect rules)

### Steps to Deploy via Blueprint:
1. Push your latest code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log into the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top navigation and select **Blueprint**.
4. Connect your GitHub repository (`ecclesia`).
5. Render will automatically detect `render.yaml` and configure:
   - `ecclesia-backend` (Web Service)
   - `ecclesia-admin-portal` (Static Site)
   - `ecclesia-db` (PostgreSQL)
6. Click **Apply**. Render will build and deploy all services in sync.

---

## 3. Manual Deployment: Web Service Configuration

If you prefer to configure the Web Service manually on Render, use either of the two directory options below:

### Option A: Root Directory Left Blank (Default)
When Root Directory is empty, Render executes commands from the repository root `/opt/render/project/src/`:

| Setting | Value |
|---|---|
| **Name** | `ecclesia-backend` |
| **Language** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Build Command** | `pip install --upgrade pip && pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |

### Option B: Root Directory Set to `backend`
When Root Directory is set to `backend`:

| Setting | Value |
|---|---|
| **Name** | `ecclesia-backend` |
| **Language** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |

---

## 4. Environment Variables on Render

Configure these under the **Environment** tab of your Render Web Service:

| Variable | Recommended Value | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Sets the Python runtime version on Render |
| `ENVIRONMENT` | `production` | Enables production security optimizations |
| `DEBUG` | `false` | Disables debug logs and stack traces |
| `SECRET_KEY` | *(Click "Generate")* | 32+ char secret for JWT signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Session token expiry (24 hours) |
| `DATABASE_URL` | *(Render Postgres URL)* | `postgresql+psycopg://user:password@host/dbname` |
| `CORS_ORIGINS` | `*` or `["https://your-admin.onrender.com"]` | Allowed web origins |

> [!IMPORTANT]
> **Port Binding Rule**: Always specify `--host 0.0.0.0 --port $PORT` in the Start Command.
> Render injects the `$PORT` environment variable dynamically (typically port `10000`). Binding to `127.0.0.1` or hardcoding port `8000` will cause Render's "No open ports detected" error.

---

## 5. Deploying the React Admin Portal on Render

To deploy the frontend as a Static Site:
1. Click **New +** -> **Static Site**.
2. Connect your repo.
3. Configure settings:
   - **Root Directory**: `admin-portal`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Rewrite Rule (under **Redirects/Rewrites**):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-ecclesia-backend.onrender.com/api/v1`
