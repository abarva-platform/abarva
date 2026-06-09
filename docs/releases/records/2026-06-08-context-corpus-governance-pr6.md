# 2026-06-08-context-corpus-governance-pr6 — End-to-end tenant coverage

## Release ID

`2026-06-08-context-corpus-governance-pr6`

## Status

`candidate`

## Plain-English Summary

PR-6 of the Context & Corpus Governance Framework: the end-to-end coverage view.
It reads the PR-3 readiness ledger (`governed_object_readiness`) and produces, for
every canonical tenant (+ corpus_global), how many governed objects exist and how
many are agent-ready / retrievable / restricted / blocked / unreviewed, plus a
governed percentage. Every canonical tenant is represented — one with no ledger
rows is flagged "NO DATA FOUND" (the SkyHarbor guarantee, now applied to
readiness, not just raw counts). The pure aggregation is unit-tested; the DB-IO
report runs read-only as an ACA job.

## Layer Impact

**global-control-lane**: read-only governance reporting. New pure aggregation
(`src/lib/governance/tenant-coverage.ts`), ACA-job runner
(`src/scripts/governance/tenant-coverage-report.ts`), npm script, report template.
No schema, no migration, no writes, no runtime path.

## Client Applicability

- All clients: the report iterates `CANONICAL_TENANT_KEYS`; every tenant appears,
  with no-data flagged.
- No client-facing behavior change.
- Feature flag: none.

## Changes Included

- `src/lib/governance/tenant-coverage.ts` — `aggregateTenantCoverage` + `renderTenantCoverageMarkdown`.
- `src/lib/governance/__tests__/tenant-coverage.test.ts` — 5 tests (every-tenant, no-data flag, status buckets, governed %, grand totals).
- `src/scripts/governance/tenant-coverage-report.ts` — read-only ACA-job runner over the readiness ledger.
- `docs/governance/CONTEXT_CORPUS_TENANT_COVERAGE_2026-06-08.md` — runbook + template.
- `package.json` — `governance:tenant-coverage-report` script. Trackers updated.

## QA / Validation

- `jest src/lib/governance/__tests__/tenant-coverage.test.ts` — **5/5 passed**.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.
- `npm run validate:context-corpus` — PR-4 gate still green.
- Live populated report: **pending** — run as an ACA job after the PR-3 backfill commits (runbook in the doc).

## Rollout Plan

Merge to `main`. The live coverage report is produced by an operator ACA job
(read-only), then committed. No runtime rollout.

## Rollback Plan

Revert this PR. Read-only tooling; no migration, no data, no runtime path.

## Audit Evidence

- PR URL + CI run. Report template + runbook. Brief + PR-0..PR-5.

## Known Gaps

Governed % reflects the conservative PR-3 backfill (~0 agent-ready until cite-
render verification promotes objects via PR-5/PR-7). The report is a point-in-time
ACA-job artifact, not a live dashboard (a future surface could render it).
