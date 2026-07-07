# 2026-06-04-lakeshore-same-day-execution — Lakeshore Same-Day Execution

## Release ID

`2026-06-04-lakeshore-same-day-execution`

## Status

`candidate`

## Plain-English Summary

Turns the Lakeshore activation path from scattered manual steps into a controlled same-day execution lane. The tenant bootstrap script now recognizes Lakeshore, scopes persona provisioning to Lakeshore users, and routes Lakeshore setup-data loading through the governed Lakeshore loader rehearsal instead of an Apex-specific setup pack. The Azure private data-plane templates also fix the two live deployment blockers found during inspection.

## Layer Impact

- `client-data-lane`: Lakeshore tenant onboarding and governed context loading now have an executable bootstrap path that writes tenant-scoped chunks when run in apply mode.
- `internal-admin`: Operators get a safer scoped bootstrap command for Lakeshore demo personas and load execution.
- `global-control-lane`: Azure Bicep fixes make the reusable client-tenant private data-plane deployment more reliable for single-client pilot tenants.

## Client Applicability

- All clients: Azure template fixes apply to future client-tenant private data-plane deployments.
- Specific clients: Lakeshore Holdings bootstrap and governed load path.
- Internal only: The bootstrap and deployment scripts are operator-run assets.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/tenant-bootstrap.ts`
- `scripts/verify-canonical-tenants.ts`
- `infra/azure/immutable-audit-log.bicep`
- `infra/azure/postgres-foundation.bicep`
- `src/app/(maestro)/admin/data-trust/page.tsx`
- `src/config/tenants/CANONICAL_TENANTS.ts`
- `src/lib/admin/admin-tenant.ts`
- `src/lib/auth/canonical-auth-roster.ts`
- `src/lib/intelligence/ask/tenant-fact-fingerprint.ts`
- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/scripts/embed-pending-chunks.ts`
- `docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-commit-latest.json`
- `docs/releases/records/2026-06-04-lakeshore-same-day-execution.md`

## QA / Validation

- PASS: `npm run lakeshore:synthetic-context:verify` verified the existing Lakeshore package: 18 CSV files, 1,329 structured rows, 21 documents, and the offline review ZIP.
- PASS: `npm run lakeshore:agent-grounding:verify` verified 10 Lakeshore prompt scenarios against the loaded manifest/templates/documents.
- PASS: `npm run lakeshore:corpus-map:check` confirmed the Lakeshore corpus coverage map was current.
- PASS with warnings: `npm run lakeshore:live-activation:verify` returned `ready_with_warnings` with 55/63 ready checks, 0 blocking checks, and warnings on environment probes.
- PASS: `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --apply --skip-ban` created/updated the Lakeshore `clients` row and the CIO/CFO persona memberships.
- PASS: `npx tsx src/scripts/lakeshore/rehearse-governed-load.ts --mode=commit --client-id=f2ef0b6a-9f20-4d3d-9dd9-8f8ec01f2a61 --out=docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-commit-latest.json` committed the governed Lakeshore load. The script warned that `ABARVA_AZURE_DATABASE_URL` was stale/unresolvable and fell back to `DATABASE_URL`.
- PASS: `EMBEDDING_MAX_BATCHES=20 npm run embed:pending-chunks -- --tenant lakeshore` embedded 1,329 Lakeshore context chunks with 0 failures in Postgres. Pinecone was enabled but reported 0 upserted vectors, so Pinecone retrieval is not claimed as proven.
- PASS: DB probe found 1,329 embedded Lakeshore `enterprise_context_chunks` across 5 source segments and 0 Apex/Meridian/SkyHarbor term bleed in Lakeshore chunks.
- PASS: Browser proof signed in as `cio@lakeshore-holdings.example.com`, completed Responsible AI acknowledgment/training, and showed an authenticated Lakeshore session for Meera Rao.
- PASS: Browser proof for `/admin/data-trust` showed `Admin · Data Trust · Lakeshore Holdings`, 5/14 loaded segments, and 1,329 records/chunks after the live context fallback.
- PASS: Browser proof for `/strategic-moves`, `/source`, and `/tower` showed the active client as Lakeshore Holdings with no Apex or Meridian visible in the captured page text.
- PARTIAL: Browser proof for `/intelligence` showed the static Intelligence brief honestly reports the separate seeded Intelligence corpus is not yet seeded; `/intelligence/ask?mode=tenant_grounded` is tenant-pinned and no longer denies ingestion, but answer prose still needs stronger citation of the loaded Lakeshore rows.
- PASS: `npm run test:nav` passed 26 tests.
- PASS: `npm run test:behaviors` passed 103 tests.
- PASS: `npx jest src/lib/admin/__tests__/admin-tenant.test.ts src/lib/intelligence/ask/__tests__/tenant-key-resolution.test.ts --runInBand` passed 15 focused tests.
- PASS: `npm run db:verify:canonical-tenants` verified 6 canonical tenants, including Lakeshore Holdings.
- PASS: `npx tsc --noEmit --pretty false` completed with no TypeScript errors.
- PASS: `git diff --check` completed with no whitespace errors.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed release-control and pilot data loader gates.
- PASS: `az bicep build --file infra/azure/immutable-audit-log.bicep`, `az bicep build --file infra/azure/postgres-foundation.bicep`, and `az bicep build --file infra/azure/client-tenant-foundation.bicep` passed.
- PASS/PARTIAL: `scripts/lakeshore/deploy-private-data-plane.sh what-if` completed with an ephemeral password value. The what-if predicts creation of the missing DB-to-data VNet peering and an audit lifecycle management policy filtered to `blockBlob`.
- FAIL/BLOCKED: `npm run db:migrate:dry` failed because `ABARVA_AZURE_DATABASE_URL` points to unresolved host `pg-abarva-context-lab-001.postgres.database.azure.com`.
- BLOCKED: Azure deployment rerun is blocked because this principal cannot read Key Vault secret metadata/value for `kvlakeshorepilotlsh001`, and no `POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD` is present in the environment.

## Rollout Plan

Merge to `main`, then keep the committed Lakeshore shared-plane data and persona setup in place for the same-day demo. Re-run the Azure private data-plane deployment only from an approved operator environment that has the existing Postgres administrator password or Key Vault secret-read rights.

## Rollback Plan

Revert the PR to restore the prior bootstrap, retrieval, Data Trust, and Bicep behavior. If the Lakeshore shared-plane data must be rolled back, delete only rows with `tenant_key = 'lakeshore'` and the matching Lakeshore upload IDs after exporting the ingestion evidence.

## Audit Evidence

- `docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-commit-latest.json`.
- Local command output from Lakeshore persona provisioning, governed load commit, embedding run, DB probes, tests, and browser checks.
- Azure deployment operation output for the failed private data-plane deployment and current RBAC/password blocker.
- Release-control output.
- PR URL and CI checks after push.

## Known Gaps

- The shared-plane Lakeshore load and Postgres embeddings are live; Pinecone upsert/retrieval is not proven because the embedding job logged 0 vectors upserted.
- `/admin/data-trust` now reflects live context chunks when setup inventory tables are empty, but the separate setup inventory tables are not populated for Lakeshore.
- The static `/intelligence` brief still reports the separate seeded Intelligence corpus as unseeded. Tenant Ask is safer and alias-aware, but the answer prose remains less citation-rich than the loaded evidence supports.
- `/strategic-moves` is tenant-safe but empty because no Lakeshore Moves/program rows were committed in this slice.
- `/source` and `/tower` are tenant-safe and render Lakeshore, but some Source copy still describes missing `vendor_contracts`/`it_financials` because those surfaces read their own substrate, not the committed context chunks.
- Azure private data-plane rerun is blocked on Key Vault RBAC/password access from the current principal.
