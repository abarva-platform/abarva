# QA28 — Active Route Shell Verification

**Wave:** wave-20
**Lane:** I
**Status:** code_complete
**Created:** 2026-04-26

---

## What This Slice Delivers

- `src/lib/qa/active-route-shell-verification.ts` — deterministic filesystem
  verification library with 20 checks spanning route files, flagship components,
  Wave-20 shell components (deferred pre-integration), legacy shell tracking,
  chrome-import hygiene, Wave-19 integration checks, and manifest validity.

- `src/__tests__/integration/qa/active-route-shell-verification.test.ts` —
  Jest test suite that validates report shape, required checks, deferred handling,
  known-present items, and determinism. Tests pass now with Wave-20 deferrals
  and will fully pass post-integration.

- `docs/build/ACTIVE_ROUTE_SHELL_VERIFICATION.md` — per-check inventory with
  expected post-integration state and deferred item explanation.

- Manifest updates: `build-slices.json`, `production-readiness.json`,
  `build-waves.json`.

---

## Scope

Code-only. No application code changes, no migrations, no model calls, no
live cloud calls, no production readiness promotion.

---

## Pre-integration Deferred Items

Wave-20 SHELL1–7 components do not exist in this branch. Their checks return
`status: 'deferred'`. This is intentional and expected. Once Wave-20 is
integrated, all deferred checks resolve to `pass` automatically.

---

## No-fabrication Contract

- No Date.now / Math.random / new Date() in the library.
- No fake pass statuses — every status is driven by `fs.existsSync` or
  `fs.readFileSync` on the actual filesystem.
- production_deployment status is preserved (still blocked); the
  prod-deploy-verification blocker is preserved verbatim; no component is promoted.
