# 2026-06-07-supabase-sunset-proof-gates — Supabase Sunset Proof Gates

## Release ID

`2026-06-07-supabase-sunset-proof-gates`

## Status

`candidate`

## Plain-English Summary

Adds the required evidence pack for deciding when Supabase can be frozen,
paused, and eventually deleted after Azure-only production cutover. The pack does
not claim Supabase is sunset-ready. It records the gates that remain blocked,
the prior Azure/Supabase evidence that can be reused, and the exact evidence
operators must attach before deletion can be approved. It also adds a production
boot guard that fails fast when the Azure Postgres runtime is accidentally
configured with Supabase env vars or a Supabase-hosted `DATABASE_URL`.

## Layer Impact

- `client-data-lane`: Governs final parity, backup, restore, search/vector, and
  retention proof for client-scoped data before Supabase retirement.
- `global-control-lane`: Adds production startup protection for the Azure
  Postgres runtime so Supabase credentials/hosts cannot silently remain active.
- `internal-admin`: Adds operator/auditor-facing proof documents and command
  patterns for production freeze, backup, soak, pause QA, and deletion approval.

## Client Applicability

- All clients: Yes, because Supabase may still contain shared corpus, context,
  pattern, Source, Move, audit, and app-state data across tenants.
- Specific clients: Golden retrieval proof explicitly names Lakeshore, Meridian,
  Apex, SkyHarbor, and Morgan Street/Northshore.
- Internal only: Yes, the proof pack is an operator/auditor artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/build/supabase-sunset-proof-2026-06-07/01-freeze-proof.md`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/02-final-backup.md`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/03-azure-parity.csv`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/04-search-vector-proof.md`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/05-azure-only-soak.md`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/06-pause-qa.md`.
- Adds `docs/build/supabase-sunset-proof-2026-06-07/07-delete-approval.md`.
- Adds `docs/build/azure-container-apps-cutover-2026-06-07/00-operator-checkpoint.md`.
- Adds `docs/build/azure-container-apps-cutover-2026-06-07/01-runtime-deploy.md`.
- Adds `docs/build/azure-container-apps-cutover-2026-06-07/02-runtime-smoke-and-qa.md`.
- Adds `src/lib/runtime/supabaseBootGuard.ts`.
- Adds `src/lib/runtime/__tests__/supabaseBootGuard.test.ts`.
- Adds `src/instrumentation.ts`.
- Updates `.dockerignore` so Docker/ACR builds include required
  `docs/enterprise-context/templates/*/manifest.json` files imported at build
  time.
- Adds this release record.

## QA / Validation

- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx jest src/lib/runtime/__tests__/supabaseBootGuard.test.ts --runInBand`.
- Pass: `npx eslint src/lib/runtime/supabaseBootGuard.ts src/lib/runtime/__tests__/supabaseBootGuard.test.ts src/instrumentation.ts`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run audit:runtime-supabase-imports:guard` on 2026-06-07. The
  guard allowed exactly one compatibility helper,
  `src/lib/supabase-server.ts`.
- Pass: narrowed `rg` scan over `src/app` and `src/lib`, excluding tests/mocks,
  found no direct runtime Supabase SDK/env usage beyond the compatibility alias
  and comments.
- Pass: targeted `rg` scan of the added proof files for common secret-shaped
  values returned no matches.
- Blocked: `npm run secrets:scan` could not start because `gitleaks` is not
  installed in this environment (`sh: 1: gitleaks: not found`).
- Blocked locally: direct Key Vault secret reads are blocked by private-link
  policy; database proof must run inside Azure Container Apps jobs/runtime.
- Pass: Azure CLI installed and authenticated to `abarva-lab-sub`.
- Pass: command-level boot guard deployed first to `0000049`, then candidate
  image revision `ca-abarva-web-lab-eastus--0000050`; startup log emitted
  `supabase_boot_guard_passed`; candidate revision healthy with 100% traffic.
- Pass: PR #3240 checks completed with `SUCCESS`; GitHub reported
  `MERGEABLE/CLEAN`, but PR #3240 remains draft/unmerged from this agent's
  perspective.
- Pass: ACR candidate image built after `.dockerignore` allowed required
  enterprise-context manifest files:
  `acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix`.
- Pass: Azure Container Apps web runtime and operator jobs were refreshed to the
  candidate image.
- Pass: candidate public Home and `/api/health` returned HTTP 200; health showed
  `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`.
- Pass: Azure-runtime Postgres proof ran from Container Apps revision `0000050`
  and connected to `abarva_control` at private address `10.43.1.4/32`.
- Pass: signed-in QA for Apex CDO and Meridian CDAO returned HTTP 200 across
  Home, Intelligence/Sentinel, Moves, Source, Tower, and Setup/Admin.
- Pass: candidate app log deny-list tail had no Supabase host/env-name matches.
- Pass: Azure runtime Anthropic proof succeeded with `provider=anthropic`,
  `requestedModel=claude-opus-4-7`, `responseModel=claude-opus-4-7`.
- Pass: `job-supa-drain-apply-eus-ih4x7z2` succeeded; tracked tables were at
  parity or Azure-ahead.
- Pass: `job-supa-recon-eus-sl9dz01` succeeded with key parity/Azure-ahead
  rows including `enterprise_context_records=3503/3503`,
  `enterprise_context_facts=38640/38640`, and
  `enterprise_context_chunks=15847/21967`.
- Pass: `job-a24-search-verify-eus-zxesl2t` succeeded with observed Search doc
  counts Apex 6,497; First Capital 400; Lakeshore 6,576; Meridian 4,376;
  Northstar 878; SkyHarbor 3,240.
- Pass: `job-a24-azure-soak-eus-4pn97f4` succeeded as a smoke job: runtime
  smoke `9 pass / 0 fail`, retrieval smoke passed for six tenants.
- Partial: `job-supa-final-eus-6kbty9s` exported 337 tables and wrote
  `supabase-final-backups/supabase-final-20260607-001/manifest.json`; overall
  job failed because the reversible freeze step failed with
  `cannot execute ALTER DATABASE in a read-only transaction`.
- Pass: after #3242/#3244 merged, image
  `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41` was
  built from merged `main` commit `43839a41c71217f61ea165eff3071f70df5f4af7`
  and deployed as `ca-abarva-web-lab-eastus--0000051`.
- Pass: merged-main revision `0000051` is healthy with 100% traffic, boot guard
  passed, public `/` and `/api/health` returned HTTP 200, and `/api/health`
  reported Postgres/direct Postgres green.
- Pass: merged-main signed-in QA passed for Apex CDO and Meridian CDAO across
  Home, Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin.
- Pass: merged-main runtime Anthropic proof succeeded with `claude-opus-4-7`.
- Pass: merged-main app log deny-list tail had no Supabase host/env-name
  matches.
- Pass: merged-main `job-supa-drain-apply-eus-bcvp371` succeeded.
- Pass: merged-main `job-a24-search-verify-eus-v4xv4gp` succeeded with expected
  Search counts.
- Pass: merged-main `job-a24-azure-soak-eus-rtthqal` succeeded as smoke:
  runtime smoke `9 pass / 0 fail`, retrieval smoke passed for six tenants.
- Partial: merged-main `job-supa-final-eus-0k0143f` failed overall after
  emitting table export/checksum progress; final manifest re-read was blocked by
  Container Apps exec 404 during evidence capture.
- Not run: formal production Supabase freeze timestamp/log export, native
  `pg_dump` restore-test, 24-72 hour Azure-only soak, pause QA, and deletion
  approval.
- Production operations performed: Azure Container Apps command-level guard
  revision deployment, candidate image deployment/job refresh, data-plane
  drain/reconcile/search/final-export jobs, and Clerk unban for two demo QA
  users. Supabase was not paused, deleted, or modified beyond the failed
  read-only freeze attempt; DNS was not changed; Vercel was not removed.

## Rollout Plan

Merge to `main` after the Azure Container Apps cutover evidence is complete, or
use the branch image as an operator-controlled cutover candidate. Operators use
the proof pack during the production Azure-only cutover and fill in evidence as
each gate passes.

## Rollback Plan

Revert this PR to remove the proof pack and boot guard source. If an image from
this branch was deployed to Azure Container Apps, roll the app revision back to
the previously active image/revision. Do not re-enable Supabase runtime fallback
as rollback unless explicitly approved.

## Audit Evidence

- PR containing this release record.
- Release Control Gate output.
- Existing referenced evidence:
  - `docs/releases/records/2026-06-06-supabase-to-azure-drain.md`
  - `docs/releases/records/2026-06-06-azure-search-canonical-rebuild.md`
  - `docs/runbooks/supabase-to-azure-decommission.md`

## Known Gaps

- Supabase freeze timestamp has not been recorded; `supa-final` freeze attempt
  failed and must not be treated as a completed freeze.
- Final backup JSONL export/manifest exists, but native `pg_dump` and
  restore-test evidence are not attached.
- Azure parity checksums and several required table families remain unproven.
- Fresh Azure Search verify/retrieval smoke passed for six tenants on merged
  main, but Morgan Street/Northshore golden retrieval is not attached.
- Production Azure-only 24-72 hour soak has not run.
- Pause-before-delete QA has not been run; Supabase was not paused.
- Explicit deletion approval is not recorded; Supabase was not deleted.
- DNS was not changed and Vercel production was not removed.
