# 2026-07-25-home-v4-persist-writable-summary — Home V4 persist summary path fallback

## Release ID

`2026-07-25-home-v4-persist-writable-summary`

## Status

`candidate`

## Plain-English Summary

The Home V4 candidate persistence script now writes its operator summary to a writable fallback path when the deployed container filesystem is read-only. This keeps a successful candidate persistence run from being reported as failed only because the script could not write a local summary artifact under the application directory.

## Layer Impact

- `internal-admin`: updates the operator persistence script used by the controlled Home V4 candidate data-build job.
- `client-data-lane`: affects candidate metadata persistence reporting only when an operator explicitly runs the job; it does not approve candidates or change active product rendering.

## Client Applicability

- All clients: applies to future Home V4 candidate persistence jobs.
- Specific clients: none.
- Internal only: operator data-build path.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `scripts/knowledge/persist-home-knowledge-v4-book.mjs`: adds `--summary-path` / `HOME_KNOWLEDGE_V4_PERSIST_SUMMARY_PATH` support and falls back to `/tmp` if the preferred summary path is not writable.

## QA / Validation

- pass: `node --check scripts/knowledge/persist-home-knowledge-v4-book.mjs`
- pass: dry-run fixture execution with summary output written to `/tmp`
- pass: `npx eslint scripts/knowledge/persist-home-knowledge-v4-book.mjs`
- pass: `npm run release:check`
- pass: `git diff --check`

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main workflow, verify the deployed digest and ACA runtime invariant, then rerun the digest-pinned ACA operator job. The operator job may write `status='candidate'` rows only when invoked with `--write-db`; it does not approve, activate, or promote them.

## Deployment Authority

- Repo-owned deploy workflow: required before rerunning this as a deployed-image ACA operator job.
- Shared runtime mutators: ACA operator job only; no shared web traffic changes from this script.
- Approved image digest: captured after main deploy.
- ACA runtime invariant: required before claiming deployed image availability.
- Worker image invariant: not applicable to this script change.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product-visible behavior changes; operator proof required for the data-build run.

## Rollback Plan

Rollback by deploying the prior web image digest. Candidate rows written by an operator run remain inactive unless separately approved; remove or ignore candidate rows if a human review rejects them.

## Audit Evidence

- PR and CI result for this change.
- ACA main deploy workflow for the resulting image digest.
- ACA operator job output folder and execution logs for the follow-up candidate persistence run.

## Known Gaps

This does not approve Home V4 packs, change active Home rendering, or make candidate rows tenant-visible by default.
