# 2026-06-06-lakeshore-azure-substrate-readiness — Lakeshore Azure Substrate Readiness Audit

## Release ID

`2026-06-06-lakeshore-azure-substrate-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a Lakeshore-only Azure substrate readiness audit. The report separates current app database proof from Azure-private proof, documents the live Lakeshore corpus and context counts, records Azure AI Search credential blockers, records the Clerk persona ban blocker, and provides the exact next actions before Lakeshore can be called Azure-private demo-ready.

## Layer Impact

- `client-data-lane`: Read-only Lakeshore substrate audit and data-plane evidence.
- `internal-admin`: Operator-facing readiness report for Azure cutover and demo readiness.
- Runtime code: none.
- Data changes: none.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore Holdings only.
- Internal only: Yes.
- Public/demo only: Supports Lakeshore demo readiness decisions.
- Feature flag: None.

## Changes Included

- `docs/build/lakeshore-azure-substrate/LAKESHORE_AZURE_SUBSTRATE_READINESS_REPORT_2026-06-06.md`
- `docs/releases/records/2026-06-06-lakeshore-azure-substrate-readiness.md`

## QA / Validation

- PASS: `GET https://app.abarva.ai/api/health` returned HTTP 200 with `ok: true`.
- PASS: Current `DATABASE_URL` connected and returned Lakeshore corpus/context/source/move counts.
- PASS: `scripts/load-genome-wave.ts` dry-run accepted a one-row Lakeshore QA JSONL with zero writes.
- PASS: Focused Jest tests passed: `src/lib/auth/__tests__/tenant-isolation-probes.test.ts`, `src/lib/auth/__tests__/holding-group-policy.test.ts`, `src/lib/corpus/azure-search.test.ts`, and `src/lib/corpus/retrieval.test.ts`.
- BLOCKED: `ABARVA_AZURE_DATABASE_URL` failed local DNS resolution for the Azure Postgres host.
- BLOCKED: Azure AI Search direct count/query proof could not run because query/admin credentials are missing.
- BLOCKED: Authenticated Lakeshore browser QA could not run because all canonical Lakeshore Clerk personas are banned.

## Rollout Plan

Docs-only audit. Merge after review. No production deploy is required because runtime code and data are unchanged.

## Rollback Plan

Revert this docs-only PR to remove the audit report and release record. No live data rollback is required.

## Audit Evidence

- Readiness report: `docs/build/lakeshore-azure-substrate/LAKESHORE_AZURE_SUBSTRATE_READINESS_REPORT_2026-06-06.md`.
- App health: `https://app.abarva.ai/api/health` returned 200.
- Loader dry-run output embedded in the report.
- Focused Jest output: 4 suites / 67 tests passed.

## Known Gaps

- This release does not unban Clerk users, migrate data to Azure Postgres, add Azure Search keys, or run a live product demo smoke.
- Current app DB proof is against the configured `DATABASE_URL`; that host is not Azure Postgres in local env.
