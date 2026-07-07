# 2026-06-07-context-corpus-audit-azure-only-guard — Azure-only DB guard + provider audit

## Release ID

`2026-06-07-context-corpus-audit-azure-only-guard`

## Status

`candidate`

## Plain-English Summary

Executes the Context/Corpus → Agent Visibility audit's preflight and provider
checks under the Azure-only / Anthropic-only mandate. Adds a fail-closed
Azure-only database-target guard (so no audit or data op can silently use the
decommissioned Supabase store), a provider regression guard that records the P0
that Sentinel Ask synthesis still runs on OpenAI (Nexus correctly uses Claude),
and the audit report. No production reasoning path or retrieval file is changed
in this PR (the retrieval grounding fix already shipped in #3238); the provider
migration is flagged as the top fix to be done with signed-in validation.

## Layer Impact

- Lane: `global-control-lane` (guard + audit tooling apply to all clients) with
  `internal-admin` audit documentation.
- The guard is a preflight/CI utility; the provider test is a regression guard.
  No runtime behavior, schema, or data is changed.

## Client Applicability

- All clients: the Azure-only guard and provider regression guard are global.
- Not applicable: no per-client data change; no load performed.

## Changes Included

- `scripts/data-plane/assert-azure-db-target.mjs` + `npm run db:assert-azure-target`:
  fail-closed Azure-only DB-target guard — redacted host classification only,
  fails if `DATABASE_URL` is Supabase, fails if no Azure target, fails on any
  Supabase fallback.
- `src/lib/intelligence/ask/__tests__/provider-audit.test.ts`: asserts Nexus uses
  the audited Anthropic Claude client; tracks the Sentinel-Ask-on-OpenAI P0 via
  `it.failing`.
- `docs/build/context-corpus-agent-visibility-audit-2026-06-07.md`: the audit
  report (DB-target proof, provider P0, retrieval-path state, Azure operator
  evidence, failed-gate root causes, credential-blocked runbook).
- **Failed-gate fixes** (root-caused from operator logs, fixed with pure helpers
  - unit tests):
  * `scripts/data-plane/drain-supabase-to-azure.ts` + `scripts/data-plane/upsert-sql.ts`:
    merge `clients` on the natural key `name` (the `clients_name_key` collision)
    and never rewrite the primary key on conflict. Fixes `job-supa-drain-apply-eus`.
  * `src/scripts/azure-ai-search-backfill.ts` + `src/lib/azure-search/index-results.ts`:
    surface Azure Search per-document failures (the API returns 200 even when
    docs are rejected) and add a bounded verify poll for count eventual
    consistency. Fixes the `job-a24-search-verify-eus` off-by-7.
  * Tests: `scripts/data-plane/__tests__/upsert-sql.test.ts`,
    `src/lib/azure-search/__tests__/index-results.test.ts`.

## QA / Validation

- `node scripts/data-plane/assert-azure-db-target.mjs` — FAILs closed in this env
  (no Azure target) and on Supabase hosts; PASSes only for Azure hosts (verified
  with throwaway hosts). Pass/fail behavior confirmed.
- `npx jest src/lib/intelligence/ask/__tests__/provider-audit.test.ts` — passed
  (Nexus=Claude; P0 tracked).
- `npx eslint` on changed files — passed. `npm run release:check` — passed.
- `npx jest src/lib/azure-search scripts/data-plane/__tests__/upsert-sql.test.ts` —
  passed (gate-fix helpers: clients merge-on-name without PK rewrite; Azure Search
  per-doc failure detection + count-mismatch). `tsc --noEmit` — passed.
- Blocked (no creds in this env): live Supabase is intentionally not queried
  (decommissioned); Vercel prod env check and signed-in golden QA require a
  Clerk + Vercel environment — documented in the audit report with the runbook.

## Rollout Plan

Merge via PR. The guard and test take effect immediately in CI/local; no runtime
deploy dependency. The flagged P0 (Sentinel/Source synthesis on OpenAI) is a
follow-up fix requiring signed-in validation before production.

## Rollback Plan

Revert the PR. No data or schema change; the guard and test are additive.

## Audit Evidence

- Guard output (redacted) and provider-audit jest output on the branch.
- Azure operator proof (`job-abarva-private-operator-eus`, 2026-06-06 22:44 UTC)
  cited in the audit report.

## Known Gaps

Full per-client × per-store completeness/depth matrices and live signed-in
golden-QA were not produced from this environment (no `ABARVA_AZURE_DATABASE_URL`,
no Vercel, no Clerk). They must run from the Azure private operator runner and a
Clerk-authenticated env per the runbook in the audit report. The Sentinel/Source
OpenAI→Anthropic migration is flagged P0 and tracked but not performed here
(changing the primary reasoning path requires signed-in validation).
