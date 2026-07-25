# 2026-07-25-home-v4-inspect-full-flag — read-only `--full` flag on the V4 candidate inspector

## Release ID

`2026-07-25-home-v4-inspect-full-flag`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

`scripts/knowledge/inspect-home-knowledge-v4-candidate.mjs` is a read-only diagnostic that prints a
persisted V4 candidate row's quality report and metadata, for use via the governed ACA operator job
(this environment has no direct route to the private-VNet database). It never selected
`render_pack` — the actual generated narrative content — because it was built to debug quality
findings, not to read content. A real qualitative content review of a candidate (required before
approving anything, per standing policy) needs the actual narrative. Adds an opt-in `--full` flag
that additionally selects `render_pack`. No behavior changes for existing callers; the flag is
additive and off by default.

## Layer Impact

- `internal-admin` lane: operator diagnostic script only, invoked solely via the governed ACA
  operator job for read-only inspection. No schema, route, or client-visible change, and no write
  path — the added column is only ever read, never mutated by this script.

## Client Applicability

- Internal only. This is a CLI diagnostic invoked via a governed operator job, not a product surface.

## Changes Included

- `scripts/knowledge/inspect-home-knowledge-v4-candidate.mjs`: added `--full` /
  `HOME_KNOWLEDGE_V4_INSPECT_FULL=true` flag; when set, the query additionally selects `render_pack`.

## QA / Validation

- `pass` — `node --check` on the changed file.
- `pass` — `npx eslint` on the changed file, zero findings.
- No database is reachable from this environment to run the script directly; correctness of the
  added column selection was verified by direct comparison against the table's real column list
  (`supabase/migrations/20260721183000_home_knowledge_pack_v2.sql`).

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds the new image.
2. Run via the governed ACA operator job (read-only inspection — permitted break-glass use per
   `docs/ops/aca-data-build-job-rule.md`) with `--full` against the three named V4 candidate IDs, to
   support the qualitative acceptance review this was built for.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none — this script performs no writes.
- Live signed-in proof required: no — CLI diagnostic, not a rendered surface.

## Rollback Plan

Revert the PR. The flag is additive; no existing call site is affected either way.

## Audit Evidence

- This PR's diff and CI run.
- The governed operator-job execution log from the `--full` inspection run, once performed.

## Known Gaps

None known. This script remains read-only in every mode (with or without `--full`) and prints to
stdout only — it does not persist, cache, or forward the narrative content it reads anywhere else,
so it carries no new data-handling risk beyond what the existing quality-report-only mode already
had.
