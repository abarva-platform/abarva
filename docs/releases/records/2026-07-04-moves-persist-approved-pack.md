# 2026-07-04-moves-persist-approved-pack — Persist approved Inputs Packs via existing storage (increment 10)

## Release ID

`2026-07-04-moves-persist-approved-pack`

## Status

`candidate`

## Plain-English Summary

When the client confirms the What-Changed review, AbarVa now **saves a Move-scoped "approved Inputs Pack"** so the next phase can start pre-filled from an approved source. It is stored through the **existing governed evidence store** (`program_evidence_items`, JSONB payload under a distinct type) — **no new table, no migration, no ACA migrate job**. The next phase reads the latest approved pack if present; if none exists, it falls back to the deterministic feed-forward from current state. The UI states plainly: **"Approved for next phase"** and **"Enterprise context: Not added yet."** Behind `moves_phase_workspace_v2` (Lakeshore on).

## Layer Impact

- `client-data-lane` (flag-gated **write path**): persists a Move-scoped record through the existing `program_evidence_items` store (same DB client, tenancy, RLS, audit log as the evidence writer). New API route `POST /api/programs/workspace/[moveId]/approved-inputs-pack`; new server-side read on the phase page. **No schema change.**
- `global-control-lane`: the pure pack builder + presentational card.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/approved-inputs-pack.ts` — pure `buildApprovedInputsPack` + `isApprovedInputsPack` + `APPROVED_INPUTS_PACK_TYPE` (Move-scoped invariants).
- `src/lib/programs/approved-inputs-pack-store.ts` — `recordApprovedInputsPack` / `getLatestApprovedInputsPack` (server-only; reuses `program_evidence_items` + governed DB client + audit log).
- `src/app/api/programs/workspace/[moveId]/approved-inputs-pack/route.ts` — POST; `requireTenancy` + program gate; server sets `approvedBy`/`approvedAt`/`moveId`; validates the pack.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — reads the latest approved pack targeting the current phase; passes to the client.
- `StrategicMovePhaseClient.tsx` — on confirm → build + POST the pack; accepts + renders the inherited pack.
- `MovePhaseWorkspacePanel.tsx` + `ApprovedInputsPackCard.tsx` — render the inherited pack; fall back to feed-forward when none.
- Tests + proof.

## QA / Validation

- Jest 79/79 — **pass** (pack build: source/target/approver/upload + only-populated-sections + Move-scoped/not-eligible + change summary + serialization round-trip via `isApprovedInputsPack`; card states "not added to enterprise context"; panel renders inherited pack; **fallback to deterministic feed-forward when no pack**; no schema labels leak).
- esbuild parse of client + route + page + store — **pass** (exit 0). Scoped strict `tsc` (pure lib + components) — **pass** (exit 0). ESLint on all changed files — **pass** (exit 0).
- DB patterns verified against existing code: `.insert().select().single()` / `.select().eq().order().limit().maybeSingle()` are used on the same `getAzureWriteFluentClient()` compat client; `getProgramById` returns `currentPhase/archivedAt/deletedAt`.
- Live signed-in Lakeshore **write** proof — **run post-deploy** (confirm What Changed → `POST … 201`).
- Live **read-back** UI — appears on the *next* phase; that view is gate-gated (the move must advance), which was **not** forced with fabricated data. Read path is code-correct (mirrors proven patterns) + unit-tested (fallback + serialization).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. **No migration/migrate-job.** Same flag as increments 3–9.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). **No ACA migrate job, no ad-hoc `az` DB commands.**
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Data plane: reuses the existing `program_evidence_items` store (already migrated, RLS'd); no schema/topology change.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — the confirm→persist write on the Lakeshore phase page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. Written records are Move-scoped rows in the existing store (latest-wins on read); they are inert if the read path is reverted. No schema to unwind.

## Audit Evidence

- PR URL: (added on open). Tests: jest 79/79 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Report: `reports/moves-persist-approved-pack-implementation-2026-07-04.md`.

## Known Gaps

- **Read-back live proof is gate-gated** (needs the move in the next phase); not forced with fake data. Write proof + unit tests cover the rest.
- **Confirm attribution:** `approvedBy` = the resolved actor person id (via `requireTenancy`); a human-readable approver name in the card is a later refinement.
- No enterprise promotion path (by design — Move-scoped only).
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
