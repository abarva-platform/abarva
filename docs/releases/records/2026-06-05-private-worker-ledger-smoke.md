# 2026-06-05-private-worker-ledger-smoke - Private worker ledger smoke

## Release ID

`2026-06-05-private-worker-ledger-smoke`

## Status

`candidate`

## Plain-English Summary

Updates the Azure ingestion smoke harness so the private worker can prove the full audit-only path: synthetic Blob files, Service Bus messages, sensitive-upload audit rows, and durable pilot-ingestion ledger rows.

## Layer Impact

- `client-data-lane`: Adds a repeatable private-runner proof for Meridian/PHS ingestion audit evidence without committing tenant context chunks.
- `internal-admin`: Documents the exact operator smoke sequence and environment toggles for the Azure worker.

## Client Applicability

- All clients: Shared Azure ingestion smoke harness is enhanced.
- Specific clients: Meridian/PHS is the immediate pilot target.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: Pilot-ledger smoke requires `INGESTION_PILOT_LEDGER_ENABLED=true` and `INGESTION_SMOKE_VERIFY_PILOT_LEDGER=true` in the private runner.

## Changes Included

- Updates `src/scripts/azure-ingestion-e2e-smoke.ts` so produced messages can carry client id, uploader id, attestation version, source/template/mapping identity, and original filename metadata.
- Extends smoke verification to check `pilot_ingestion_upload_runs`, `pilot_ingestion_file_manifests`, and `pilot_ingestion_quarantine_cases` when `INGESTION_SMOKE_VERIFY_PILOT_LEDGER=true`.
- Adds `npm run azure:ingestion:e2e-smoke`.
- Updates the Meridian/PHS Azure handoff with exact produce/worker/verify private-runner commands.

## QA / Validation

- PASS: `npx eslint src/scripts/azure-ingestion-e2e-smoke.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED: `./node_modules/.bin/tsc --noEmit --pretty false` in the temporary worktree because the linked local dependency tree is missing `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; PR CI is authoritative for typecheck.
- NOT-RUN: Azure private-network smoke; this PR provides the harness and runbook only, and the smoke must run inside the Azure private runner.

## Rollout Plan

Merge after green CI. No automatic production activation. Run the smoke only from an Azure private runner with the required environment values and RBAC. The smoke remains synthetic and audit-only.

## Rollback Plan

Revert the PR. Existing worker behavior and existing Service Bus/DLQ smoke scripts are unaffected. Any smoke Blob files or audit rows are under a unique `smoke/<run-id>/...` path and can be filtered or removed by run id if needed.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending.
- Private Azure smoke output: Pending.

## Known Gaps

- This does not implement chunk commit, embeddings, or retrieval proof.
- This does not run from the local Mac because the target database/storage/search resources are private-network scoped.
