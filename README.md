# ExpenseTracker — Project Documentation

> A backend-only Django REST API for personal finance management — tracking expenses, incomes, debts, and multi-profile budgeting with JWT-based authentication.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Authentication & Security](#6-authentication--security)
7. [Filtering & Pagination](#7-filtering--pagination)
8. [Key Features](#8-key-features)
9. [User Workflows](#9-user-workflows)
10. [Deployment](#10-deployment)
11. [Environment Variables](#11-environment-variables)
12. [Development Setup](#12-development-setup)
13. [Testing](#13-testing)

---

## 1. Project Overview

**ExpenseTracker** is a RESTful API built with Django and Django REST Framework (DRF). It allows users to:

- Register and authenticate with JWT tokens
- Create multiple financial **profiles** (e.g., personal, business)
- Log **expenses** and **incomes** per profile
- Track **debts** separately
- Organize spending via **categories**
- View **dashboard summaries** and **monthly breakdowns**

The API is designed to be consumed by a frontend SPA (React/Next.js) or a mobile app. No frontend code is included in this repository.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django 5.2.5 + Django REST Framework 3.16.1 |
| Authentication | `djangorestframework-simplejwt` (JWT) |
| Database | PostgreSQL (`psycopg2-binary`) |
| Filtering | `django-filter` |
| CORS | `django-cors-headers` |
| Static Files | WhiteNoise |
| App Server | Gunicorn (prod) / Waitress |
| Config | `python-dotenv`, `dj-database-url` |
| Deployment | Railway (configured via Procfile) |

---

## 3. Project Structure

```
backend/
├── manage.py                    # Django management entrypoint
├── requirements.txt             # Python dependencies
├── runtime.txt                  # Python version pin
├── Procfile                     # Railway/Heroku deployment commands
│
├── backend/                     # Django project config package
│   ├── settings.py              # All settings (env-driven)
│   ├── urls.py                  # Root URL configuration
│   ├── wsgi.py                  # WSGI entrypoint (Gunicorn)
│   └── asgi.py                  # ASGI entrypoint
│
└── api/                         # Core application
    ├── models.py                # Data models (User, Profile, Category, Expense, Income, Debt)
    ├── serializers.py           # DRF serializers for validation & transformation
    ├── views.py                 # API views (ListCreate, RetrieveUpdateDestroy, APIView)
    ├── urls.py                  # App-level URL patterns
    ├── filters.py               # django-filter FilterSets
    ├── tests.py                 # Test suite
    └── migrations/              # 11 migration files tracking schema evolution
```

### URL Routing

All routes are mounted at the **root** (no `/api/` prefix):

```
/              → health check ("DigiKatib Backend OK")
/health/       → health check ("OK")
/register/     → user registration
/login/        → JWT login
/logout/       → JWT logout (blacklist refresh token)
/profiles/     → profile management
/categories/   → category management
/expenses/     → expense management
/incomes/      → income management
/debts/        → debt management
/dashboard/    → aggregated summary
/admin/        → Django admin panel
```

---

## 4. Data Models

### User
Extends Django's `AbstractUser`. No extra fields — the built-in username/password/email fields are used.

### Profile
Represents a financial account (e.g., "Personal", "Business"). A single user can have **multiple profiles**.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner of this profile |
| `accountType` | CharField(20) | e.g., "personal", "business" |
| `balance` | DecimalField(12,2) | Current balance; default 0 |

### Category
User-defined spending categories (e.g., "Food", "Rent"). Unique per user.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `name` | CharField(50) | Unique per user (`unique_together`) |

### Expense
Individual spending entries, linked to a profile and a category. Supports **soft delete**.

| Field | Type | Notes |
|---|---|---|
| `profile` | FK → Profile | Which profile this expense belongs to |
| `name` | CharField(100) | Description |
| `amount` | DecimalField(10,2) | Spending amount |
| `category` | FK → Category | Spending category |
| `payment_type` | CharField(50) | Optional (e.g., "cash", "card") |
| `ref_id` | CharField(100) | Optional reference ID |
| `timestamp` | DateTimeField | Defaults to now |
| `comments` | TextField | Optional notes |
| `is_deleted` | BooleanField | Soft delete flag (default: False) |

### Income
Income entries linked to both a user and a profile.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `profile` | FK → Profile | Distribution target |
| `name` | CharField(100) | Description |
| `amount` | DecimalField(10,2) | Must be positive |
| `timestamp` | DateTimeField | Defaults to now |
| `comments` | TextField | Optional |
| `is_deleted` | BooleanField | Soft delete flag |

### Debt
Standalone debt tracking — not linked to a profile, just to the user.

| Field | Type | Notes |
|---|---|---|
| `user` | FK → User | Owner |
| `name` | CharField(100) | Description (e.g., "Car loan") |
| `amount` | DecimalField(12,2) | Must be positive |
| `is_paid` | BooleanField | Paid-off flag (default: False) |
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
 └── Debt (many)
```

---

## 5. API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register/` | Public | Register a new user |
| POST | `/login/` | Public | Get JWT access + refresh tokens |
| POST | `/logout/` | Required | Blacklist refresh token |

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
| GET | `/profiles/<pk>/` | Get profile detail |
| PUT/PATCH | `/profiles/<pk>/` | Update profile |
| DELETE | `/profiles/<pk>/` | Delete profile |
| GET | `/profiles/<pk>/summary/` | Monthly summary + current balance |
| GET | `/profiles/<pk>/monthly/` | All months with income/expense totals |
| GET | `/profiles/<pk>/monthly/<year>/<month>/` | Detailed monthly report |
| GET/POST | `/profiles/<pk>/expenses/` | List/create expenses for this profile |

---

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories/` | List all categories for current user |
| POST | `/categories/` | Create a category |
| GET/PUT/PATCH/DELETE | `/categories/<pk>/` | Detail, update, delete |

---

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses/` | List expenses (filterable) |
| POST | `/expenses/` | Create an expense |
| GET/PUT/PATCH | `/expenses/<pk>/` | Detail and update |
| DELETE | `/expenses/<pk>/` | Soft delete (sets `is_deleted=True`) |

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
| GET | `/dashboard/` | Aggregated totals: income, expenses, debts, net balance, recent transactions |

---

## 6. Authentication & Security

### JWT Flow

1. User registers via `POST /register/`
2. User logs in via `POST /login/` → receives `access` (30 min) and `refresh` (7 days) tokens
3. All protected requests include: `Authorization: Bearer <access_token>`
4. When the access token expires, use `POST` with the refresh token to get a new one (SimpleJWT's built-in `/token/refresh/` or custom flow)
5. Logout via `POST /logout/` with the refresh token — it gets **blacklisted** (requires `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`)

### Token Lifetimes

| Token | Lifetime |
|---|---|
| Access | 30 minutes |
| Refresh | 7 days |

### Ownership Enforcement

Serializers validate that the requesting user owns the resources they reference (e.g., a profile they attach an expense to). This prevents cross-user data access at the serializer layer.

### Soft Deletes

`Expense`, `Income`, and `Debt` are never hard-deleted. Instead, `is_deleted=True` is set. Clients should filter out soft-deleted records unless reviewing history.

---

## 7. Filtering & Pagination

### Pagination

All list views are paginated at **20 items per page** (DRF `PageNumberPagination`).

### Filters (`api/filters.py`)

Each resource supports `django-filter` FilterSets:

| Resource | Filterable Fields |
|---|---|
| Expense | `profile`, `category`, `payment_type`, min/max `amount`, date range (`timestamp`) |
| Income | `profile`, min/max `amount`, date range |
| Debt | `is_paid`, min/max `amount`, `due_date` range |

Example query:
```
GET /expenses/?category=3&min_amount=500&timestamp_after=2025-01-01
```

---

## 8. Key Features

### Multi-Profile Support
A single user account can manage multiple financial profiles — useful for separating personal and business finances, or tracking finances for different family members.

### Monthly Analytics
- `/profiles/<pk>/monthly/` — returns a list of all months that have activity, with aggregated income and expense totals per month.
- `/profiles/<pk>/monthly/<year>/<month>/` — returns a drill-down: expenses broken down by category and daily spending patterns.

### Dashboard Aggregation
`/dashboard/` gives a bird's-eye view across **all profiles** for the current user:
- Total income, total expenses, total debt
- Net balance
- Recent transactions

### Soft Deletes
Records are never lost — they are flagged with `is_deleted=True`. This preserves financial history and allows for potential restore/audit functionality.

### Category Management
Users define their own spending categories. Each category is unique per user, allowing fully customized budgeting taxonomies.

---

## 9. User Workflows

### Workflow 1: New User Onboarding

```
1. POST /register/         → create account
2. POST /login/            → get access + refresh tokens
3. POST /categories/       → create categories (Food, Rent, Transport, etc.)
4. POST /profiles/         → create a profile (e.g., "Personal - Savings")
```

### Workflow 2: Logging a Daily Expense

```
1. POST /expenses/
   Body: { "profile": 1, "name": "Groceries", "amount": 2500, "category": 3 }

   → Expense is created and linked to the profile
   → Profile balance is updated accordingly
```

### Workflow 3: Checking Monthly Spending

```
1. GET /profiles/1/monthly/
   → See all months with activity (e.g., ["2025-01", "2025-02", ...])

2. GET /profiles/1/monthly/2025/4/
   → April breakdown:
     - Expenses by category (Food: 8000, Transport: 2000, etc.)
     - Daily spending trend
```

### Workflow 4: Tracking a Debt

```
1. POST /debts/
   Body: { "name": "Student Loan", "amount": 150000, "due_date": "2026-01-01" }

2. GET /dashboard/
   → Total debt shown in summary

3. PATCH /debts/1/
   Body: { "is_paid": true }
   → Mark as paid off
```

### Workflow 5: Recording Income

```
1. POST /incomes/
   Body: { "profile": 1, "name": "Freelance Project", "amount": 50000 }

2. GET /profiles/1/summary/
   → Updated balance reflected; income included in monthly totals
```

### Workflow 6: Token Refresh & Logout

```
1. Access token expires after 30 minutes
2. POST /token/refresh/ with refresh token → new access token
3. POST /logout/ with refresh token → token blacklisted, session ends
```

---

## 10. Deployment

The project is configured for **Railway** but works on any platform supporting Python + PostgreSQL.

### Procfile

```
release: python manage.py migrate
web: gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --access-logfile - --error-logfile - --log-level info
```

### Build Steps

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Apply migrations (handled by Procfile release step)
python manage.py migrate

# 3. Collect static files (required for WhiteNoise)
python manage.py collectstatic --noinput

# 4. Start server
gunicorn backend.wsgi:application
```

### Health Checks

| Endpoint | Expected Response |
|---|---|
| `GET /` | `200 OK` — `"DigiKatib Backend OK"` |
| `GET /health/` | `200 OK` — `"OK"` |

---

## 11. Environment Variables

| Variable | Type | Required in Prod | Description |
|---|---|---|---|
| `DEBUG` | bool | Yes | Set to `False` in production |
| `SECRET_KEY` | string | Yes | Secure Django secret key |
| `ALLOWED_HOSTS` | CSV | Yes | Hostnames only, no scheme (e.g., `myapp.railway.app,localhost`) |
| `CSRF_TRUSTED_ORIGINS` | CSV | Yes | Origins with scheme (e.g., `https://myapp.railway.app`) |
| `CORS_ALLOWED_ORIGINS` | CSV | Yes | Frontend origins with scheme |
| `DATABASE` | string | Yes | PostgreSQL DB name |
| `USER` | string | Yes | DB username |
| `PASSWORD` | string | Yes | DB password |
| `HOST` | string | Yes | DB host |
| `PORT` | string | Yes | DB port |

> **Note:** `ALLOWED_HOSTS` takes hostnames only. `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` require the full scheme (`https://`).

---

## 12. Development Setup

```bash
# Clone the repo
git clone <repo-url>
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Linux/macOS
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Set up .env file
cp .env.example .env           # Edit with your local values

# Run migrations
python manage.py migrate

# Create a superuser (optional, for admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Recommended `.env` for local dev

```env
DEBUG=True
SECRET_KEY=any-local-dev-key
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE=expensetracker_db
USER=postgres
PASSWORD=yourpassword
HOST=localhost
PORT=5432
```

---

## 13. Testing

```bash
# Run all tests
python manage.py test

# Check deployment config (when DEBUG=False)
python manage.py check --deploy
```

### Recommended Test Coverage

| Area | What to Test |
|---|---|
| Serializers | Validation rules (positive amounts, ownership checks) |
| Auth flow | Register → Login → Token refresh → Logout |
| Protected endpoints | 401 without token, 200 with valid token |
| Soft deletes | `DELETE /expenses/<pk>/` sets `is_deleted=True`, not removed from DB |
| Filters | Amount ranges, date ranges, category/profile filters |
| Analytics views | Monthly and summary views return correct aggregations |
| Cross-user isolation | User A cannot access User B's profiles/expenses |

---

## Recommended Frontend Integration

When building a frontend against this API:

- Store the `access` token in memory; store `refresh` in an `httpOnly` cookie for security
- Attach `Authorization: Bearer <token>` to every protected request
- Handle `401 Unauthorized` by attempting a token refresh, then retry
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend's exact origin (with port if needed)
- Respect soft-deleted records — filter `is_deleted=false` on client side or ensure the API does so

### Suggested Frontend Route Map

| Route | Component |
|---|---|
| `/login` | Login page |
| `/register` | Registration page |
| `/dashboard` | Overview — net balance, totals, recent transactions |
| `/profiles` | List of financial profiles |
| `/profiles/:id` | Profile detail, monthly summary |
| `/profiles/:id/monthly/:year/:month` | Detailed monthly report |
| `/categories` | Manage categories |
| `/expenses` | Expenses list with filters |
| `/incomes` | Incomes list |
| `/debts` | Debts list |

---

*Documentation generated from `context.json` — keep updated as models and endpoints evolve.*
