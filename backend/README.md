# StockSense Backend — Inventory Engine & Stock Ledger API

This service contains the core **double-entry inventory engine**, **operational state machine**, **stock quants cache**, and **immutable audit ledger** for StockSense.

---

## 🚀 Quick Start

### 1. Environment & Database Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If you have Docker Desktop installed, start PostgreSQL with one command from project root:
```bash
docker compose up -d
```
Alternatively, configure `DATABASE_URL` in `.env` to point to any PostgreSQL instance (local or hosted e.g. Neon, Supabase).

### 2. Install & Generate Prisma Client
```bash
npm install
npm run prisma:generate
```

### 3. Push Database Schema & Seed Data
```bash
npm run prisma:push
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```

* **API Root:** [http://localhost:4000/api](http://localhost:4000/api)
* **Interactive Swagger UI:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🤝 Team Collaboration Guide

### For the Authentication Teammate
* **Auth Hook File:** [`src/middleware/authContext.ts`](file:///src/middleware/authContext.ts)
* Every inventory route automatically reads `req.user`.
* When your JWT/session auth middleware is ready, simply replace or augment `authContext.ts` with your JWT token verification.
* For standalone testing, you can pass custom headers:
  * `x-user-id: <uuid>`
  * `x-user-role: INVENTORY_MANAGER` or `WAREHOUSE_STAFF`
  * `x-user-name: <name>`

### For the Frontend Teammate
All endpoints return standard JSON responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status text",
  "meta": { "total": 100, "limit": 50, "offset": 0 }
}
```

#### Key Frontend Endpoints:
* `GET /api/dashboard/summary` — KPI cards (`totalProductsInStock`, `lowStockItems`, `receipts`, `deliveries`, `internalTransfers`).
* `GET /api/operations?type=RECEIPT&status=READY` — Filtered operational queues.
* `POST /api/operations` — Create draft operation with line items.
* `POST /api/operations/:id/check-availability` — Verifies stock for delivery/transfers. Returns `shortages` with `isShortage: true` to trigger red line highlighting.
* `POST /api/operations/:id/validate` — Atomically executes double-entry transfer and moves status to `DONE`.
* `POST /api/adjustments` — Cycle count reconciliation: `{ productId, locationId, countedQty, reason }`.
* `GET /api/ledger` — Move history with `displayColor: "green" | "red" | "blue" | "orange"` for inbound/outbound badges.
* `GET /api/products` — Product catalog with `onHand`, `reserved`, and `freeToUse` metrics.

---

## 🧪 Testing

Run automated tests:
```bash
npm test
```
Compile TypeScript:
```bash
npm run build
```
