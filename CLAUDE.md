# CLAUDE.md — Option B: Work Order Screen

MES work-order service. Node/Express API + React (Vite) UI + SQLite via Node's
built-in `node:sqlite` (`DatabaseSync` — chosen over better-sqlite3 because this
machine lacks the VS build tools native modules need).
Tests with Jest + supertest. See `PLAN.md` for the full plan and
`docs/option-b-work-order-screen.md` for the spec.

## Layout

- `server/` — Express API. `src/app.js` is exported **without** `listen()` so
  tests drive it via supertest; `src/server.js` calls `listen()`.
- `client/` — React front-end (Vite).
- `schema/option-b.sql` — the single `work_orders` table; loaded by `server/src/db.js`.

## Data model — `work_orders`

`id`, `order_no` (unique), `style_code`, `qty`, `status`, `created_at`, `updated_at`.
Statuses: `PENDING` (default) → `IN_PROGRESS` → `COMPLETED`.

## Validation rules (enforce in the API, not just the DB)

| Field | Rule | On failure |
| ----- | ---- | ---------- |
| `order_no` | required, matches `^WO-\d{4}-\d{4}$`, unique | 400 / **409** if duplicate |
| `style_code` | required, non-empty string, ≤ 20 chars | 400 |
| `qty` | required, integer, 1–100000 | 400 |
| `status` (query/body) | one of PENDING / IN_PROGRESS / COMPLETED | 400 |

## Status transitions (single source of truth)

```
PENDING → IN_PROGRESS → COMPLETED
```
Map: `{ PENDING: ['IN_PROGRESS'], IN_PROGRESS: ['COMPLETED'], COMPLETED: [] }`.
No skipping (PENDING→COMPLETED is 400), no going backward. Unknown id → 404.

## API shape

- `GET /work-orders?status=` → 200 array (filter optional; bad status → 400).
- `POST /work-orders` `{order_no, style_code, qty}` → 201 row / 400 / 409.
- `PATCH /work-orders/:id/status` `{status}` → 200 row / 400 / 404.

Map the SQLite UNIQUE-constraint error to 409 — do not race a pre-SELECT.

## Workflow rules (non-negotiable)

- **Plan Mode first** — no code before an approved plan.
- **Delegate test writing to the `test-writer` sub-agent.**
- **Run `/review` before every commit** and fix every finding first.
- **Small commits** — commit after each passing test (aim 8+).
- Keep this file updated when field names / rules / API shape change.
