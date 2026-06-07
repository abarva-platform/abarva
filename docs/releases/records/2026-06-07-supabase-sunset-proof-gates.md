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
- Pending: ACR remote image build and Azure Container Apps deployment of the
  boot guard.
- Pending: Azure runtime smoke, signed-in QA, Azure Search rebuild/verification,
  Anthropic reasoning proof, zero Supabase runtime calls proof, final backup,
  and pause/delete approval packet completion.
- Blocked locally: direct Key Vault secret reads are blocked by private-link
  policy; database proof must run inside Azure Container Apps jobs/runtime.
- Not run: production Supabase freeze, backup, restore-test, Azure-only soak,
  pause QA, and deletion approval. These are intentionally left as blocked
  operator gates in the proof pack.
- No production operations were performed by this change. Supabase was not
  paused, deleted, or modified.

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
- Production golden retrieval across the named tenant set is not attached.
- Production Azure-only 24-72 hour soak is not attached.
- Pause-before-delete QA has not been run.
- Explicit deletion approval is not recorded.
