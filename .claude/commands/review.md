---
description: Review the pending diff for correctness and quality before committing
---

Review the current uncommitted changes (or the diff against `main`) for the
Work Order project before they are committed. This is a blocking gate: report
findings and fix the clear ones before the commit proceeds.

## Steps

1. Run `git status` and `git diff` (include staged with `git diff --cached`) to
   see exactly what changed.
2. Check against `CLAUDE.md` and `docs/option-b-work-order-screen.md`:
   - Validation rules enforced in the API (order_no regex `^WO-\d{4}-\d{4}$` and
     uniqueness→409, style_code ≤20, qty integer 1–100000).
   - Correct status codes (200/201/400/404/409).
   - Status transitions enforced from the single transition map — no skipping,
     no going backward.
   - The SQLite UNIQUE error is mapped to 409 (no pre-SELECT race).
3. Look for correctness bugs: unhandled errors, SQL injection (must use
   parameterized statements), missing `await`, off-by-one on boundaries,
   `updated_at` not bumped on PATCH.
4. Look for quality issues: duplicated logic that should be shared, dead code,
   inconsistent naming, missing test coverage for a changed path.
5. Confirm `cd server && npm test` passes.

## Output

List findings grouped as **Must fix** (bugs, spec violations, failing tests) and
**Consider** (quality). Fix every Must-fix item, then state the diff is ready to
commit. If nothing is wrong, say so explicitly.
