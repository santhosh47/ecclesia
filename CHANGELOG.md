# Changelog

All notable changes to the Ecclesia Church Management System (ChMS) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2026-09-11

### Added
- **Downloadable Church Calendar & Multi-Calendar Subscriptions**:
  - RFC 5545 compliant iCalendar exporter in `backend/app/core/calendar_export.py` generating full church `.ics` calendar streams.
  - 1-Click Google Calendar subscription integration (`https://calendar.google.com/calendar/r?cid=...`) and single-event calendar generator (`https://calendar.google.com/calendar/render?action=TEMPLATE...`).
  - WebCal live subscription feed (`webcal://...`) for Apple Calendar, Google Calendar, and Outlook syncing.
  - Endpoints: `GET /church-calendar/export.ics`, `GET /church-calendar/feed.ics`, `GET /activities/{id}/google-calendar-url`, `GET /church-calendar/subscription-links`.
  - Admin Portal UI in `ChurchCalendarView.tsx`: "Download .ICS" button, "Sync / Google Calendar" modal with copyable feeds and member share links, and "+ Google Cal" 1-click button on each activity card.
  - Flutter Mobile UI in `events_page.dart`: Calendar sync icon and bottom sheet with 1-click Google Calendar, WebCal feed copy, and `.ics` export options.
  - Unit tests in `backend/tests/test_calendar_export.py` (7/7 passed).
- **Customizable Multi-Channel Alert & Notification Engine for Pastors & Leaders**:
  - Models: `NotificationRule` (customizable rules for absence, pastoral emergencies, threshold values, channels, roles, and message templates) and `InAppNotification` in `backend/app/models/notifications.py`.
  - Service: `AlertService` in `backend/app/services/alert_service.py` evaluating consecutive member attendance absences, replacing dynamic template tokens (`{{member_name}}`, `{{threshold_value}}`, `{{phone}}`), and dispatching across In-App PWA Web Notifications, Email, and WhatsApp.
  - Strict Role Security: Endpoints guarded via `require_role("super_admin", "admin", "pastor")` in `backend/app/api/v1/notifications.py`.
  - Admin Portal UI:
    - Interactive Notification Bell in `Navbar.tsx` with unread badge counter, glassmorphic dropdown drawer, role-restricted active pastoral alerts, evaluate rules trigger, and click-to-navigate action links.
    - Dedicated "Alerts & Notifications" settings management tab in `AlertRulesSettingsView.tsx` with rule creation/editing modals, threshold customization, channel toggles, and manual trigger evaluations.
  - Unit tests in `backend/tests/test_notifications.py` (4/4 passed).
- **Answered Prayers & Praise Testimony Tracker**:
  - Endpoints in `backend/app/api/v1/pastoral.py`: `POST /pastoral/prayers/{id}/answer` (records answer date and praise testimony), `GET /pastoral/prayers/answered` (searchable answered prayers feed), `GET /pastoral/prayers/stats` (total requests, answered count, answer rate %, avg days to breakthrough).
  - Admin Portal UI in `PastoralCareView.tsx`: "Answered Prayers & Testimony Wall" tab featuring celebration statistics KPI cards, category filtering, search input, praise report cards, and "Copy Praise Testimony" sharing.
  - Unit tests in `backend/tests/test_answered_prayers.py` (2/2 passed).
- **Device Web Push (PWA) & Mobile Push Notification Architecture**:
  - Added `DevicePushSubscription` model in `backend/app/models/notifications.py` and Alembic migration `c741e9b28a11_add_device_push_subscriptions.py`.
  - Added endpoints in `backend/app/api/v1/notifications.py`: `GET /notifications/vapid-public-key`, `POST /notifications/push-subscribe`, `POST /notifications/test-push`.
  - Created PWA Service Worker in `admin-portal/public/sw.js` for background push notifications and click-to-navigate handling.
  - Implemented `admin-portal/src/utils/webPush.ts` for browser push permissions, VAPID key conversion, and subscription dispatch.
  - Added interactive "Device & PWA Web Push Alerts" card to `AlertRulesSettingsView.tsx` with live subscription status and test alert triggers.
  - Implemented `PushNotificationService` and `PastoralPushNotification` model in Flutter mobile client (`mobile/lib/services/push_notification_service.dart`) with token registration and live notification streams.
  - Unit tests added in `backend/tests/test_notifications.py` (5/5 passed) and `mobile/test/push_notification_test.dart` (2/2 passed).
- **Production Container Stack (Docker Compose & Nginx)**:
  - Created `docker-compose.yml` for unified development and staging (`docker compose up -d`).
  - Created `docker-compose.prod.yml` with PostgreSQL 16 health checks, application container, and Nginx reverse proxy.
  - Created `nginx/nginx.conf` and root `nginx.conf` with gzip compression, security headers (nosniff, SAMEORIGIN), and WebSocket proxying.
  - Created `.env.production.example` template with PostgreSQL, SMTP, WhatsApp, and VAPID key documentation.
- **GitHub-Friendly Standardization Assets**:
  - MIT License populated in `LICENSE`.
  - Issue templates: `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md`.
  - Pull Request template: `.github/PULL_REQUEST_TEMPLATE.md`.
  - Security policy: `SECURITY.md` with vulnerability disclosure guidelines and timeline.
  - Community Code of Conduct: `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1).
  - Safe, idempotent Alembic migrations in `backend/alembic/versions/`.

## [0.4.0] - 2026-09-11

### Added
- **Step 1: Automated Database Backup & Snapshot Utility**:
  - Implemented `BackupManager` in `backend/app/core/backup.py` providing online, non-blocking ACID-safe SQLite snapshots using `sqlite3.connect().backup()` under live traffic.
  - Automated gzip compression into `ecclesia_backup_YYYYMMDD_HHMMSS.db.gz` reducing disk footprint.
  - Configurable retention pruning policy (default 30 days / max 20 snapshots) preventing unconstrained storage growth.
  - Strict path traversal defense and regex filename validation (`^[a-zA-Z0-9_-]+_\d{8}_\d{6}\.db\.gz$`) guarding against unauthorized filesystem access.
  - Pydantic models in `backend/app/schemas/system.py` (`BackupMetadata`, `BackupListResponse`, `BackupCreateResponse`).
  - System administration API endpoints in `backend/app/api/v1/system.py` (`POST /system/backup`, `GET /system/backups`, `GET /system/backups/{filename}/download`, `DELETE /system/backups/{filename}`) guarded by `require_role("super_admin")`.
  - Automatic audit trail recording (`AuditService`) on all backup generation, download, and deletion events.
  - Comprehensive unit and integration test suite in `backend/tests/test_backup.py` (6/6 tests passing).
- **Step 2: Mobile Client Modernization (`mobile/` - Flutter)**:
  - Refactored monolithic Flutter code into a modern, scalable, feature-based architecture:
    - `mobile/lib/core/config.dart`: Centralized `AppConfig` managing base API URLs, environment defaults, and network timeouts.
    - `mobile/lib/models/member.dart`: Typed domain model with JSON serialization, `copyWith`, `fullName`, and `initials` avatar helpers.
    - `mobile/lib/models/event.dart`: Domain model with date formatting getters (`monthShort`, `dayString`) and JSON serialization.
    - `mobile/lib/services/api_service.dart`: Encapsulated HTTP client service with network error wrapping (`ApiException`) and 10-second timeouts.
    - `mobile/lib/features/members/members_page.dart`: Interactive member directory with instant search filtering, pull-to-refresh, avatar badges, and empty states.
    - `mobile/lib/features/members/widgets/member_sheets.dart`: Modal bottom sheets for adding and updating members with keyboard-aware safe-area padding and delete confirmation dialogs.
    - `mobile/lib/features/events/events_page.dart`: Activity roster with date badge indicators, campus location tags, and event scheduling modal.
    - `mobile/lib/main.dart`: Modernized Material 3 theme (forest green `0xff1b6654`) and bottom navigation bar, with 100% backwards-compatible re-exports.
  - Added unit test suite in `mobile/test/models_test.dart` alongside `mobile/test/widget_test.dart` (7/7 tests passing, 0 flutter analyze warnings).
- **Step 3: OpenAPI / Swagger Interactive Documentation Enhancement**:
  - Enriched FastAPI metadata in `backend/app/main.py` with comprehensive system description, contact metadata, and MIT licensing.
  - Defined detailed OpenAPI tags taxonomy across 20 domain modules (`auth`, `users`, `members`, `ledger`, `compliance`, `system`, `health`, etc.).
  - Configured Swagger UI parameters (`docExpansion: "none"`, `filter: True`, `persistAuthorization: True`, `syntaxHighlight.theme: "monokai"`).
  - Explicitly registered `HTTPBearer` (`BearerAuth`) security scheme and global security requirements, enabling the interactive "Authorize" lock button in Swagger UI for entering JWT bearer tokens.
  - Added automated test suite in `backend/tests/test_openapi_docs.py` validating schema structure, security scheme definitions, `/docs`, and `/redoc` (3/3 tests passing).
- **Step 4: Admin Portal Database Backups & System Maintenance UI**:
  - Created dedicated `BackupsView` component in `admin-portal/src/components/BackupsView.tsx` displaying live database connection health, snapshot catalog count, and total compressed storage footprint.
  - Implemented 1-click on-demand live database snapshot generation with progress spinner and notification toast.
  - Snapshot archive history table with search filtering, size formatting (KB/MB), localized creation timestamps, and Gzip integrity badges.
  - Authenticated browser blob download integration (`api.downloadBackup`) streaming `.db.gz` files securely using bearer authorization headers.
  - Permanent snapshot deletion with confirmation guard and automatic catalog refresh.
  - Integrated "Backups & Snapshots" navigation tab in `admin-portal/src/components/SettingsView.tsx`.
  - Added Playwright E2E Use Case 6 in `admin-portal/e2e/desktop.spec.ts` validating Settings tab navigation, system health indicators, snapshot generation, and download buttons (15/15 tests passing).
- **Step 5: Database Schema Versioning & Migrations with Alembic**:
  - Initialized Alembic database migration environment in `backend/alembic/` and configured `backend/alembic.ini`.
  - Configured `backend/alembic/env.py` to support dynamic database URL resolution (`get_normalized_database_url`) across dev (SQLite) and prod (PostgreSQL), with full model registration via `app.models`.
  - Generated complete baseline schema migration `296f3a7eb6d9_initial_schema.py` representing all 28 tables, primary keys, foreign key cascades, and unique indexes.
  - Added comprehensive automated test suite in `backend/tests/test_alembic_migrations.py` validating upgrade to `head`, table verification, downgrade to `base`, and re-upgrade idempotency.
- **Step 6: Prometheus Operational Telemetry & Observability**:
  - Implemented `PrometheusMetricsMiddleware` and metric collectors in `backend/app/core/metrics.py`.
  - Instrumenting `ecclesia_http_requests_total` (counter by method, endpoint, status code), `ecclesia_http_request_duration_seconds` (latency histogram with 11 buckets), `ecclesia_http_requests_in_progress` (gauge), and SQLAlchemy connection pool gauges (`ecclesia_db_pool_size`, `ecclesia_db_pool_checked_out_connections`, `ecclesia_db_pool_overflow_connections`).
  - Mounted `GET /metrics` returning standard Prometheus exposition format (`generate_latest`, `CONTENT_TYPE_LATEST`), with OpenAPI documentation and SPA fallback bypass.
  - Added automated test suite in `backend/tests/test_metrics.py` (2/2 tests passing).
- **Step 7: Mobile Client Offline Persistence & Caching**:
  - Implemented `OfflineCacheService` in `mobile/lib/services/cache_service.dart` providing dual in-memory and local disk persistence with TTL validation for `Member` and `ChurchEvent` entities.
  - Updated `ApiService` in `mobile/lib/services/api_service.dart` with seamless offline fallback: automatically caching fresh API records and falling back to cached datasets when network is unreachable or timeouts occur.
  - Added comprehensive test suite in `mobile/test/offline_cache_test.dart` validating cache storage, retrieval, clearing, and `ApiService` network error fallback (13/13 mobile tests passing, 0 analyze issues).
- **Step 8: Comprehensive Standard Documentation Suite**:
  - Published `docs/DATABASE_SCHEMA.md` with complete Mermaid ERD, table data dictionaries for all 28 models, Alembic migration guide, and disaster recovery procedures.
  - Published `docs/OBSERVABILITY_GUIDE.md` with Prometheus metric catalog, `prometheus.yml` scrape configuration, Grafana dashboard panels, and alerting rules.
  - Published `docs/MOBILE_ARCHITECTURE.md` documenting Flutter clean layered architecture, offline caching sequence diagrams, and Material 3 design tokens.
  - Updated `docs/API_REFERENCE.md` with standardized error envelope specifications, backup management endpoints, and `/metrics`.
  - Updated `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md` with repository/service patterns, Alembic production guides, and live snapshot automation.
  - Overhauled root `README.md` to open-source standard with executive overview, badges, architecture diagrams, and comprehensive documentation index.

---

## [0.3.0] - 2026-09-11

### Added
- **Phase 1: Safe Foundation & Quality Assurance**:
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) running backend pytest, frontend typecheck/build, and Playwright tests on every push/PR.
  - Python Ruff linter, formatter, and isort configuration in `backend/pyproject.toml`.
  - Frontend ESLint flat configuration in `admin-portal/eslint.config.js` and root `.prettierrc`.
  - React `<ErrorBoundary>` component in `admin-portal/src/components/ErrorBoundary.tsx` wrapping all view components with telemetry logging and fallback recovery.
  - Resilient database health check probe in `backend/app/api/v1/health.py` verifying live database connectivity via `SELECT 1`.
- **Phase 2: Security Hardening & Rate Limiting**:
  - Cryptographically signed JWT tokens (HS256) replacing insecure random strings in `backend/app/core/security.py`.
  - Configurable token expiration (`access_token_expire_minutes`) and secret key via `Settings` in `backend/app/core/config.py`.
  - Sliding-window rate limiter (`SlidingWindowRateLimiter`) in `backend/app/core/rate_limiter.py` protecting `/api/v1/auth/login` against brute force attacks (max 5 failed attempts per 60 seconds per IP, with automatic reset on valid authentication and `Retry-After` header).
  - Standardized authentication dependencies: `get_current_user` and `require_role(...)` enforcing token verification and RBAC roles while preserving transparent development fallback for seamless local developer ergonomics.
  - Secured `/api/v1/users` management endpoints with `require_role("super_admin", "admin")`.
  - Comprehensive security test suite in `backend/tests/test_auth_security.py` covering token creation, expiration, signature tampering, login flow, role enforcement, and rate-limiting triggers (100% passing).
- **Phase 3: Declarative Routing & Server-State Caching**:
  - Upgraded admin portal to declarative client-side URL routing with `react-router-dom`, supporting `/members`, `/finances`, `/attendance`, `/calendar`, `/households`, `/ministries`, `/milestones`, `/pastoral`, `/ledger`, `/compliance`, `/certificates`, `/messaging`, `/settings`.
  - Deep-linking and bookmarkable URLs: direct browser navigation and page refreshes retain the active module without resetting to dashboard.
  - Native browser Back/Forward history navigation enabled across all admin views.
  - Server-state caching and stale-while-revalidate management via `@tanstack/react-query` in `admin-portal/src/api/queries.ts`.
  - Replaced monolithic 9-endpoint waterfall queries with targeted cache invalidation helpers (`invalidateMembers()`, `invalidateFinances()`, `invalidateHouseholds()`, `invalidateMinistries()`, `invalidateEvents()`).
  - Added Playwright E2E Use Case 5 in `admin-portal/e2e/desktop.spec.ts` validating declarative route switching, browser Back button history, deep-linking, and page reload state retention (14/14 tests passing).
- **Phase 4: Service / Repository Layer & Asynchronous Background Tasks**:
  - Introduced clean separation of concerns with generic `BaseRepository` in `backend/app/repositories/base.py`.
  - Created `MemberRepository` in `backend/app/repositories/member_repository.py` encapsulating complex domain queries, eager-loading relations, multi-criteria filtering, and metrics aggregation.
  - Created `MemberService` in `backend/app/services/member_service.py` decoupling business logic, milestone calculations, avatar image file management, and conflict handling.
  - Refactored `backend/app/api/v1/members.py` into a thin, declarative route controller utilizing dependency injection (`Depends(get_member_service)`).
  - Created `MessagingService` in `backend/app/services/messaging_service.py` with FastAPI `BackgroundTasks` support for non-blocking message dispatching and gateway sync.
  - Created dedicated unit test suite in `backend/tests/test_service_repository.py` testing `BaseRepository`, `MemberRepository`, `MemberService`, and `MessagingService` (32/32 tests passing across backend).
- **Phase 5: Production Readiness, Resilient Connection Pooling & Standardized Error Contracts**:
  - Configured resilient database connection pooling (`pool_pre_ping=True`, `pool_recycle=1800`, `pool_size=10`, `max_overflow=20` for server databases) in `backend/app/database/session.py`.
  - Added explicit engine disposal lifecycle (`dispose_engine()`) invoked cleanly on FastAPI lifespan shutdown in `backend/app/main.py`.
  - Standardized error contracts and global exception handlers in `backend/app/core/errors.py` (`StarletteHTTPException`, `RequestValidationError`, unhandled `Exception`) with structured envelopes (`code`, `message`, `status_code`, `details`, `request_id`) while preserving the top-level `"detail"` field for 100% backward compatibility with frontend clients and legacy tests.
  - Comprehensive environment configuration documentation in `backend/.env.example` and `admin-portal/.env.example`.
  - Dedicated production readiness test suite in `backend/tests/test_production_readiness.py` validating 404 envelope format, 422 validation structure, and connection pool disposal/reconnection (36/36 tests passing across backend).
- **Phase 6: Data Integrity, Audit Trail & Activity Logging**:
  - Implemented immutable `AuditLog` persistence model in `backend/app/models/audit_log.py` tracking mutations across timestamp, actor, action, entity type, entity ID, changes summary, and client IP.
  - Implemented `AuditService` in `backend/app/services/audit_service.py` with multi-criteria filtering (action, entity type, keyword search) and pagination.
  - Created administrative query endpoint `GET /api/v1/audit-logs` guarded by RBAC role dependencies.
  - Attached automatic audit hooks on member mutations (create, update, delete) and authentication security events (login success and failure).
  - Integrated full-featured "Audit Trail & Activity Logs" tab in `ComplianceView.tsx` with action badges, real-time search, action filters, and timestamps.
  - Comprehensive unit test suite in `backend/tests/test_audit_logging.py` covering recording, filtering, member triggers, login triggers, and API contracts (41/41 backend tests passing).
- **Playwright End-to-End (E2E) Test Suite**:
  - Desktop testing configuration (`1280x720`) covering full tab routing, navigation, and core workflows.
  - Member creation E2E test verifying UI modal submission, table updates, and direct SQLite backend reflection (`/api/v1/members`).
  - Church activity creation E2E test verifying automated `Event` sync, database linking, and attendance roster handoff.
  - Search, sorting by column header, and filter drawer interaction tests.
  - CSV member export file download validation test.
  - npm test scripts in `admin-portal/package.json`: `test:e2e`, `test:e2e:desktop`, `test:e2e:mobile`.
- **Mobile Viewport & Responsiveness Test Suite**:
  - Dual mobile device presets: modern smartphone (iPhone 13 / 390x844) and compact smartphone (iPhone SE / 375x667).
  - Automated hamburger navigation button visibility and slide-out sidebar toggle tests.
  - Automated 7-view horizontal overflow audit (`scrollWidth <= innerWidth + 2px`) ensuring zero horizontal overflow or clipping.
  - Mobile modal usability tests verifying `AddMemberModal` and `AddActivityModal` fit viewport bounds and remain interactive.
- **Centralized Logging Infrastructure**:
  - Backend structured logging module (`backend/app/core/logging.py`) with rotating file handler (`backend/logs/ecclesia.log`, 10MB max, 5 backups).
  - Asynchronous correlation ID tracking via Python `contextvars` (`request_id_ctx`) and `RequestIdFilter`.
  - FastAPI HTTP logging middleware in `backend/app/main.py` recording method, URL, client IP, processing duration (ms), and response status codes.
  - Frontend structured client logger (`admin-portal/src/utils/logger.ts`) with in-memory ring buffer (200 events) and log levels (`debug`, `info`, `warn`, `error`).
  - Outgoing API request correlation: `admin-portal/src/api/client.ts` automatically attaches `X-Request-ID` and logs network status.
- **Comprehensive Project Documentation**:
  - `docs/ARCHITECTURE.md`: Complete C4 architecture, domain model, Mermaid ER diagram, and cross-module synchronization lifecycle.
  - `docs/DEVELOPMENT.md`: Developer quickstart, local environment setup, Alembic migration workflows, testing guidelines, and coding standards.
  - `docs/API_REFERENCE.md`: Complete REST API specification for all v1 endpoints, schemas, queries, and error formats.
  - `docs/DEPLOYMENT.md`: Multi-stage Docker containerization, PostgreSQL production stack, Nginx reverse proxy with SSL, and automated backup strategy.
  - `CONTRIBUTING.md`: Contributing guide, git branching workflows, conventional commits, and pre-PR checklist.
  - `docs/PLAYWRIGHT_TEST_REPORT.md`: Comprehensive E2E test report, execution metrics, mobile overflow audit results, and reproduction instructions.
  - `docs/CENTRAL_LOGGING_GUIDE.md`: Architecture guide, sequence diagram, configuration reference, and PowerShell operational commands.

### Changed
- Configured project-specific `testMatch` filters in `admin-portal/playwright.config.ts` to cleanly separate desktop and mobile test runners.
- Updated `backend/app/core/config.py` with `log_level` and `log_file` application settings.

---

## [0.2.0] - 2026-09-08

### Added
- **Church Activities & Attendance Integration**:
  - Activity creation option `track_attendance` automatically creates and synchronizes a linked `Event` in the database.
  - Cross-module navigation button on activity cards to jump directly to attendance tracking for that specific event.
  - Enhanced attendance roster with multi-column filtering and instant status toggling.
- **Member Management Enhancements**:
  - Advanced search by first name, last name, email, and phone number.
  - Interactive table column header sorting.
  - Multi-criteria filter drawer supporting membership status and ministry assignments.
  - CSV export for member directories.

---

## [0.1.0] - 2026-08-20

### Added
- Initial project architecture:
  - FastAPI backend with SQLAlchemy ORM and Alembic migrations.
  - React + TypeScript admin portal with Vite.
  - Flutter mobile client scaffold.
  - Core modules: Executive Dashboard, Member Directory, Attendance, Calendar, Giving, Pastoral Care, and System Settings.
