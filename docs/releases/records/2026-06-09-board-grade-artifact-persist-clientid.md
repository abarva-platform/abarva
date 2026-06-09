# 2026-06-09-board-grade-artifact-persist-clientid — Fix silent board-grade artifact persist no-op

## Release ID

`2026-06-09-board-grade-artifact-persist-clientid`

## Status

`candidate`

## Plain-English Summary

Follow-up fix to #3127 (board-grade Move artifact persistence). Live verification
on app.abarva.ai found that board-grade Move decks rendered fine but **were never
persisted** to `generated_artifacts` — no `x-generated-artifact-id` header on any
board-grade route, and no `generated_artifacts` row, so the retrieval endpoint had
nothing to return. Root cause: `clientId` resolved to a falsy value
(`moveInput.tenant_key ?? user.metadataClientKey`, where the Move's `clients.key`
was null/empty and `??` does not fall through empty/`null` to a usable key in this
path), so `persistBoardGradeMoveArtifact` bailed at its guard and returned null —
silently (no log, no header).

This fixes the resolution and makes the failure observable: persistence now falls
back to the active tenant (the same key the retrieval route filters by, keeping
writes and reads aligned), treats empty strings as missing, warns when it still
cannot resolve a client key, and emits an explicit
`x-generated-artifact-persisted: true|false` response header. It also fixes a
related 500: the retrieval route returned an unhandled 500 for a non-UUID
`artifactId` (uuid-cast error) — it now returns a clean 404.

## Layer Impact

- **global-control-lane**: shared board-grade Move artifact route behavior — the
  persistence wrapper (`board-grade-persistence.ts`) and the artifact retrieval
  route. No schema change.
- **client-data-lane**: `generated_artifacts` rows that previously failed to write
  will now be written (client-scoped by the resolved active tenant key). No
  migration; uses the existing table from #3127 / `generated_artifacts_v1`.

## Client Applicability

- All clients: every board-grade Move deck render now persists a retrievable
  artifact for the active tenant.
- Feature flag: none.

## Changes Included

- `src/lib/programs/board-artifacts/board-grade-persistence.ts` — robust clientId
  resolution (active-tenant fallback, `||` not `??`), non-silent warn, and
  `x-generated-artifact-persisted` header signal.
- `src/app/api/v1/artifacts/[artifactId]/route.ts` — UUID guard → 404 (not 500)
  for malformed ids.
- `src/lib/programs/board-artifacts/__tests__/board-grade-persistence.test.ts` —
  7 tests (explicit key, active-tenant fallback, empty-string fallback,
  non-silent null, throw-safe, header true/false).

## QA / Validation

- `jest board-grade-persistence.test.ts repository.test.ts` — **8/8 passed**.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.
- **Live root cause** confirmed on app.abarva.ai 2026-06-09 (Apex tenant): all 8
  board-grade routes returned 200 with **no** `x-generated-artifact-id`; single
  replica showed no insert error → silent guard bail. The 500-on-non-UUID was
  log-confirmed (`lookup failed: invalid input syntax for type uuid`).
- **Post-merge live re-verification required**: after deploy to ACA, re-run the
  render→persist→retrieve probe on an Apex Move and confirm
  `x-generated-artifact-persisted: true` + a retrievable `/api/v1/artifacts/:id`.

## Rollout Plan

Merge to `main`, build + deploy the ACA web image, then re-run the live probe to
confirm persistence fires (`x-generated-artifact-persisted: true`).

## Rollback Plan

Revert this PR. Behavior returns to the prior (silent no-op) state; no schema or
data migration is involved.

## Audit Evidence

- PR URL + CI run. Live verification notes (this session). Builds on #3127.

## Known Gaps

If a Move's `clients.key` is genuinely null AND the active tenant cannot be
resolved, the deck still cannot be persisted — but now it warns and signals
`persisted: false` instead of failing invisibly. The empty Moves-portfolio
listing gap (Move rows exist but the portfolio shows "NO MOVES YET") is separate
and not addressed here.
