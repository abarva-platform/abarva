# 2026-06-02-contract-redline-brief — Contract Redline Brief

## Release ID

`2026-06-02-contract-redline-brief`

## Status

`candidate`

## Plain-English Summary

Adds a counsel-review draft of AbarVa's standard contract redline brief covering the eight non-negotiable client-paper clauses, fallback positions, sleeper clauses, and NDA-specific checks before signing pilots or production agreements.

## Layer Impact

Internal admin and legal readiness: adds a reusable legal operations artifact under `docs/legal/`. No product UI, runtime code, data-plane behavior, schema, migration, or deployment configuration changes.

## Client Applicability

- All clients: Future client negotiations benefit from a consistent redline posture.
- Specific clients: None.
- Internal only: The brief is an AbarVa internal/counsel-review artifact.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/legal/contract-redline-brief.md`

## QA / Validation

- `git diff --check --cached` — pass.
- `npm run secrets:staged` — pass; no leaks found in the staged diff.
- `npm run release:check -- --base origin/main --head HEAD` — pass; gate reported no release-relevant files changed for this docs/legal-only slice.

## Rollout Plan

Merge to `main`. The document becomes available in the repository legal packet for counsel review and future contract negotiation preparation.

## Rollback Plan

Revert the PR to remove the redline brief and this release record. No migration, runtime, tenant, or deployment rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Local validation output from the QA / Validation commands.
- Tracker update for T015.

## Known Gaps

This is not lawyer-approved final contract language. T016 remains separate and should track counsel pre-blessing before the brief is used as final negotiation authority.
