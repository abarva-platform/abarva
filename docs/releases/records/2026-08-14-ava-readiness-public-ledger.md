# 2026-08-14-ava-readiness-public-ledger — aVa Readiness Public Ledger

## Release ID

`2026-08-14-ava-readiness-public-ledger`

## Status

`candidate`

## Plain-English Summary

Hardens the aVa readiness ledger so committed reports separate `loaded`, `indexed`, `retrievable`, and `cited` states without exposing tenant identifiers or proof paths. The ledger remains report-only and does not promote any agent, run retrieval, activate indexes, or make runtime truth claims.

## Layer Impact

`global-control-lane`

Layer 4 / agent readiness reporting only. This release changes audit output shape and publishes a current sanitized report; it does not change product routing, canonical data, graph materialization, indexing, retrieval, citations, or aVa runtime behavior.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None named in public release material.
- Internal only: Operators and agents using the committed readiness report.
- Public/demo only: No direct change.
- Feature flag: None.

## Changes Included

- Updates `scripts/audit/ava-readiness-ledger.mjs`.
- Adds `scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs`.
- Publishes `reports/ava-readiness-ledger/current-main/`.

## QA / Validation

- Pass: `node --check scripts/audit/ava-readiness-ledger.mjs`.
- Pass: `node --check scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs`.
- Pass: `node scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs`.
- Pass: `npm run audit:ava-readiness-ledger -- --out reports/ava-readiness-ledger/current-main --tenant all --source-sha 9c845b30ac16c39e2a1ffc91c24bc8c735da87af`.
- Pass: `npx eslint scripts/audit/ava-readiness-ledger.mjs scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs`.
- Pass: disclosure scan over the report, script, test, and release record for tenant-name/path leakage.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow may deploy the script/report, but the change is inert and does not alter aVa readiness, product routing, or retrieval behavior.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy.
- Approved image digest: Captured by ACA main deploy if this report is merged.
- ACA runtime invariant: Required only if the repo-owned deploy runs.
- Worker image invariant: Required only if the repo-owned deploy runs.
- Feature/env flag update path: None.
- Live signed-in proof required: No; report-only, no runtime behavior change.

## Rollback Plan

Revert the ledger script/test/report and this release record. No data rollback is needed because no tenant data, registry, index, data-plane state, projection, or runtime route changes are made.

## Audit Evidence

- `reports/ava-readiness-ledger/current-main/summary.json`
- `reports/ava-readiness-ledger/current-main/ava-readiness-ledger.csv`
- PR URL: pending.

## Known Gaps

This does not load data, index data, prove retrieval, render citations, promote `agent_ready`, run refusal prompts at runtime, resolve `CONFLICT` facts, refresh product projections, or materialize graph tables.
