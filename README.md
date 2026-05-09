# ExpenseTracker (DigiKatib) — Project Documentation

> A full-stack personal finance management application. The backend is a Django REST API with JWT authentication and PostgreSQL; the frontend is a React + TypeScript SPA with a dark premium ledger UI, real-time analytics, and multi-profile budgeting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Security](#7-authentication--security)
8. [State Management](#8-state-management)
9. [Filtering & Pagination](#9-filtering--pagination)
10. [Key Features](#10-key-features)
11. [User Workflows](#11-user-workflows)
12. [Deployment](#12-deployment)
13. [Environment Variables](#13-environment-variables)
14. [Development Setup](#14-development-setup)
15. [Testing](#15-testing)
16. [Known Issues & Notes](#16-known-issues--notes)

---

## 1. Project Overview

**ExpenseTracker**, branded as **DigiKatib**, is a full-stack budgeting and finance tracking application. Users can manage multiple financial profiles, log expenses and incomes, track debts, and visualize their spending patterns through charts and monthly breakdowns.

**What it does:**
- Register/login with JWT-based authentication
- Create and manage multiple **financial profiles** (personal, business, etc.)
- Log categorized **expenses** and **incomes** per profile — balances update automatically via Django signals
- Track **debts** with due dates and paid/unpaid status
- View a **dashboard** with cross-profile totals, net balance, and recent activity
- Drill into **monthly analytics** with category breakdowns and daily spending trends
- Browse a **unified transactions ledger** across all entry types

**Repository:** `musab285/ExpenseTracker`

---

## 2. Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | Django 5 + Django REST Framework |
| Authentication | `djangorestframework-simplejwt` (JWT) |
| Database | PostgreSQL via `DATABASE_URL` (SQLite fallback for local) |
| Filtering | `django-filter` |
| CORS | `django-cors-headers` |
| Static Files | WhiteNoise (compressed manifest) |
| App Server | Gunicorn (production) |
| Config | `python-dotenv`, `dj-database-url` |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Routing | `react-router-dom` |
| State | React Context API (`AuthContext` + `FinanceContext`) |
| HTTP Client | Axios with JWT bearer + refresh retry queue |
| UI / Styling | Tailwind CSS v4 |
| Animations | `motion` |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Notifications | `sonner` (toast library) |

---

## 3. Project Structure

```
ExpenseTracker/
├── DEPLOYMENT.md
│
├── backend/                          # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── Procfile
│   ├── backend/                      # Django project config
│   │   ├── settings.py               # All settings (env-driven)
│   │   ├── urls.py                   # Root URL configuration
│   │   ├── wsgi.py                   # WSGI entrypoint (Gunicorn)
│   │   └── asgi.py
│   └── api/                          # Core domain app
│       ├── models.py                 # User, Profile, Category, Expense, Income, Debt
│       ├── serializers.py            # DRF serializers (validation + transformation)
│       ├── views.py                  # API views (ListCreate, RetrieveUpdateDestroy, APIView)
│       ├── urls.py                   # App-level URL patterns
│       ├── filters.py                # django-filter FilterSets
│       ├── signals.py                # Auto balance update on expense/income save
│       ├── tests.py                  # Test suite (placeholder)
│       └── migrations/               # 11 migration files
│
└── frontend/                         # React + Vite SPA
    └── src/
        ├── pages/                    # Feature pages
        │   ├── Dashboard.tsx         # Overview: totals, activity, quick actions
        │   ├── Profiles.tsx          # Create/list/delete accounts
        │   ├── ProfileDashboard.tsx  # Per-profile view with tabs
        │   ├── Transactions.tsx      # Unified ledger (expense+income+debt)
        │   ├── Debts.tsx             # Debt table with status toggle
        │   ├── Statistics.tsx        # Cross-profile trend charts
        │   └── profile/              # Profile tab sub-pages
        │       ├── Summary.tsx       # Current month summary + balance
        │       ├── Transactions.tsx  # Profile-scoped activity
        │       └── Monthly.tsx       # Month-by-month breakdown
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx       # Navigation sidebar
        │   │   ├── TopBar.tsx        # Balance display, notifications, profile menu
        │   │   └── AppLayout.tsx     # Protected shell (Sidebar + TopBar + Outlet)
        │   └── ui/
        │       └── Modal.tsx         # Reusable modal component
        ├── contexts/
        │   └── AuthContext.tsx       # Auth state: login/register/logout
        ├── FinanceContext.tsx         # Finance state + CRUD orchestration
        ├── services/
        │   └── api.ts                # Axios client, interceptors, endpoint wrappers
        └── lib/
            └── utils.ts              # cn() class merge, formatCurrency (USD)
```

### Frontend Route Map

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/` | Dashboard | Protected |
| `/profiles` | Profiles list | Protected |
| `/profiles/:id` | Profile Dashboard (Summary / Transactions / Monthly tabs) | Protected |
| `/transactions` | Unified ledger | Protected |
| `/debts` | Debt tracker | Protected |
| `/stats` | Cross-profile analytics + charts | Protected |

### Backend URL Routing

All routes are mounted at the **root** (no `/api/` prefix):

```
/              → Health check ("DigiKatib Backend OK")
/health/       → Health check ("OK")
/register/     → User registration
/login/        → JWT login
/logout/       → JWT logout (blacklist refresh token)
/profiles/     → Profile management
/categories/   → Category management
/expenses/     → Expense management
/incomes/      → Income management
/debts/        → Debt management
/dashboard/    → Aggregated summary
/admin/        → Django admin panel
```

---

## 4. Data Models

### User
Extends Django's `AbstractUser`. Uses built-in `username` / `password` / `email` fields.

### Profile
Represents a financial account. A user can have **multiple profiles** (e.g., "Personal", "Business"). Balance is maintained automatically via Django signals when expenses or incomes are created.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `accountType` | CharField(20) | e.g., "personal", "business" |
| `balance` | DecimalField(12,2) | Running balance; updated by signals |

### Category
User-defined spending labels. Unique per user.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `name` | CharField(50) | Unique per user (`unique_together`) |

### Expense
Individual spending entries linked to a profile and category. Supports **soft delete**.

| Field | Type | Notes |
|---|---|---|
| `profile` | FK → Profile | Profile this expense belongs to |
| `name` | CharField(100) | Description |
| `amount` | DecimalField(10,2) | Spending amount |
| `category` | FK → Category | Spending category |
| `payment_type` | CharField(50) | Optional (e.g., "cash", "card") |
| `ref_id` | CharField(100) | Optional reference ID |
| `timestamp` | DateTimeField | Defaults to now |
| `comments` | TextField | Optional notes |
| `is_deleted` | BooleanField | Soft delete flag |

> **Signal behavior:** On expense create → profile balance is debited. On hard delete → balance is reversed. Soft delete does **not** trigger a signal reversal.

### Income
Income entries linked to a user and a profile.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `profile` | FK → Profile | Profile receiving the income |
| `name` | CharField(100) | Description |
| `amount` | DecimalField(10,2) | Must be positive |
| `timestamp` | DateTimeField | Defaults to now |
| `comments` | TextField | Optional |
| `is_deleted` | BooleanField | Soft delete flag |

> **Signal behavior:** On income create → profile balance is credited.

### Debt
Standalone debt entries linked to the user only, **not** to a profile. Debt amounts do **not** affect profile balances (signal handlers are intentional no-ops).

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `name` | CharField(100) | Description (e.g., "Car loan") |
| `amount` | DecimalField(12,2) | Must be positive |
| `is_paid` | BooleanField | Paid-off flag |
| `due_date` | DateField | Optional |
| `timestamp` | DateTimeField | Defaults to now |
| `comments` | TextField | Optional |
| `is_deleted` | BooleanField | Soft delete flag |

### Entity Relationship Summary

```
User
 ├── Profile (many)
 │    ├── Expense (many)  → Category
 │    └── Income (many)
 ├── Category (many)
 └── Debt (many)          ← not linked to Profile; no balance effect
```

---

## 5. API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register/` | Public | Create a new user account |
| POST | `/login/` | Public | Get JWT `access` + `refresh` tokens |
| POST | `/logout/` | Required | Blacklist the refresh token |

**Login Response:**
```json
{
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>"
}
```

---

### Profiles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profiles/` | List all profiles for current user |
| POST | `/profiles/` | Create a new profile |
| GET | `/profiles/<pk>/` | Profile detail |
| PUT/PATCH | `/profiles/<pk>/` | Update profile |
| DELETE | `/profiles/<pk>/` | Delete profile |
| GET | `/profiles/<pk>/summary/` | Current month income/expense summary + balance |
| GET | `/profiles/<pk>/monthly/` | All months with aggregated income/expense/savings |
| GET | `/profiles/<pk>/monthly/<year>/<month>/` | Category breakdown + daily spending for a month |
| GET/POST | `/profiles/<pk>/expenses/` | List/create expenses scoped to this profile |
| GET/PUT/PATCH/DELETE | `/profiles/<pk>/expenses/<exp_id>/` | Expense detail within profile context |

---

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories/` | List all user categories |
| POST | `/categories/` | Create a category |
| GET/PUT/PATCH/DELETE | `/categories/<pk>/` | Detail, update, delete |

---

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses/` | List expenses (filterable) |
| POST | `/expenses/` | Create an expense |
| GET/PUT/PATCH | `/expenses/<pk>/` | Detail and update |
| DELETE | `/expenses/<pk>/` | Soft delete (`is_deleted=True`) |

---

### Incomes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/incomes/` | List incomes (filterable) |
| POST | `/incomes/` | Create an income entry |
| GET/PUT/PATCH/DELETE | `/incomes/<pk>/` | Detail, update, soft delete |

---

### Debts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/debts/` | List debts (filterable) |
| POST | `/debts/` | Create a debt entry |
| GET/PUT/PATCH/DELETE | `/debts/<pk>/` | Detail, update, soft delete |

---

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/` | Cross-profile totals (income, expenses, debts, net balance) + recent merged ledger |

---

## 6. Frontend Architecture

### Application Shell

Public routes (`/login`, `/register`) are accessible without a token. All other routes are wrapped by a `ProtectedRoute` component that redirects unauthenticated users to `/login`.

Authenticated routes render inside `AppLayout`, which provides:
- **Sidebar** — main navigation (Dashboard, Profiles, Transactions, Debts, Stats)
- **TopBar** — shows current net balance, notification bell (upcoming/overdue debts), and a profile/logout menu
- **Outlet** — renders the active page

### Pages & Responsibilities

**Dashboard (`/`)**
- Cross-profile totals: total income, total expenses, total debt, net balance
- Merged recent activity feed (expenses + incomes + debts)
- Quick-add buttons for income and debt entries
- Account cards linking to individual profile dashboards

**Profiles (`/profiles`)**
- Lists all financial profiles as cards
- Create new profiles with an account type
- Delete profiles

**Profile Dashboard (`/profiles/:id`)**
Three-tab interface per profile:
- **Summary tab** — current month income vs. expenses, current balance, savings rate
- **Transactions tab** — filterable list of expenses and incomes for this profile
- **Monthly tab** — month selector with category breakdown and daily spending chart

**Transactions (`/transactions`)**
- Unified ledger combining expenses, incomes, and debts across all profiles
- Filter and search support
- Delete entries; mark debts as paid directly from the list

**Debts (`/debts`)**
- Table view of all debts with due date and paid/unpaid status
- Toggle paid status inline
- Soft delete entries

**Statistics (`/stats`)**
- Cross-profile trend analytics
- Charts for spending patterns over time (powered by `recharts`)

### Service Layer (`src/services/api.ts`)

The Axios client is configured with:
- **Base URL** from `VITE_API_URL` environment variable
- **Request interceptor** — attaches `Authorization: Bearer <access_token>` to every outgoing request
- **Response interceptor** — on `401 Unauthorized`, automatically attempts to refresh the access token using the stored refresh token, then replays the failed request. Concurrent failed requests are queued and replayed together once the token is refreshed (preventing race conditions)

Domain-specific client modules:

| Module | Covers |
|---|---|
| `authAPI` | `/register/`, `/login/`, `/logout/` |
| `dashboardAPI` | `/dashboard/` |
| `profilesAPI` | `/profiles/` and all nested routes |
| `categoriesAPI` | `/categories/` |
| `expensesAPI` | `/expenses/` |
| `incomesAPI` | `/incomes/` |
| `debtsAPI` | `/debts/` |

### UI System

- **Theme:** Dark premium ledger aesthetic — gold, green, and rose accents on a dark base
- **Styling:** Tailwind CSS v4
- **Animations:** `motion` for page/component transitions
- **Toasts:** `sonner` for success/error feedback on mutations
- **Currency:** `formatCurrency()` helper in `utils.ts` (USD)
- **Class merging:** `cn()` combining `clsx` + `tailwind-merge`

---

## 7. Authentication & Security

### JWT Flow

```
1. POST /register/   → create account (frontend auto-logs in after success)
2. POST /login/      → receive access token (30 min) + refresh token (7 days)
3. All requests      → Authorization: Bearer <access_token>
4. Token expiry      → Axios interceptor calls /token/refresh/ automatically
5. POST /logout/     → refresh token blacklisted; user session ends
```

### Token Storage (Frontend)

Tokens and the user object are persisted in **`localStorage`** and bootstrapped into `AuthContext` on app load, so users stay logged in across page refreshes.

| Token | Lifetime |
|---|---|
| Access | 30 minutes |
| Refresh | 7 days |

### Ownership Enforcement (Backend)

Serializers validate that the requesting user owns all resources they reference (e.g., the profile an expense is attached to). Cross-user data access is blocked at the serializer layer before any database write occurs.

### Soft Deletes

`Expense`, `Income`, and `Debt` records are never hard-deleted — `is_deleted=True` is set instead. All queries exclude soft-deleted records by default. Financial history is preserved for auditing.

---

## 8. State Management

### `AuthContext` (`src/contexts/AuthContext.tsx`)

Global authentication state:
- Bootstraps stored token + user from `localStorage` on initial load
- Exposes `login()`, `register()`, and `logout()` functions
- After successful registration, automatically logs the user in (no double form flow)
- Triggers `sonner` toasts for auth feedback (success/error)

### `FinanceContext` (`src/FinanceContext.tsx`)

Central orchestrator for financial data:
- Loads profiles, categories, and dashboard data on mount
- Exposes CRUD actions: `createProfile()`, `createCategory()`, `createExpense()`, `createIncome()`, `createDebt()`
- After any mutation, automatically re-fetches the dashboard and relevant profile data so balances and totals stay in sync without a page reload

---

## 9. Filtering & Pagination

### Pagination

All list views are paginated at **20 items per page** (DRF `PageNumberPagination`).

### Filters (`api/filters.py`)

| Resource | Filterable Fields |
|---|---|
| Expense | `profile`, `category`, `payment_type`, min/max `amount`, date range (`timestamp`) |
| Income | `profile`, min/max `amount`, date range (`timestamp`) |
| Debt | `is_paid`, min/max `amount`, `due_date` range |

Example query:
```
GET /expenses/?category=3&min_amount=500&timestamp_after=2025-01-01
```

The frontend passes these as query parameters through the respective API wrapper modules.

---

## 10. Key Features

### Multi-Profile Budgeting
One user account can manage multiple independent financial profiles. Each profile has its own running balance, updated automatically by Django signals.

### Auto Balance via Signals
Django `post_save` signals on `Expense` and `Income` keep profile balances accurate:
- Create expense → profile balance debited
- Create income → profile balance credited
- Hard delete → balance reversed
- Debt entries have intentional no-op signals (informational only, no balance effect)

### Monthly Analytics
- `GET /profiles/<pk>/monthly/` — all months with activity, including aggregated income, expenses, and savings
- `GET /profiles/<pk>/monthly/<year>/<month>/` — category breakdown + daily spending; rendered as pie and bar charts on the frontend Monthly tab

### Dashboard Aggregation
`GET /dashboard/` provides a cross-profile summary: total income, total expenses, total debt, net balance, and a merged recent transactions ledger.

### Unified Transactions Ledger
The `/transactions` page merges all financial entry types into one chronological feed with filtering and inline actions (delete, mark debt paid).

### Token Refresh Queue
The Axios interceptor queues concurrent `401` responses, refreshes the token once, then replays all queued requests — preventing race conditions when multiple requests fail simultaneously at token expiry.

### Debt Notifications
The TopBar notification bell surfaces upcoming or overdue debts as at-a-glance alerts without navigating to the Debts page.

### Soft Deletes
Records flagged with `is_deleted=True` are excluded from all queries. Financial history is preserved and recoverable.

---

## 11. User Workflows

### Workflow 1: New User Onboarding

```
Frontend                                Backend
──────────────────────────────────────────────────────────
/register → fill form        →  POST /register/   (create user)
                             →  POST /login/       (auto-login)
→ Redirect to Dashboard
→ Create categories (modal)  →  POST /categories/
→ Create first profile       →  POST /profiles/
```

### Workflow 2: Logging a Daily Expense

```
Frontend                                Backend
──────────────────────────────────────────────────────────
Profile Dashboard → Transactions tab
→ "Add Expense"              →  POST /expenses/
                                 Signal: debit profile balance
→ FinanceContext re-fetches dashboard + profile summary
→ Balance in TopBar updates instantly
```

### Workflow 3: Checking Monthly Spending

```
Frontend                                Backend
──────────────────────────────────────────────────────────
Profile Dashboard → Monthly tab
→ Load month list            →  GET /profiles/1/monthly/
→ Select April               →  GET /profiles/1/monthly/2025/4/
→ Category pie chart renders (recharts)
→ Daily spending bar chart renders
```

### Workflow 4: Tracking a Debt

```
Frontend                                Backend
──────────────────────────────────────────────────────────
Dashboard → "Quick Add Debt"
→ Fill form                  →  POST /debts/
→ Debt appears in /debts table
→ TopBar bell alerts on due date
→ Mark as paid (inline)      →  PATCH /debts/<id>/ { is_paid: true }
```

### Workflow 5: Recording Income

```
Frontend                                Backend
──────────────────────────────────────────────────────────
Dashboard → "Quick Add Income"
→ Select profile + amount    →  POST /incomes/
                                 Signal: credit profile balance
→ Dashboard net balance updates
→ Profile summary reflects new income
```

### Workflow 6: Automatic Token Refresh

```
Access token expires (30 min)
→ Any API call returns 401
→ Axios interceptor catches 401, queues the request
→ POST /token/refresh/ with stored refresh token
→ New access token stored in localStorage
→ All queued requests replayed transparently
→ User never sees an error or gets redirected
```

### Workflow 7: Logout

```
Frontend                                Backend
──────────────────────────────────────────────────────────
TopBar → Profile menu → Logout
→ POST /logout/ { refresh }  →  Refresh token blacklisted
→ localStorage cleared (tokens + user)
→ Redirect to /login
```

---

## 12. Deployment

The backend is configured for **Railway** but runs on any platform supporting Python + PostgreSQL. The frontend is a static Vite build deployable to Vercel, Netlify, or Railway's static hosting.

### Backend — Procfile

```
release: python manage.py migrate
web: gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --access-logfile - --error-logfile - --log-level info
```

### Backend — Build Steps

```bash
pip install -r requirements.txt
python manage.py migrate                      # handled by Procfile release step
python manage.py collectstatic --noinput      # required for WhiteNoise
gunicorn backend.wsgi:application
```

### Frontend — Build Steps

```bash
cd frontend
npm install
npm run build       # outputs to dist/
```

Deploy the `dist/` folder as a static site. Configure your hosting to serve `index.html` for all routes (required for client-side routing).

### Health Checks

| Endpoint | Expected Response |
|---|---|
| `GET /` | `200 OK` — `"DigiKatib Backend OK"` |
| `GET /health/` | `200 OK` — `"OK"` |

---

## 13. Environment Variables

### Backend

| Variable | Type | Required in Prod | Description |
|---|---|---|---|
| `DEBUG` | bool | Yes | Set to `False` in production |
| `SECRET_KEY` | string | Yes | Secure Django secret key |
| `ALLOWED_HOSTS` | CSV | Yes | Hostnames only, no scheme (e.g., `myapp.railway.app,localhost`) |
| `CSRF_TRUSTED_ORIGINS` | CSV | Yes | Origins with scheme (e.g., `https://myapp.railway.app`) |
| `CORS_ALLOWED_ORIGINS` | CSV | Yes | Frontend origin with scheme |
| `DATABASE_URL` | string | Yes | Full PostgreSQL connection URL (parsed by `dj-database-url`) |

> `ALLOWED_HOSTS` takes hostnames only. `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` require the full `https://` scheme.

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend (e.g., `https://myapp.railway.app`) |

---

## 14. Development Setup

### Backend

```bash
git clone https://github.com/musab285/ExpenseTracker.git
cd ExpenseTracker/backend

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env              # edit with local values
python manage.py migrate
python manage.py createsuperuser  # optional, for Django admin
python manage.py runserver        # runs on http://localhost:8000
```

**Sample `.env` for local backend:**
```env
DEBUG=True
SECRET_KEY=any-local-dev-key
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/expensetracker_db
```

### Frontend

```bash
cd ExpenseTracker/frontend

npm install

echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev       # runs on http://localhost:5173
```

---

## 15. Testing

### Backend

```bash
python manage.py test

# Validate deployment configuration
python manage.py check --deploy    # run with DEBUG=False
```

### Recommended Backend Test Coverage

| Area | What to Test |
|---|---|
| Serializers | Positive-amount validation, ownership checks on profile/category references |
| Auth flow | Register → auto-login → token refresh → logout |
| Protected endpoints | `401` without token; `200` with valid token |
| Signals | Expense create debits profile balance; income create credits it |
| Soft deletes | `DELETE /expenses/<pk>/` sets `is_deleted=True`; record still in DB |
| Filters | Amount ranges, date ranges, `is_paid` for debts |
| Analytics views | Monthly and summary endpoints return correct aggregated values |
| Cross-user isolation | User A cannot read or modify User B's data |

### Recommended Frontend Test Coverage

| Area | What to Test |
|---|---|
| Route guards | Unauthenticated users redirected to `/login` |
| Auth flow | Login stores tokens; logout clears them |
| Token interceptor | 401 triggers refresh + request replay |
| FinanceContext | Mutations call correct API endpoints and trigger re-fetches |
| Dashboard | Correct totals rendered from mock API response |

---

## 16. Known Issues & Notes

| # | Area | Note |
|---|---|---|
| 1 | Token Refresh | The frontend interceptor calls `/token/refresh/`, but this endpoint is not explicitly declared in `backend/urls.py`. It relies on SimpleJWT's default inclusion. Verify it is reachable in production before deploying. |
| 2 | Debt Signals | Signal handlers for `Debt` are intentionally no-ops — debts do not affect profile balances by design. |
| 3 | Backend Tests | `api/tests.py` is a placeholder. No tests are implemented yet. |
| 4 | CORS | `CORS_ALLOW_ALL_ORIGINS=True` is set in current backend settings (all origins allowed). Restrict this to the frontend domain before going to production. |
| 5 | Soft Delete & Balance | Soft-deleting an expense does **not** reverse the profile balance debit. Only hard deletes trigger signal reversal. This can cause balance drift if soft-deleted records are common. |

---

*Documentation covers both `backend/` and `frontend/` as of the current codebase snapshot. Keep updated when models, endpoints, or frontend routes change.*
