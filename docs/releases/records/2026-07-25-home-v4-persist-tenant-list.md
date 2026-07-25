# 2026-07-25-home-v4-persist-tenant-list — Home V4 candidate persist tenant-list filter

## Release ID

`2026-07-25-home-v4-persist-tenant-list`

## Status

`candidate`

## Plain-English Summary

The Home V4 candidate persistence script now accepts the same comma-delimited tenant scope that the generation script already accepts. This keeps a combined generate-and-persist ACA operator job from generating multiple tenant candidates and then filtering them all out before persistence.

## Layer Impact

- `internal-admin`: updates the Home V4 candidate persistence operator script only.
- `client-data-lane`: affects future candidate-row persistence jobs only when an operator explicitly runs the job with `--write-db`; no schema change and no default product rendering change.

## Client Applicability

- All clients: applies to any future Home V4 candidate persistence run that uses a multi-tenant scope.
- Specific clients: none.
- Internal only: operator data-build path.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `scripts/knowledge/persist-home-knowledge-v4-book.mjs`: parses `--tenant` / `HOME_KNOWLEDGE_V4_TENANT` as `all`, one tenant key, or a comma-delimited tenant-key list.

## QA / Validation

- pass: `node --check scripts/knowledge/persist-home-knowledge-v4-book.mjs`
- pass: dry-run fixture execution with a comma-delimited tenant list and no DB writes.
- pass: `npx eslint scripts/knowledge/persist-home-knowledge-v4-book.mjs`
- pending: `npm run release:check`
- pass: `git diff --check`

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main workflow, then rerun the digest-pinned ACA operator job. The operator job may write new `status='candidate'` Home V4 rows only when invoked with `--write-db`; it does not approve or activate those rows.

## Deployment Authority

- Repo-owned deploy workflow: required before rerunning this as a deployed-image ACA operator job.
- Shared runtime mutators: ACA operator job only; no shared web traffic changes from this script.
- Approved image digest: captured after main deploy.
- ACA runtime invariant: required before claiming deployed image availability.
- Worker image invariant: not applicable to this script change.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no product-visible behavior changes; operator proof required for the data-build run.

## Rollback Plan

Rollback by deploying the prior web image digest or running the persistence script with a single tenant key. Candidate rows written by an operator run remain inactive unless separately approved; remove or ignore candidate rows if a human review rejects them.

## Audit Evidence

- PR and CI result for this change.
- ACA main deploy workflow for the resulting image digest.
- ACA operator job output folder and execution logs for the follow-up candidate persistence run.

## Known Gaps

This does not approve Home V4 packs, change active Home rendering, or make candidate rows tenant-visible by default.
