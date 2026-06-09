# 2026-06-08-context-corpus-governance-pr3 — Readiness sidecar + backfill

## Release ID

`2026-06-08-context-corpus-governance-pr3`

## Status

`candidate`

## Plain-English Summary

PR-3 of the Context & Corpus Governance Framework: the first DB slice. It adds a
single additive table, `governed_object_readiness`, that carries the governance
readiness state (agent-readiness, retrievability, classification, grounding,
cite-render verification, provenance) for every governed object across all
stores, keyed by `(object_table, object_id, client_key)`. Source tables are not
touched — no columns added, no rows rewritten. A read-only/dry-run-first backfill
seeds the conservative, truthful state per object and, critically, **never
auto-promotes anything to `agent_ready`** (that requires earned cite-render
verification — the defect class behind the #3322 and Lakeshore incidents). The
mapping is unit-tested with `auto_promoted === 0` as a locked invariant.

## Layer Impact

**global-control-lane**: additive governance schema + tooling. New migration
(`supabase/migrations/20260608160000_governed_object_readiness.sql`) creates one
new table + four indexes — additive only, reversible by `DROP TABLE`. Pure
mapping core (`src/lib/governance/readiness-backfill.ts`), ACA-job backfill
runner (`src/scripts/governance/readiness-backfill.ts`, dry-run default),
runbook, npm script. No source-row mutation; no runtime behavior change.

## Client Applicability

- All clients: the sidecar and backfill iterate `CANONICAL_TENANT_KEYS` +
  `corpus_global`, so every canonical tenant is covered (SkyHarbor included).
- No client-facing behavior change at runtime: the ledger is read/updated by
  later slices (PR-4 validators, PR-5 runtime bundle).
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260608160000_governed_object_readiness.sql` — additive
  table + unique identity index + scope/status/layer indexes; reverse SQL documented.
- `src/lib/governance/readiness-backfill.ts` — pure `computeProposedReadiness`
  (mirrors `evaluateGovernedObject` gating; no auto-promotion) + summary/report renderers.
- `src/lib/governance/__tests__/readiness-backfill.test.ts` — 10 tests locking
  the no-auto-promotion invariant + sensitive fencing + un-indexed mapping.
- `src/scripts/governance/readiness-backfill.ts` — ACA-job runner; dry-run
  counts via `azureRead`, `--commit` upserts via the transactional write seam;
  never mutates source rows; idempotent.
- `docs/governance/CONTEXT_CORPUS_READINESS_BACKFILL_2026-06-08.md` — runbook +
  reverse SQL + report template.
- `package.json` — `governance:readiness-backfill` script. Trackers updated.

## QA / Validation

- `jest src/lib/governance/__tests__/readiness-backfill.test.ts` — **10/10 passed**.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed** (0 warnings).
- Live populated report + committed sidecar rows: **pending** — apply the
  migration (`npm run db:migrate`, manual paste step) and run the backfill as an
  ACA job (runbook in the doc). The workstation cannot reach the private Azure DB.

## Rollout Plan

Merge to `main`. Apply the additive migration via `npm run db:migrate` inside the
VNet. Run the backfill dry-run, confirm `auto-promoted = 0`, then `--commit` as an
ACA job. No runtime cutover; later slices read the ledger.

## Rollback Plan

Revert this PR (code/tooling). To reverse the schema:
`DROP TABLE IF EXISTS public.governed_object_readiness;`. No source data is
touched by forward migration, backfill, or reverse.

## Audit Evidence

- PR URL + CI run. Migration + runbook + reverse SQL in `supabase/migrations/`
  and `docs/governance/`. Brief + PR-0/PR-1/PR-2. Backfill report (after ACA job).

## Known Gaps

Per-row grounding/index/cite-verification signals are not yet columns on the
source tables, so the backfill seeds the conservative floor (`not_reviewed` /
`committed_not_indexed` / fenced). Promotion to `agent_ready` is wired in PR-5
(runtime bundle) / PR-7 (visible citations); PR-4 adds the CI validators that
read this ledger.
