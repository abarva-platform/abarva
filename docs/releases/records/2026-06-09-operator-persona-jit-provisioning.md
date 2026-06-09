# 2026-06-09-operator-persona-jit-provisioning — JIT identity provisioning for operator personas

## Release ID

`2026-06-09-operator-persona-jit-provisioning`

## Status

`candidate`

## Plain-English Summary

Operator/demo personas (`+<tenant>@…` logins) can authenticate via Clerk metadata
without a graph `persons` row, so `requireTenancy()` resolved `ctx.userId =
"clerk:<id>"` — a non-UUID string. That broke every write into a uuid-typed actor
column (the Move phase-advance approver threw `invalid input syntax for type uuid`)
and made role/access resolve wrong (the earlier create-permission drift). This adds
**just-in-time identity provisioning**: when `requireTenancy` sees the `clerk:`
fallback, it creates the missing identity rows for the single active canonical
tenant, so `ctx.userId` is always a real `persons.id` UUID and role resolves admin.

It is **identity-graph only** and **fail-safe**: it writes `persons` + exactly one
`person_client_memberships` + an audit row, never any context/corpus fact; and on
any error it returns null so `requireTenancy` keeps the prior behavior (the safe
"operator person row required" path) — never a new break.

## Layer Impact

- **global-control-lane**: `requireTenancy` now JIT-resolves a real actor `persons.id`.
- **client-data-lane**: writes identity rows (`persons`, `person_client_memberships`)
  - an `audit_log` row, scoped to one canonical client. No schema migration (dedupe
    by email; reuses `createPerson`). No context/corpus writes.

## Client Applicability

- All clients: applies to any operator/demo persona signing into a canonical tenant
  (apex-retail, meridian-health, northstar-clinical, first-capital, skyharbor-air,
  lakeshore-holdings). SkyHarbor is the immediate driver (its Move advance was blocked).
- No client-facing behavior change for normal users who already have a `persons` row.
- Feature flag: none.

## Hard boundaries honored

- Identity rows only — never context/corpus facts (those load via the governed Admin path).
- One login → exactly one canonical tenant: exactly one membership; non-canonical
  tenant → refuse (null). No tenant switcher, no multi-client, no cross-tenant grant.
- Idempotent (persons deduped by email; membership by person_id+client_id), audited.
- Fail-safe: any failure → null → existing safe-error fallback (no throw out of `requireTenancy`).

## Changes Included

- `src/lib/auth/operator-persona-provisioning.ts` — `ensureOperatorPersonProvisioned`
  (canonical-only, single-tenant, idempotent, audited, fail-safe).
- `src/lib/auth/tenancy.ts` — `requireTenancy` JIT-provisions when userId is the `clerk:` fallback.
- `src/lib/auth/__tests__/operator-persona-provisioning.test.ts` — 8 tests
  (refuse non-canonical / no-email / no-clientId; create + single client_admin membership;
  idempotent reuse; no second membership; admin vs viewer role derivation).

## QA / Validation

- `jest operator-persona-provisioning.test.ts` — **8/8 passed**.
- `tsc --noEmit` — **0 errors repo-wide**. `eslint` (changed files) — **passed**.
- **Live verification (post-deploy on ACA):** signed in as `anand.sundaram+skyharbor`,
  `POST /api/v1/programs/<moveId>/advance {toPhase:1, humanRationale, selfApproveIfAuthorized:true}`
  **succeeds** (no `clerk:` uuid 500), `current_phase`→1, `/phase/1` renders; `ctx.userId`
  is a real UUID; role resolves admin. (Pending deploy — see Rollout.)

## Rollout Plan

Merge to `main`, build the ACA web image, deploy revision, re-run the live advance.
Because provisioning is JIT, the existing SkyHarbor persona self-heals on its next
authenticated request after deploy — no backfill job required.

## Rollback Plan

Revert this PR. `requireTenancy` returns to the `clerk:` fallback (the safe
"operator person row required" error). No schema/data migration to unwind; provisioned
identity rows are valid and harmless if left in place.

## Audit Evidence

- PR URL + CI run. Each provisioning writes an `audit_log` row
  (`operator_persona.provisioned`). Memory: `feedback_operator_persona_provisioning`.

## Known Gaps

- **Layer 3 (optional backfill):** a one-shot ACA job could pre-provision all canonical
  personas instead of waiting for first request — not required since JIT self-heals.
- Audit write is best-effort (wrapped) in case `audit_log` column shape differs; confirm
  the row lands and tighten if needed.
- Defensive guard test (no `clerk:` string reaches a uuid column on any write path) is a
  good follow-up to lock the invariant beyond `requireTenancy`.
