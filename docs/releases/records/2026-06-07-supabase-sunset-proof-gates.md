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
operators must attach before deletion can be approved.

## Layer Impact

- `client-data-lane`: Governs final parity, backup, restore, search/vector, and
  retention proof for client-scoped data before Supabase retirement.
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
- Blocked: production freeze/log/backup/search/soak evidence collection from
  this shell because Azure CLI, Supabase CLI, `psql`, `pg_dump`, production
  database URLs, and Azure Search env vars are not available.
- Not run: production Supabase freeze, backup, restore-test, Azure-only soak,
  pause QA, and deletion approval. These are intentionally left as blocked
  operator gates in the proof pack.
- No production operations were performed by this change. Supabase was not
  paused, deleted, or modified.

## Rollout Plan

Merge to `main` as a documentation/control artifact. Operators use the proof
pack during the production Azure-only cutover and fill in evidence as each gate
passes. No runtime deploy, migration, or feature flag is required by this change.

## Rollback Plan

Revert this PR to remove the proof pack. Reverting does not affect Azure,
Supabase, backups, indexes, or production runtime because this change is
documentation-only.

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
