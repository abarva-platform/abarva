# 2026-06-08-context-corpus-governance-pr2 — Inventory scanner + aggregation

## Release ID

`2026-06-08-context-corpus-governance-pr2`

## Status

`candidate`

## Plain-English Summary

PR-2 of the Context & Corpus Governance Framework: a read-only inventory scanner that counts every
governed-object store per canonical tenant (+ corpus_global) and renders a coverage report. The
report represents EVERY canonical tenant — a tenant with no data is flagged "NO DATA FOUND," never
omitted (so SkyHarbor can't be silently missing). The pure aggregation is unit-tested; the DB-IO
scanner runs as an ACA job (the private DB is unreachable from a workstation).

## Layer Impact

**global-control-lane**: new governance tooling (`src/lib/governance/inventory.ts` pure aggregation,
`src/scripts/governance/inventory-scan.ts` ACA-job runner, npm script). **Read-only** — no writes,
no schema, no migration, no data change. Iterates `CANONICAL_TENANT_KEYS`.

## Client Applicability

- All clients: the scanner covers every canonical tenant; report flags any with no data.
- Not applicable at runtime: tooling/reporting only; no client-facing behavior change.
- Feature flag: none.

## Changes Included

- `src/lib/governance/inventory.ts` — pure `aggregateInventory` + `renderInventoryReportMarkdown`.
- `src/lib/governance/__tests__/inventory.test.ts` — 4 tests (incl. the SkyHarbor "no data found" flag).
- `src/scripts/governance/inventory-scan.ts` — read-only ACA-job runner (defensive per-store probing).
- `docs/governance/CONTEXT_CORPUS_INVENTORY_REPORT_2026-06-08.md` — report template + ACA-job runbook.
- `package.json` — `governance:inventory-scan` script. Trackers updated.

## QA / Validation

- `jest src/lib/governance/__tests__/inventory.test.ts` — **4/4 passed**.
- `tsc --noEmit` — **passed** (0 errors in changed files).
- `eslint` — **passed** (0 warnings after cleanup).
- Live populated report: **pending** — run the scanner as an ACA job (runbook in the report). The
  workstation cannot reach the private Azure DB; the aggregation core is unit-tested.

## Rollout Plan

Merge to `main`. No runtime rollout. The live inventory report is produced by an operator ACA job
(read-only) per the runbook, then committed.

## Rollback Plan

Revert this PR. Read-only tooling; no migrations, no data, no runtime path touched.

## Audit Evidence

- PR URL + CI run. Report template + runbook in `docs/governance/`. Brief + PR-0/PR-1.

## Known Gaps

Granular missing-field counts (source_basis/confidence/classification/retrievability) populate after
PR-3 adds the governed columns; PR-2 establishes coverage totals. Live report awaits the ACA job.
