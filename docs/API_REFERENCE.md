# Ecclesia REST API Reference

**Base URL**: `http://localhost:8000/api/v1` (or `https://api.yourchurch.org/api/v1`)  
**Specification**: OpenAPI 3.0 / JSON  
**Authentication**: Bearer Token via HTTP `Authorization: Bearer <access_token>`

---

## 1. Global Conventions & Standards

### Request Headers
- `Content-Type: application/json` (or `multipart/form-data` for file uploads)
- `Authorization: Bearer <JWT_TOKEN>` (for all protected routes)
- `X-Request-ID: req_<id>` (optional from client; auto-generated if omitted)

### Response Headers
- `X-Request-ID: req_<id>`: Correlation ID attached to every HTTP response for distributed telemetry.

### Error Response Schema
All error responses adhere to standard HTTP status codes with structured JSON bodies providing both legacy compatibility (`detail`) and enterprise envelopes (`error`):
```json
{
  "detail": "Descriptive human-readable error explanation",
  "error": {
    "code": "NOT_FOUND",
    "status_code": 404,
    "message": "Descriptive human-readable error explanation",
    "timestamp": "2026-09-11T12:00:00Z",
    "request_id": "req_a1b2c3d4"
  }
}
```

---

## 2. Authentication & User Management

### `POST /auth/login`
Authenticates user credentials and returns a signed JSON Web Token (JWT).
- **Body (`application/x-www-form-urlencoded` or JSON)**:
  - `username` (string, required): Member email or admin handle
  - `password` (string, required): Plaintext password
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "c3a4f61e-...",
      "email": "pastor@ecclesia.org",
      "role": "Admin",
      "full_name": "Pastor David"
    }
  }
  ```

### `GET /auth/me`
Retrieves identity and permissions for the currently authenticated bearer token.
- **Response (200 OK)**: User object with active roles and permissions.

### `GET /users`
Lists all administrative users (requires `Admin` role).

---

## 3. Member Directory & Profiles

### `GET /members`
Lists church members with multi-criteria filtering, full-text searching, and column sorting.
- **Query Parameters**:
  - `search` (string, optional): Search keyword against `first_name`, `last_name`, `email`, `phone`
  - `status` (string, optional): `Active`, `Inactive`, `Under Pastoral Care`, `Deceased`
  - `member_type` (string, optional): `Member`, `Visitor`, `Regular Attender`, `Staff`, `Clergy`
  - `gender` (string, optional): `Male`, `Female`, `Other`
  - `marital_status` (string, optional): `Single`, `Married`, `Widowed`, `Divorced`
  - `sort_by` (string, optional): `first_name`, `last_name`, `status`, `joined_date`, `date_of_birth` (Default: `last_name`)
  - `sort_order` (string, optional): `asc` or `desc` (Default: `asc`)
  - `limit` (integer, default: 50, max: 200)
  - `offset` (integer, default: 0)
- **Response (200 OK)**: Array of Member objects.

### `POST /members`
Creates a new church member record.
- **Body (JSON)**:
  ```json
  {
    "first_name": "Eleanor",
    "last_name": "Vance",
    "email": "eleanor.vance@example.org",
    "phone": "+1-555-0144",
    "status": "Active",
    "member_type": "Member",
    "gender": "Female",
    "marital_status": "Single",
    "date_of_birth": "1994-06-12",
    "joined_date": "2024-01-15",
    "household_id": null
  }
  ```
- **Response (201 Created)**: Created Member object with assigned `id` (UUID).

### `POST /members/upload-avatar`
Uploads a member avatar image before record creation.
- **Body (`multipart/form-data`)**: `file` (JPEG, PNG, WebP; max 5MB)
- **Response (200 OK)**:
  ```json
  {
    "avatar_url": "/uploads/avatars/avatar_3b5630ffe42143b4b6dbab0813c9e7ed.png",
    "filename": "avatar_3b5630ffe42143b4b6dbab0813c9e7ed.png"
  }
  ```

### `POST /members/{id}/avatar`
Updates the profile photo of an existing member, unlinking the previous physical file.

### `DELETE /members/{id}/avatar`
Removes the avatar and unlinks the file from storage.

### `GET /members/csv/export`
Generates and streams a CSV download of member records matching current filter queries.

---

## 4. Church Calendar & Activities

### `GET /church-calendar/activities`
Retrieves scheduled church activities.
- **Query Parameters**:
  - `category` (string, optional): `Worship`, `Fellowship`, `Discipleship`, `Outreach`, `Committee`
  - `start_date` (ISO date, optional)
  - `end_date` (ISO date, optional)
- **Response (200 OK)**: Array of ChurchActivity objects.

### `POST /church-calendar/activities`
Schedules a new church activity.
- **Body (JSON)**:
  ```json
  {
    "title": "Sunday Morning Eucharistic Celebration",
    "activity_type": "Worship Service",
    "category": "Worship",
    "start_datetime": "2026-09-13T10:00:00Z",
    "end_datetime": "2026-09-13T11:30:00Z",
    "location": "Main Sanctuary & Nave",
    "description": "Weekly service with Communion",
    "track_attendance": true
  }
  ```
  *Note*: Setting `track_attendance: true` automatically creates a linked `Event` row in the database.
- **Response (201 Created)**: Created ChurchActivity object containing `event_id`.

### `PATCH /church-calendar/activities/{activity_id}`
Updates activity details and automatically synchronizes updates to the linked check-in event.

### `DELETE /church-calendar/activities/{activity_id}`
Deletes an activity and cleans up unneeded check-in event references.

---

## 5. Attendance & Event Check-In

### `GET /attendance`
Lists attendance check-in records.
- **Query Parameters**:
  - `event_id` (UUID, optional): Filter by event
  - `member_id` (UUID, optional): Filter by member
  - `date_from`, `date_to` (ISO dates, optional)

### `POST /attendance/check-in`
Checks a member into an event.
- **Body (JSON)**:
  ```json
  {
    "event_id": "99b0fcb8-...",
    "member_id": "c3a4f61e-...",
    "status": "Present"
  }
  ```
- **Response (201 Created)**: Attendance record with `check_in_time`.

### `GET /attendance/events/{event_id}/summary`
Calculates total attendance for an event using the standardized formula:
$$\text{Total} = \max(\text{adults} + \text{children}, \text{checked\_in\_roster}) + \text{online}$$
- **Response (200 OK)**:
  ```json
  {
    "event_id": "99b0fcb8-...",
    "headcount_adults": 140,
    "headcount_children": 35,
    "headcount_online": 42,
    "roster_checked_in_count": 168,
    "total_calculated_attendance": 217
  }
  ```

---

## 6. Finances & General Ledger

### `POST /finances/contributions`
Records a member tithe, offering, or pledge payment.
- **Body (JSON)**:
  ```json
  {
    "member_id": "c3a4f61e-...",
    "amount": 250.00,
    "fund_type": "Tithe & General Ministry",
    "payment_method": "ACH / Bank Transfer",
    "received_date": "2026-09-10T14:30:00Z",
    "notes": "Weekly Tithe"
  }
  ```

### `GET /ledger/trial-balance`
Generates real-time debits and credits verification across all asset, liability, equity, income, and expense accounts.

### `GET /ledger/income-statement`
Generates Church Statement of Financial Activities (Revenues vs. Expenditures).

---

## 7. Localization & Church Settings

### `GET /localization/config`
Retrieves active church profile, denomination mode, enabled modules, and role hierarchy from the database.

### `POST /localization/church-profile`
Updates the church name, address, pastor, and contact metadata. Persists to the `church_settings` database table.

### `POST /localization/toggle-mode`
Switches active operational profile (e.g., `contemporary_baptist`, `liturgical_anglican`, `traditional_presbyterian`, `catholic_parish`). Automatically updates terminology badges and calendar liturgical templates.

---

## 8. Health & System Diagnostics

### `GET /health`
Liveness and readiness probe for container orchestrators (Kubernetes, Docker Swarm, Cloud Run).
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-09-11T12:35:00Z"
  }
  ```

---

## 9. Database Backups & System Administration

Protected endpoints requiring `super_admin` role.

### `POST /system/backup`
Creates an immediate, live ACID-safe database snapshot with gzip compression.
- **Response (200 OK)**:
  ```json
  {
    "filename": "ecclesia_backup_20260911_120000.db.gz",
    "size_bytes": 125840,
    "created_at": "2026-09-11T12:00:00Z",
    "status": "success",
    "message": "Database backup created and compressed successfully."
  }
  ```

### `GET /system/backups`
Lists all available snapshots stored in `backend/backups/`.
- **Response (200 OK)**:
  ```json
  {
    "backups": [
      {
        "filename": "ecclesia_backup_20260911_120000.db.gz",
        "size_bytes": 125840,
        "created_at": "2026-09-11T12:00:00Z",
        "status": "success"
      }
    ],
    "total_count": 1,
    "total_size_bytes": 125840
  }
  ```

### `GET /system/backups/{filename}/download`
Streams the gzipped database snapshot file for download (`application/gzip`).

### `DELETE /system/backups/{filename}`
Deletes an existing snapshot file and records an immutable audit log entry.

---

## 10. Operational Observability & Prometheus Metrics

### `GET /metrics`
Exposes live operational metrics formatted in standard Prometheus exposition text (`text/plain; version=0.0.4`).
- **Response (200 OK)**:
  ```text
  # HELP ecclesia_http_requests_total Total count of HTTP requests processed by Ecclesia API
  # TYPE ecclesia_http_requests_total counter
  ecclesia_http_requests_total{endpoint="/api/v1/health",method="GET",status_code="200"} 12.0
  # HELP ecclesia_http_request_duration_seconds HTTP request execution latency distribution in seconds
  # TYPE ecclesia_http_request_duration_seconds histogram
  ecclesia_http_request_duration_seconds_bucket{endpoint="/api/v1/health",le="0.01",method="GET"} 10.0
  # HELP ecclesia_db_pool_size Configured maximum capacity of SQLAlchemy database connection pool
  # TYPE ecclesia_db_pool_size gauge
  ecclesia_db_pool_size 10.0
  ```

