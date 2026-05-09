# DigiKatib — Semester Project Report

## Personal Finance Management System

---

# Submitted By

| Name | Roll Number |
|---|---|
| **M. Musab Ali Khan (Leader)** | 24K-0528 |
| **Shahzaib Hasan** | 24K-0584 |
| **Sufyan Khan** | 23K-0929 |

---

# Submitted To

**Course Instructor**  
Department of Computer Science  

---

# Submission Date

**May 2026**

---

# Table of Contents

1. Introduction  
2. Project Overview  
3. Problem Statement  
4. Objectives  
5. Scope of the Project  
6. System Analysis  
7. System Design  
8. Technology Stack  
9. Database Design  
10. Backend Implementation  
11. Frontend Implementation  
12. Authentication & Security  
13. API Endpoints  
14. State Management  
15. Features of the System  
16. User Workflows  
17. Testing  
18. Deployment  
19. Challenges Faced  
20. Future Enhancements  
21. Conclusion  

---

# 1. Introduction

Managing personal finances is an important yet difficult task for many individuals. People often fail to maintain proper records of their expenses, debts, and incomes, which results in poor budgeting and financial instability.

To address this issue, we developed **DigiKatib**, a modern full-stack finance management application that allows users to securely manage financial profiles, track expenses and incomes, monitor debts, and visualize financial trends through analytics dashboards.

The system combines a responsive React frontend with a secure Django REST backend to provide a scalable and efficient budgeting solution.

---

# 2. Project Overview

**DigiKatib** is a web-based personal finance management system designed to simplify budgeting and expense tracking.

The application provides:

- JWT-based authentication
- Multi-profile account management
- Expense and income tracking
- Debt management
- Financial analytics and charts
- Unified transaction ledger
- Responsive modern UI

The backend is developed using **Django REST Framework**, while the frontend is built with **React + TypeScript**.

---

# 3. Problem Statement

Traditional financial tracking methods have several limitations:

- Manual bookkeeping is time-consuming
- Financial records are difficult to organize
- No real-time balance updates
- Lack of financial analytics
- Difficulty managing multiple accounts

Users require a centralized digital platform that can efficiently track financial activities while providing meaningful insights and visualizations.

---

# 4. Objectives

## Main Objectives

The objectives of DigiKatib are:

1. Develop a secure finance management system
2. Implement JWT authentication
3. Support multiple financial profiles
4. Provide expense, income, and debt tracking
5. Generate financial analytics and reports
6. Build a responsive user interface
7. Create scalable REST APIs

## Expected Outcomes

The system aims to:

- Improve budgeting habits
- Simplify expense management
- Provide real-time financial insights
- Reduce manual financial record keeping

---

# 5. Scope of the Project

## In Scope

The following features are included:

- User authentication
- Profile management
- Expense management
- Income tracking
- Debt tracking
- Monthly analytics
- Dashboard summaries
- Charts and statistics
- Filtering and pagination

## Out of Scope

The following are not included in this version:

- Mobile application
- Bank account integration
- AI financial prediction
- Online payment gateway
- Multi-currency support

---

# 6. System Analysis

## Functional Requirements

The system must allow users to:

- Register and login securely
- Create and manage profiles
- Add/edit/delete expenses and incomes
- Track debts and due dates
- View dashboards and analytics
- Filter financial records

## Non-Functional Requirements

The system should provide:

- Security
- Scalability
- Reliability
- Fast performance
- Responsive design
- Easy usability

---

# 7. System Design

## Architecture Overview

The project follows a client-server architecture:

```text
Frontend (React)
        ↕
Django REST API
        ↕
PostgreSQL Database
```

---

## Workflow

1. User interacts with frontend UI
2. Frontend sends API requests
3. Backend validates requests
4. Database operations are performed
5. JSON response is returned
6. Frontend updates the interface dynamically

---

# 8. Technology Stack

## Backend Technologies

| Technology | Purpose |
|---|---|
| Django REST Framework | REST API Development |
| PostgreSQL | Database |
| SimpleJWT | Authentication |
| django-filter | Filtering |
| Gunicorn | Production Server |
| WhiteNoise | Static File Management |

---

## Frontend Technologies

| Technology | Purpose |
|---|---|
| React 19 | Frontend Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Axios | API Requests |
| Recharts | Charts & Analytics |
| React Router DOM | Routing |

---

# 9. Database Design

## Main Entities

The system contains the following entities:

- User
- Profile
- Category
- Expense
- Income
- Debt

---

## Entity Relationship Overview

```text
User
 ├── Profile
 │    ├── Expense
 │    └── Income
 ├── Category
 └── Debt
```

---

## Profile Model

Stores financial account information.

| Field | Description |
|---|---|
| user | Owner of profile |
| accountType | Personal or business |
| balance | Current account balance |

---

## Expense Model

Stores expense transactions.

| Field | Description |
|---|---|
| profile | Associated profile |
| name | Expense title |
| amount | Expense amount |
| category | Expense category |
| payment_type | Cash/Card/etc |
| timestamp | Date and time |

---

## Income Model

Stores income entries.

| Field | Description |
|---|---|
| profile | Linked profile |
| name | Income title |
| amount | Income amount |
| timestamp | Entry date |

---

## Debt Model

Stores debt information.

| Field | Description |
|---|---|
| name | Debt description |
| amount | Debt amount |
| due_date | Repayment date |
| is_paid | Paid/unpaid status |

---

# 10. Backend Implementation

## Django REST Framework

The backend is implemented using Django REST Framework and follows RESTful API principles.

---

## Authentication

JWT authentication is implemented using `SimpleJWT`.

### Authentication Flow

```text
Register → Login → Access Token → Protected APIs
                     ↓
              Refresh Token
```

---

## Signals

Django signals automatically update balances:

- Expense creation → deduct balance
- Income creation → increase balance

---

## Filtering

The backend supports filtering using `django-filter`.

### Examples

```http
GET /expenses/?category=3
```

```http
GET /expenses/?min_amount=500
```

---

# 11. Frontend Implementation

## React Frontend

The frontend is built using React + TypeScript with Vite.

---

## Routing

Protected routes ensure unauthorized users cannot access secured pages.

### Routes

| Route | Purpose |
|---|---|
| `/login` | Login page |
| `/register` | Register page |
| `/` | Dashboard |
| `/profiles` | Profiles |
| `/transactions` | Ledger |
| `/debts` | Debt tracking |
| `/stats` | Analytics |

---

## UI Design

The application uses:

- Dark premium theme
- Responsive layout
- Tailwind CSS styling
- Animated transitions
- Toast notifications

---

# 12. Authentication & Security

## Security Features

- JWT authentication
- Access & refresh tokens
- Protected API endpoints
- Ownership validation
- Cross-user access prevention

---

## Token Storage

Tokens are stored in `localStorage`.

| Token | Lifetime |
|---|---|
| Access Token | 30 minutes |
| Refresh Token | 7 days |

---

## Soft Deletes

Records are not permanently deleted.

Instead:

```text
is_deleted = True
```

This preserves financial history.

---

# 13. API Endpoints

## Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/register/` | Register user |
| POST | `/login/` | User login |
| POST | `/logout/` | Logout user |

---

## Profile APIs

| Method | Endpoint |
|---|---|
| GET | `/profiles/` |
| POST | `/profiles/` |
| GET | `/profiles/<id>/` |
| PUT | `/profiles/<id>/` |
| DELETE | `/profiles/<id>/` |

---

## Expense APIs

| Method | Endpoint |
|---|---|
| GET | `/expenses/` |
| POST | `/expenses/` |
| DELETE | `/expenses/<id>/` |

---

## Income APIs

| Method | Endpoint |
|---|---|
| GET | `/incomes/` |
| POST | `/incomes/` |

---

## Debt APIs

| Method | Endpoint |
|---|---|
| GET | `/debts/` |
| POST | `/debts/` |
| PATCH | `/debts/<id>/` |

---

# 14. State Management

## AuthContext

Manages:

- Login
- Logout
- Registration
- User session persistence

---

## FinanceContext

Manages:

- Profiles
- Dashboard data
- Expenses
- Incomes
- Debts

Automatically refreshes data after mutations.

---

# 15. Features of the System

## Multi-Profile Budgeting

Users can create multiple financial profiles such as:

- Personal
- Business

---

## Dashboard Analytics

Provides:

- Total income
- Total expenses
- Net balance
- Debt overview

---

## Unified Ledger

Combines:

- Expenses
- Incomes
- Debts

into a single chronological feed.

---

## Monthly Analytics

Displays:

- Category breakdown
- Spending trends
- Daily expenses
- Savings reports

---

## Debt Notifications

Users receive alerts for:

- Upcoming debts
- Overdue debts

---

# 16. User Workflows

## New User Registration

```text
Register → Login → Dashboard
```

---

## Adding an Expense

```text
Open Profile → Add Expense → Balance Updates
```

---

## Recording Income

```text
Dashboard → Add Income → Updated Balance
```

---

## Debt Tracking

```text
Add Debt → Due Date Reminder → Mark as Paid
```

---

# 17. Testing

## Backend Testing

Tested areas include:

- Authentication
- Serializer validation
- API endpoints
- Balance signals

---

## Frontend Testing

Tested areas include:

- Protected routes
- Dashboard rendering
- Token refresh logic
- CRUD operations

---

# 18. Deployment

## Backend Deployment

The backend supports deployment on:

- Railway
- Render
- VPS hosting

### Build Commands

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn backend.wsgi:application
```

---

## Frontend Deployment

The frontend can be deployed on:

- Vercel
- Netlify

### Build Commands

```bash
npm install
npm run build
```

---

# 19. Challenges Faced

During development, the following challenges were encountered:

- Managing JWT refresh tokens
- Preventing race conditions
- Synchronizing frontend state
- Handling balance consistency
- Designing analytics charts

---

# 20. Future Enhancements

Possible future improvements:

- Mobile application
- AI-based budgeting recommendations
- PDF/Excel export
- Bank integration
- Multi-currency support
- Shared family accounts

---

# 21. Conclusion

DigiKatib successfully demonstrates the implementation of a modern full-stack finance management system using Django REST Framework and React.

The project provides:

- Secure authentication
- Expense and income tracking
- Financial analytics
- Multi-profile budgeting
- Responsive UI design

The system achieves its objectives by delivering a scalable, secure, and user-friendly financial management platform suitable for real-world use.

---

# End of Report
