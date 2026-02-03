# Money Manager Backend

Node.js + Express API for the Money Manager web application. Handles users, transactions, reports, filters, and account transfers.

## Tech Stack

- Node.js, Express
- MongoDB (Mongoose)
- JWT auth, bcrypt

## Setup

1. Copy `.env.example` to `.env` and set:
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – Secret for JWT signing
   - `PORT` – Server port (default 5000)

2. Install and run:

```bash
npm install
npm run dev
```

## API Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Transactions:** `POST /api/transaction/add`, `GET /api/transaction/monthly`, `GET /api/transaction/weekly`, `GET /api/transaction/yearly`, `GET /api/transaction/filter`, `GET /api/transaction/category-summary`, `PUT /api/transaction/edit/:id`, `GET /api/transaction/can-edit/:id`, `GET /api/transaction/list`, `GET /api/transaction/constants`
- **Accounts:** `GET /api/account/list`, `POST /api/account/transfer`, `POST /api/account/create`

All transaction/account routes require `Authorization: Bearer <token>` except `/transaction/constants`.

## Edit Rule

Entries can be edited only within **12 hours** of creation. The backend enforces this in `PUT /api/transaction/edit/:id`.

## Deployment

Deploy to Render, Railway, or similar. Set `MONGODB_URI` and `JWT_SECRET` in environment variables.
