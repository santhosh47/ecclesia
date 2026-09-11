# Ecclesia Developer & Contribution Guide

**Product**: Ecclesia Church Management System (ChMS)  
**Target Environment**: Windows, Linux, macOS  
**Default Ports**: Backend `8000`, Frontend `5173`

---

## 1. Prerequisites & Environment Setup

Ensure the following runtimes are installed on your workstation:
- **Python**: `3.11+` (with `pip` and `venv`)
- **Node.js**: `18.0.0+` (Node 20 or 22 LTS recommended)
- **Package Manager**: `npm 9+`
- **Git**: `2.35+`
- **Optional**: Flutter 3.19+ (if working on the mobile client)

---

## 2. Repository Layout

```
ecclesia/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # Modular API Route Controllers
│   │   ├── core/            # Config, Security, Centralized Logging
│   │   ├── database/        # Database Session, Base, Seed Scripts
│   │   ├── models/          # SQLAlchemy Declarative Models
│   │   ├── schemas/         # Pydantic Request/Response Schemas
│   │   └── services/        # Reusable Business Logic Services
│   ├── alembic/             # Database Migration Scripts
│   ├── logs/                # Rotating Central Log Files (ecclesia.log)
│   ├── tests/               # Pytest Suite
│   ├── requirements.txt     # Python Dependencies
│   └── alembic.ini          # Migration Configuration
├── admin-portal/             # React 19 + TypeScript Admin App
│   ├── src/
│   │   ├── api/             # API Client & Request Interceptors
│   │   ├── components/      # UI Views & Specialized Sub-Views
│   │   │   └── Modals/      # Modal Forms (Add Member, Check-in, etc.)
│   │   ├── context/         # Auth, Localization & Navigation Contexts
│   │   ├── types/           # TypeScript Data Transfer Interfaces
│   │   ├── utils/           # Structured Client Logger & Helpers
│   │   ├── styles.css       # Core Design System & Tokens
│   │   └── App.tsx          # Master State & Tab Router
│   ├── e2e/                 # Playwright Desktop & Mobile E2E Specs
│   ├── playwright.config.ts # Playwright Runner Configuration
│   ├── package.json         # Scripts and NPM Dependencies
│   └── vite.config.ts       # Vite Bundler Setup
├── docs/                     # Architectural, API & Operational Docs
├── mobile/                   # Flutter Mobile Client Scaffold
├── Dockerfile                # Multi-stage Containerization
└── CHANGELOG.md              # Historical Project Changes
```

---

## 3. Local Development Quickstart

### Step 1: Clone Repository
```bash
git clone https://github.com/santhosh47/ecclesia.git
cd ecclesia
```

### Step 2: Backend Setup

#### On Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### On Linux / macOS (Bash):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Run Database Migrations & Initial Seed:
```powershell
# Run Alembic migrations
alembic upgrade head

# Start backend dev server with live auto-reload
uvicorn app.main:app --reload --port 8000
```
- API Endpoint: `http://localhost:8000`
- Interactive OpenAPI Docs (Swagger): `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup

Open a new terminal window:

```powershell
cd admin-portal
npm install
npm run dev
```
- Admin Portal UI: `http://localhost:5173`

---

## 4. Database Management & Migrations

Ecclesia uses **SQLAlchemy 2.0** models and **Alembic** migrations.

### SQLite (Local Development)
By default, the backend connects to an embedded SQLite database at:
```
backend/ecclesia.db
```

### Creating New Database Migrations
When adding or modifying models in `backend/app/models/`:

```powershell
cd backend

# Auto-generate migration revision script
alembic revision --autogenerate -m "add baptism fields to members"

# Review the generated file in backend/alembic/versions/

# Apply migration to database
alembic upgrade head
```

### Rolling Back Migrations
```powershell
# Rollback one migration step
alembic downgrade -1

# Rollback to base
alembic downgrade base
```

### Seeding Initial Sample Data
To reset or re-seed the test database:
```powershell
# Call internal seed endpoint
curl -X POST http://localhost:8000/api/v1/seed/chms-demo
```
This provisions sample church profiles, members, households, activities, attendance records, contributions, and general ledger accounts.

---

## 5. Automated Testing Guidelines

Ecclesia maintains a dual-layer testing strategy: backend unit/integration tests with `pytest`, and end-to-end browser tests with `Playwright`.

### A. Backend Unit & Integration Tests (`pytest`)
From the `backend` directory:
```powershell
cd backend

# Run all tests
pytest tests

# Run specific test file
pytest tests/test_enhanced_features.py -v

# Run with verbose output and print statements
pytest -s -vv
```

### B. Frontend Production Bundle Check
Before committing frontend code, verify TypeScript compilation and bundling:
```powershell
cd admin-portal
npm run build
```

### C. Playwright End-to-End & Mobile Tests
Playwright tests are executed against the running local servers (`http://localhost:8000` and `http://localhost:5173`).

```powershell
cd admin-portal

# 1. Run all 13 E2E tests (Desktop Chrome, iPhone 13, iPhone SE)
npm run test:e2e

# 2. Run Desktop tests only (1280x720)
npm run test:e2e:desktop

# 3. Run Mobile tests only (390x844 & 375x667)
npm run test:e2e:mobile

# 4. Open Playwright interactive UI test runner (debugger)
npx playwright test --ui

# 5. Open generated HTML test report
npx playwright show-report playwright-report
```

---

## 6. Central Logging & Debugging in Development

Ecclesia provides request tracing via `X-Request-ID` across both frontend and backend.

### Inspecting Backend Logs
Backend logs are automatically appended to:
```
backend/logs/ecclesia.log
```

#### Stream logs in real-time (PowerShell):
```powershell
Get-Content -Path backend/logs/ecclesia.log -Wait -Tail 50
```

#### Search logs by Correlation ID:
```powershell
Select-String -Path backend/logs/ecclesia.log -Pattern "req_b678c2e9b08f"
```

#### Filter errors only:
```powershell
Select-String -Path backend/logs/ecclesia.log -Pattern "\[ERROR\]"
```

### Inspecting Frontend Logs
The frontend logger maintains a circular in-memory buffer of client-side events:
1. Open Chrome DevTools (`F12`).
2. Type in the Console:
   ```javascript
   // All recent client telemetry
   window.logger?.getRecentLogs();
   ```

---

## 7. Coding Standards & Conventions

### Python / FastAPI
- Follow **PEP 8** style guidelines.
- Always annotate function arguments and return types.
- Database access MUST occur through FastAPI's `db: Session = Depends(get_db)` dependency injection.
- Validate incoming payloads using dedicated Pydantic schemas in `backend/app/schemas/`.
- Never execute raw SQL with string concatenation; use SQLAlchemy ORM or parameterized queries.

### TypeScript / React
- Enable strict typing; avoid `any`. Define data models in `admin-portal/src/types/`.
- Keep components modular. If a modal or view exceeds 300 lines, extract reusable sub-components.
- Style components using the design tokens in `admin-portal/src/styles.css` (`var(--primary)`, `var(--card-bg)`, `var(--border-color)`).
- Ensure all interactive elements have descriptive IDs or test attributes for accessibility and automated testing.
- Verify mobile responsiveness (check for horizontal overflow with `@media (max-width: 768px)`).
