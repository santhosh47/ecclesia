# Ecclesia Enterprise Church Management System (ChMS)
## Comprehensive Administrator, Setup & User Operations Manual

Welcome to **Ecclesia ChMS** — an enterprise-grade, modular Church Management and Accounting System tailored for modern churches, ecumenical dioceses, and religious charities.

---

## 1. System Architecture & Tech Stack

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Ecclesia Admin Portal              │
                                  │   (React 19 + TypeScript + Vite + PWA)      │
                                  │      Responsive Web & Mobile Browser         │
                                  └──────────────────────┬───────────────────────┘
                                                         │ RESTful JSON APIs / HTTP
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │             FastAPI Backend (v1)             │
                                  │           (Python 3.11+ / Uvicorn)           │
                                  ├──────────────────────────────────────────────┤
                                  │  • RBAC & Fine-Grained Module Toggles        │
                                  │  • Pure Python Dynamic PDF Stream Engine     │
                                  │  • Balanced Double-Entry Bookkeeping Core    │
                                  │  • India & Global Localization Engine        │
                                  └──────────────────────┬───────────────────────┘
                                                         │ SQLAlchemy ORM
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │         Relational SQL Database              │
                                  │   (SQLite for Dev / PostgreSQL for Prod)     │
                                  └──────────────────────────────────────────────┘
```

- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Pytest.
- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla CSS Design System.
- **Reporting & PDFs**: Built-in pure-Python vector PDF binary generator (zero heavy binary C-dependencies).
- **Localization**: Instant switcher between **🇮🇳 India Mode** (80G, Form 10BD, FCRA, UPI, TRAI DLT) and **🌐 Global Mode** (501(c)(3), UK Gift Aid, Stripe, Twilio 10DLC, GDPR).

---

## 2. Quickstart & Installation Guide

### Prerequisites
- **Python**: Version 3.11 or higher
- **Node.js**: Version 18.x, 20.x, or higher
- **Git**: Latest version

### Step 1: Backend Setup
Open a terminal in the project directory:
```bash
cd backend

# 1. Activate Python virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development API server
uvicorn app.main:app --reload --port 8000
```
The backend API will be live at `http://localhost:8000`.
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Technical Reference**: `http://localhost:8000/redoc`

### Step 2: Frontend Setup
Open a second terminal:
```bash
cd admin-portal

# 1. Install frontend packages
npm install

# 2. Start Vite development server
npm run dev
```
The Admin Portal will be available at `http://localhost:5173`.

---

## 3. Accessing the Application

| Client Form Factor | Access URL | Features |
| :--- | :--- | :--- |
| **Desktop Web Browser** | `http://localhost:5173` | Full dashboard, multi-window modals, split ledger views, CSV upload. |
| **Mobile Smartphone** | `http://<your-ip>:5173` | Responsive mobile drawer, touch-friendly action cards, mobile check-in. |
| **PWA Home Screen App** | Open in Mobile Chrome / Safari -> Tap **"Add to Home Screen"** | Fullscreen standalone app experience with offline shell. |

---

## 4. Comprehensive Feature & Module Guide

### Core System (Always Active)
1. **Member Directory & Family Groupings**:
   - Track full profile: Title, DOB, anniversary, baptism/confirmation dates, emergency contacts, PAN/Tax IDs, occupations, parish wards, and notes.
   - Household management: Group family members under a single household head, with auto-synced address and landmark directions.
   - Milestone Auto-Alerts: Automatic banners and dashboard alerts for birthdays and wedding anniversaries occurring within 7, 14, or 30 days.
2. **Executive Dashboard**:
   - Real-time KPI summary: Active membership count, YTD giving, YTD expenses, net operating balance, average Sunday attendance, absentee alerts, active prayer requests.
3. **Church Profile & Branding Customization**:
   - Edit Church Name, Senior Pastor, Denomination, Address, Email, Phone, Tax Registration ID, and Currency directly from **Settings -> Church Profile**.
   - Changes immediately reflect across the navigation header, certificates, tax receipts, and reports.

---

### Toggleable Modules

#### 1. User-Friendly Double-Entry Ledger (`double_entry_ledger`)
- **Smart Transaction Wizard**:
  - Non-accountants can record **Income ("Money In")** or **Expenses ("Money Out")** with intuitive dropdowns. The system automatically creates the balancing debit and credit legs under the hood!
- **Advanced Mode**:
  - Full multi-line journal entry builder with live debit/credit balancing verification for professional accountants.
- **Chart of Accounts (COA)**:
  - Standardized 5-digit structure (1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue, 5000s Expenses) with designated FCRA foreign flag.
- **Real-Time Trial Balance Sheet**:
  - 1-click verification verifying that Total Debits strictly equal Total Credits.

#### 2. Staff Payroll & Salaries (`payroll_staff_ledger`)
- Maintain clergy and administrative staff records with PAN/Tax IDs, base monthly salary, housing allowance, and travel allowances.
- Generate monthly payslip disbursements with deductions and reference numbers.

#### 3. Church Activities & Events Calendar (`church_activities_calendar`)
- Scheduled church activities: Sunday Worship, Midweek Bible Study, Choir Practice, Committee/Elder Meetings, Youth Gatherings, Community Health Camps, and Spiritual Retreats.
- Filter activities by category (Worship, Bible Study, Outreach, Meeting) or frequency (Weekly Regulars, Monthly, Special Events).

#### 4. Giving, Contributions & Pledges (`giving_and_pledges`)
- Record tithes, offerings, building fund contributions via Cash, Cheque, UPI, Razorpay, Bank Transfer, or Stripe.
- Capital Campaign tracker: Set fundraising goals, log pledges, and monitor percentage fulfillment.

#### 5. Milestone Certificates & Dynamic PDF Engine (`pdf_certificates`)
- Issue milestone certificates: Baptism, Holy Matrimony, Child Dedication, Confirmation, and Church Membership.
- Built-in PDF generator renders gold ornate borders, scripture verse, officiant signature line, and a unique verification code.
- Public online verification lookup at `/api/v1/certificates/verify/{code}`.

#### 6. Mass Messaging & WhatsApp (`mass_messaging`)
- **WhatsApp Integration**: Send personalized broadcast messages (`{{first_name}}`) to active members, choir, or heads of households.
- **TRAI DLT Compliance (India)**: Pre-configured fields for DLT Entity ID, Header (`ECCLSA`), and Template ID.
- **Twilio 10DLC & GDPR (Global)**: Opt-out footer links and carrier-compliant routing.

#### 7. Tax Compliance (80G, Form 10BD, FCRA, 501(c)(3), UK Gift Aid) (`tax_compliance`)
- **India Section 80G Receipts**: Official tax exemption receipts with donor PAN and registration numbers.
- **Income Tax Form 10BD Export**: Formatted donor schedule ready for annual e-filing with the Income Tax department.
- **FCRA Inward Remittances**: Foreign contribution register with FIRC reference numbers for MHA Form FC-4.
- **US 501(c)(3) & UK Gift Aid**: Contribution statements and HMRC 25% tax reclaim schedule.

#### 8. Attendance & Live Check-in (`attendance_checkin`)
- Track Sunday service and weekly meeting attendance.
- **Automated Absentee Detection**: Identifies congregation members absent for 3 or more consecutive weeks to initiate pastoral care.

#### 9. Pastoral Care & Prayer Requests (`pastoral_care`)
- Confidential pastoral counseling notes and hospital visit logs with follow-up reminders.
- Prayer request board categorized by Healing, Family, Guidance, and Praise Reports (with "Answered" celebration status).

#### 10. CSV Migration Tool (`csv_migration`)
- One-click import tool supporting ChurchCRM, church-cms, and custom Excel exports.
- Use the included sample template [`sample_church_members_import.csv`](file:///c:/Users/santh/ecclesia-1/sample_church_members_import.csv).

---

## 5. Role-Based Access Control (RBAC)

Ecclesia features granular role-based security:

| Role | Default Permissions | Intended User |
| :--- | :--- | :--- |
| **Super Admin** | Unrestricted access to all modules, settings, and roles | Senior Pastor / Head IT Administrator |
| **Pastor / Clergy** | Members, Pastoral Notes, Attendance, Calendar, Certificates, Messaging, View Finances | Associate Pastors & Clergy |
| **Elder / Board** | Members, Pastoral Notes, Attendance, Church Calendar | Church Council, Elders, Deacons |
| **Treasurer** | Double-entry Ledger, Giving, Payroll, 80G/FCRA Compliance, Member Directory | Church Treasurer & Staff Accountant |
| **Sub-Admin** | Members, Attendance, Calendar, Messaging, Certificates | Church Office Secretary |
| **Ministry Leader**| Church Calendar, Attendance, Ministry Roster | Worship Leader, Youth Director |

> [!TIP]
> Administrators can create unlimited **Custom Roles** (e.g. *"Audit Committee"*, *"Outreach Coordinator"*) and toggle individual permissions on/off in **Settings -> Roles & Permissions**.

---

## 6. Sample CSV Migration Data

A sample migration CSV is included at the workspace root: [`sample_church_members_import.csv`](file:///c:/Users/santh/ecclesia-1/sample_church_members_import.csv).

**Expected Header Format**:
```csv
First Name,Last Name,Title,Email,Phone,Gender,Status,Member Type,Household Name,Household Role,Marital Status,Occupation,PAN Number,Date of Birth,Wedding Anniversary,Baptism Date,Address,City,State,Postal Code,Language Preference
```

---

## 7. Production Deployment & Security Recommendations

1. **Environment Variables**:
   Set `DATABASE_URL` to a production PostgreSQL database:
   ```bash
   DATABASE_URL=postgresql://ecclesia_user:secure_password@localhost:5432/ecclesia_db
   SECRET_KEY=generate_a_64_character_random_secret
   DEBUG=False
   ```
2. **Reverse Proxy & SSL**:
   Run behind NGINX or Caddy with Let's Encrypt SSL certificates.
3. **Data Backups**:
   Schedule daily automated dumps of PostgreSQL / SQLite databases and media folders.
