# WAVE1 - Build Wave Progress Tracker

Slice ID: WAVE1
Slice name: Build Wave Progress Tracker
Status: code_complete
Authored: 2026-04-26
Wave: Wave 8 (Build Operations Hardening)
Primary agent: Lane H (build-operations parallel pack)
Depends on: OPS1, OPS2, PROD2, PROD4

## Purpose

WAVE1 lands the deterministic wave-level build progress manifest at
`docs/build/build-waves.json`, the matching protocol document at
`docs/build/BUILD_WAVE_PROGRESS_PROTOCOL.md`, and a deterministic Jest
suite at `src/__tests__/integration/ops/build-wave-progress.test.ts`.

It answers a single founder-facing question:

> Where are we, wave by wave, and what is the next deterministic action?

WAVE1 is read-only and rolls up the existing slice manifest and merged
PR history. It does not deploy, does not call any provider, does not
poll Vercel or GitHub, does not invent progress, and does not promote
any production-readiness component above its honest current status.

## What Changed

- New manifest at `docs/build/build-waves.json` (this slice).
- New protocol at `docs/build/BUILD_WAVE_PROGRESS_PROTOCOL.md` (this
  slice).
- New slice contract at `docs/build/slices/WAVE1_BUILD_WAVE_PROGRESS_TRACKER.md`
  (this file).
- New deterministic Jest suite at
  `src/__tests__/integration/ops/build-wave-progress.test.ts` (this
  slice) asserting shape, lifecycle vocabulary, percentComplete
  reconciliation, and slice-membership consistency.
- Append-only update to `docs/build/build-slices.json` recording the
  WAVE1 slice entry at status `code_complete`.
- Conservative union-update to `docs/build/production-readiness.json`
  preserving the OPS1 conflict policy: notes appended, status
  preserved, blockers preserved.

## Wave Manifest Shape

`build-waves.json` is a deterministic JSON read model with:

- `schemaVersion: 1`.
- `lastUpdated: '2026-04-26'`.
- `source: 'Deterministic build wave manifest. Updated by integration
  agent after each wave merge.'`.
- `lifecycle` and `validationLifecycle` enums encoding the canonical
  status / validation vocabulary.
- A `waves` array of nine entries (Wave 0 through Wave 8) with the
  fields:
  - `waveId`
  - `name`
  - `goal`
  - `status` ∈ {`planned`, `in_progress`, `merged`, `blocked`, `deferred`}
  - `percentComplete` (integer 0–100)
  - `plannedSlices` (string[])
  - `completedSlices` (string[])
  - `skippedSlices` (string[])
  - `blockedSlices` (string[])
  - `mergedPrs` (positive integer[])
  - `validationStatus` ∈ {`not_run`, `tsc_clean`, `tests_green`,
    `build_green`, `ci_green`, `full_pass`, `partial`, `failing`}
  - `productionReadinessUpdated` (boolean)
  - `currentBlockers` (string[])
  - `nextAction` (string)
  - `lastUpdated` (string)

## Wave Membership Rules

Wave membership is best-effort honest mapping from slice IDs to wave
themes. The mapping was inferred from:

- Slice ID prefix and slice name in `build-slices.json`.
- The merged-PR commit messages on `main` (e.g.,
  `feat: add enterprise SaaS, data trust, and private deployment
  foundations (#286)` for Wave 3 / `feat: add agent dispatch, mission
  wiring, context evidence, and AI portfolio inventory (#258)` for
  Wave 1).
- The canonical wave names supplied by the founder spec.

Rules:

- A slice ID belongs to at most one wave.
- A slice ID that does not clearly belong to any wave is omitted from
  this WAVE1 cut and may be added later by the integration agent with
  evidence.
- Future-only slice IDs (e.g., `OPS5`, `OPS6`, `OPS7`, `OPS8`, `QA13`,
  `CLOUD8`, `PROD5`) are listed in `plannedSlices` for waves that have
  not yet shipped, so the manifest can carry forward roadmap intent
  without inventing slice contracts.

## Percent Complete Formula

`percentComplete = round( len(completedSlices) / len(plannedSlices) * 100 )`

For the empty-wave case (`len(plannedSlices) === 0`), `percentComplete`
is `0`. The integration test reconciles every wave's declared value
against this formula within ±1.

## Validation Commands

- `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8'));
  console.log('waves json ok')"`
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/ops/build-wave-progress.test.ts`
- `npm run build`

## Acceptance Criteria

- `build-waves.json` parses and matches the documented shape.
- All nine canonical waves (Wave 0 through Wave 8) are present.
- No duplicate `waveId`.
- Every `status` value is in the canonical set.
- Every `validationStatus` value is in the canonical set.
- Every wave's `percentComplete` reconciles with the formula within ±1.
- Every slice ID in `completedSlices` exists in `build-slices.json` at
  status `code_complete` or `verified`.
- Every slice ID in `plannedSlices` either exists in `build-slices.json`
  or is documented as a slice contract under `docs/build/slices/`.
- Every entry in `mergedPrs` is a positive integer.
- WAVE1's slice manifest entry is appended to `build-slices.json` at
  status `code_complete`.

## What This Slice Does NOT Do

- Does not deploy.
- Does not poll Vercel or GitHub.
- Does not call any model provider.
- Does not promote any production-readiness component.
- Does not modify auth, supabase, migrations, or runtime code.
- Does not change build configuration.
- Does not claim a wave is `merged` unless every slice in
  `completedSlices` is already on `main` per the slice manifest.
- Does not claim `ci_green` for any wave; CI gating remains deferred.

## Cross-References

- OPS1 — Agent Dispatch Operating Model (worktree-per-slice, lane
  agents commit only, conflict policy).
- OPS2 — Multi-Agent Dispatch Queue Automation Read Model (the
  per-slice queue this manifest aggregates).
- PROD2 — Production Readiness Tracker Update Rules and Validator (must
  be re-run after every wave merge).
- PROD4 — Deployment Status Ingestion (token presence detection only;
  no provider calls).
- QA8 — Enterprise Deployment + Trust Verification Runbook (Wave 3
  acceptance reference).
