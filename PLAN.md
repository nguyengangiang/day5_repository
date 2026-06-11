# Option B — Work Order Screen (Node + React + SQLite)

## Context

Day 5 SPELIX capstone. The fork contains only the Option B materials
(`docs/option-b-work-order-screen.md`, `schema/option-b.sql`,
`wireframes/option-b.html`). Greenfield build: a small MES "Work Order" service —
a SQLite-backed REST API with three endpoints, driven by a React screen, fully
covered by Jest tests.

Stack: **Node/Express API + React (Vite) front-end + SQLite (better-sqlite3)**.
Tests: **Jest + supertest**.

## Architecture

```
server/
  src/
    db.js            # opens SQLite, runs schema/option-b.sql; factory takes a path (tests use ':memory:')
    validation.js    # pure validators: order_no regex, style_code, qty, status, transitions
    workOrders.js    # data access + business logic (create / list / transition)
    app.js           # Express app (routes + static serve of client build) — exported, NO listen()
    server.js        # imports app, app.listen()
  tests/
    workOrders.test.js
  package.json
client/
  src/
    api.js
    App.jsx
    components/{StatusFilter,WorkOrderTable,CreateWorkOrderForm}.jsx
  index.html
  vite.config.js     # dev proxy: /work-orders -> http://localhost:3000
  package.json
schema/option-b.sql  # EXISTING — reused by db.js
```

`app.js` exported (no listen) so supertest drives it in-process. `db.js` factory
takes a path → tests use `:memory:` reseeded per test. Express serves the built
React app for the demo; Vite proxy forwards API calls in dev.

## API

1. **GET /work-orders?status=** — optional status in PENDING/IN_PROGRESS/COMPLETED
   else 400. Returns row array (200).
2. **POST /work-orders** — `order_no` required, `^WO-\d{4}-\d{4}$`, unique→409;
   `style_code` required non-empty ≤20; `qty` integer 1–100000. 201 + row, 400 on fail.
3. **PATCH /work-orders/:id/status** — transitions only PENDING→IN_PROGRESS→COMPLETED.
   200 + row, 400 illegal/bad value, 404 not found. Bumps updated_at.

Transition map (single source of truth): `{PENDING:[IN_PROGRESS], IN_PROGRESS:[COMPLETED], COMPLETED:[]}`.
Duplicate order_no → catch SQLite UNIQUE error → 409.

## Screen

Status filter dropdown (ALL + 3) → GET; table Order No|Style|Qty|Status|Action;
Start on PENDING (→IN_PROGRESS), Complete on IN_PROGRESS (→COMPLETED), — on
COMPLETED; create form posts + refreshes. Re-fetch after each mutation.

## Tests (test-writer sub-agent)

In-memory DB reseeded per test. GET: all / per-status filter / invalid→400.
POST: 201 / each validation 400 / duplicate 409. PATCH: each valid 200 /
illegal+backward 400 / bad value 400 / unknown id 404.

## Build / commit sequence (8+ commits)

1. PLAN.md + CLAUDE.md + .claude artifacts.
2. Scaffold packages + db.js.
3. POST + validation → tests → /review → commit.
4. GET + filter → tests → /review → commit.
5. PATCH + transitions → tests → /review → commit.
6. React: api + table + filter.
7. React: create form + actions; Express serves build.
8. E2E manual test + README run instructions.

## Verification

- `cd server && npm test` — all suites green.
- `cd server && npm start` + `cd client && npm run dev` (or build + Express serve).
- Browser: create WO-2026-0001, filter, Start→Complete, action collapses to —.
- curl: duplicate→409, PENDING→COMPLETED→400, unknown id→404, `?status=FOO`→400.
