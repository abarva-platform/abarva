# 2026-06-05-worker-pilot-ledger-handoff - Worker pilot ledger handoff

## Release ID

`2026-06-05-worker-pilot-ledger-handoff`

## Status

`candidate`

## Plain-English Summary

Wires the Azure ingestion worker to the durable pilot ingestion ledger when explicitly enabled. Admin bulk uploads now queue the metadata the worker needs to prove who uploaded the file, which client it belongs to, which attestation was accepted, and which template/mapping route applies.

## Layer Impact

- `client-data-lane`: Adds auditable worker-side ledger evidence for Blob and Service Bus ingestion outcomes without committing parsed facts to tenant context tables.
- `internal-admin`: Extends the Admin bulk upload queue handoff metadata so private Azure workers can write governed upload-run and file-manifest rows.

## Client Applicability

- All clients: Shared ingestion worker and Admin bulk-upload metadata contract gain the ledger handoff.
- Specific clients: Meridian/PHS is the immediate pilot path.
- Internal only: Yes, this is Admin/private data-plane infrastructure.
- Public/demo only: No.
- Feature flag: Worker ledger writing is gated by `INGESTION_PILOT_LEDGER_ENABLED=true`.

## Changes Included

- Adds `src/lib/ingestion/pilot-ledger-writer.ts` to convert accepted/quarantined worker outcomes into durable pilot-ingestion ledger writes.
- Updates `src/lib/ingestion/azure-landing-zone-consumer.ts` so the optional pilot ledger writer receives both the audit-only plan and the canonical worker message.
- Updates `src/scripts/azure-context-ingestion-worker.ts` to wire the durable ledger writer only when `INGESTION_PILOT_LEDGER_ENABLED=true`.
- Updates `src/lib/context-ingestion/bulk-context-upload.ts` so queued Admin messages include client id, uploader id, attestation version, template/mapping identity, source system, and original filename.
- Updates the Meridian/PHS Azure private data-plane handoff document with the new truth state.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts src/lib/ingestion/__tests__/pilot-ledger-writer.test.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts --runInBand`
- PASS: `npx eslint src/lib/ingestion/azure-landing-zone-consumer.ts src/lib/ingestion/pilot-ledger-writer.ts src/scripts/azure-context-ingestion-worker.ts src/lib/context-ingestion/bulk-context-upload.ts src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts src/lib/ingestion/__tests__/pilot-ledger-writer.test.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED: `./node_modules/.bin/tsc --noEmit --pretty false` in the temporary worktree because the linked local dependency tree is missing `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. The touched test typings are clean; PR CI must be used as the authoritative typecheck.

## Rollout Plan

Merge to `main` after CI is green. Deploy the app/runtime normally. Enable `INGESTION_PILOT_LEDGER_ENABLED=true` only in the Azure private worker after `DATABASE_URL`, Service Bus, Blob, and worker identity permissions are confirmed. Run one accepted-file smoke and one quarantine-file smoke from inside the private network before claiming live async ingestion.

## Rollback Plan

Unset `INGESTION_PILOT_LEDGER_ENABLED` to return the worker to sensitive-audit-only behavior. If needed, revert the PR and redeploy. Service Bus messages remain replayable; pilot ledger rows are additive audit evidence and do not commit tenant context chunks.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending.
- Production deployment: Pending merge/deploy approval.
- Local focused tests and lint passed as listed above.
- Azure private-network worker smoke: Pending.

## Known Gaps

- Worker default mode remains `audit_only`; this slice does not commit chunks or embeddings.
- Live Azure proof is still required from a private-network worker before the async path is demo/pilot-ready.
- Human preview approval, commit adapter, embedding handoff, and retrieval smoke remain separate cutover steps.
