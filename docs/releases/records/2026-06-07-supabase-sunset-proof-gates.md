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
- Adds `src/instrumentation.ts`.
- Adds this release record.

## QA / Validation

- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
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
- Pass: command-level boot guard deployed to
  `ca-abarva-web-lab-eastus--0000049`; startup log emitted
  `supabase_boot_guard_passed`; revision healthy with 100% traffic.
- Pass: unauthenticated Azure Home smoke returned HTTP 200.
- Pass: Azure-runtime Postgres proof ran from Container Apps revision `0000049`
  and connected to `abarva_control` at private address `10.43.1.4/32`.
- Fail: `/api/health` returned HTTP 503 (`postgres:false`,
  `direct_postgres:true`).
- Fail: signed-in QA passed only Intelligence/Sentinel; Home, Moves, Source,
  Tower, and Setup/Admin returned HTTP 500 for Apex CDO and Meridian CDAO.
- Fail: app log deny-list found `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` in old-image runtime error messages.
- Blocked: ACR remote build failed because the operator identity lacks
  `Microsoft.ContainerRegistry/registries/listBuildSourceUploadUrl/action`.
- Blocked: Container Apps job starts failed because the operator identity lacks
  `Microsoft.App/jobs/start/action`.
- Blocked: final full Supabase backup could not run; active Azure runtime can
  reach the source Key Vault secret but does not include `pg_dump`.
- Blocked: direct runtime Anthropic proof attempt hit Container Apps exec
  throttling (`429 Too Many Requests`, retry-after 600s) after earlier exec
  probes succeeded.
- Not run: formal production Supabase freeze, final backup, restore-test,
  24-72 hour Azure-only soak, pause QA, and deletion approval. These are
  intentionally left as blocked operator gates in the proof pack.
- Production operations performed: Azure Container Apps command-level guard
  revision deployment and Clerk unban for two demo QA users. Supabase was not
  paused, deleted, or modified; DNS was not changed; Vercel was not removed.

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

- Supabase freeze timestamp has not been recorded.
- Final backup, checksum, and restore-test evidence are not attached.
- Azure parity checksums and several required table families remain unproven.
- Fresh Azure Search rebuild and production golden retrieval across the named
  tenant set are not attached.
- Production Azure-only 24-72 hour soak is blocked by signed-in QA failures.
- Pause-before-delete QA has not been run; Supabase was not paused.
- Explicit deletion approval is not recorded; Supabase was not deleted.
- DNS was not changed and Vercel production was not removed.
