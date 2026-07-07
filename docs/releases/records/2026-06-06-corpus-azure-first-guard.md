# 2026-06-06-corpus-azure-first-guard — Corpus Azure-First Database Guard

## Release ID

`2026-06-06-corpus-azure-first-guard`

## Status

`candidate`

## Plain-English Summary

Changes the corpus database helper so corpus imports and authoring use the Azure private Postgres URL when it is configured. If only a Supabase `DATABASE_URL` is present, the helper now fails closed unless an operator explicitly sets `ALLOW_LEGACY_SUPABASE_CORPUS=1`.

## Layer Impact

- `client-data-lane`: Protects corpus data loads from silently writing to the legacy Supabase pooler when Azure Postgres is configured as the private data-plane target.
- `internal-admin`: Affects internal corpus import and authoring scripts that call `src/lib/corpus/db.ts`.

## Client Applicability

- All clients: Applies to shared corpus import/authoring paths.
- Specific clients: None hard-coded.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: `ALLOW_LEGACY_SUPABASE_CORPUS=1` is the explicit legacy escape hatch.

## Changes Included

- Updates `src/lib/corpus/db.ts` to prefer `ABARVA_AZURE_DATABASE_URL`.
- Adds a fail-closed guard for Supabase `DATABASE_URL` usage.
- Adds unit coverage for Azure-first, legacy opt-in, and local fallback behavior.
- Adds a repo-native Azure private operator runner parameter file and runbook for Cursor, Claude Code, and Codex handoff.

## QA / Validation

- Blocked initially: `npx jest src/lib/corpus/__tests__/db.test.ts --runInBand` could not start in the clean worktree until dependencies were available because `jest.config.ts` imports `next/jest`.
- Pass: `npx jest src/lib/corpus/__tests__/db.test.ts --runInBand` after linking the existing local dependency tree into the clean worktree.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: Azure private operator proof created separately on 2026-06-06 showed the Container Apps private runner can resolve `pg-abarva-context-lab-001.postgres.database.azure.com` to `10.43.1.4` and connect to `abarva_control`.
- Pass: `az bicep build-params --file infra/azure/parameters/private-operator.lab.bicepparam --outfile /tmp/private-operator.lab.json`.

## Rollout Plan

Merge to `main`. Future corpus imports in environments with `ABARVA_AZURE_DATABASE_URL` will use Azure private Postgres. Operators who intentionally need a legacy Supabase read/write window must set `ALLOW_LEGACY_SUPABASE_CORPUS=1`. Cursor, Claude Code, and Codex should use `docs/runbooks/azure-private-operator-runner.md` for private Azure Postgres diagnostics and approved private-plane jobs.

## Rollback Plan

Revert this PR to return corpus data-layer resolution to `DATABASE_URL` only. No migrations or data changes are included.

## Audit Evidence

- PR containing this release record.
- Unit test output.
- Release Control Gate output.
- Azure Container Apps job `job-abarva-private-operator-eus` execution `job-abarva-private-operator-eus-xdaykbk`.
- `infra/azure/parameters/private-operator.lab.bicepparam`.
- `docs/runbooks/azure-private-operator-runner.md`.

## Known Gaps

- This does not move existing `corpus_patterns` rows from Supabase to Azure. It prevents future accidental writes and sets the correct target for a controlled drain/copy.
