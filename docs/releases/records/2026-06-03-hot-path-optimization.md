# 2026-06-03-hot-path-optimization - Hot Path Optimization

## Release ID

`2026-06-03-hot-path-optimization`

## Status

`candidate`

## Plain-English Summary

Adds the follow-through runbook for pressure-test row T158. The new runbook
defines how to rank the top three hot paths found by live load tests, classify
the likely bottleneck, assign owners, choose an optimization pattern, and retain
before/after evidence before claiming the row is complete.

## Layer Impact

- Release lane: `internal-admin`
- Layer impact: operational performance runbook and verifier only. No runtime
  behavior, database schema, production configuration, or customer UI changes.

## Client Applicability

- All clients: indirect benefit through stronger performance discipline.
- Specific clients: none.
- Internal only: AbarVa operations and engineering.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/runbooks/hot-path-optimization.md`
- `scripts/load/verify-hot-path-optimization.mjs`
- `package.json` script `load:hot-path-optimization:verify`
- This release record.

## QA / Validation

- Pass: `npm run load:hot-path-optimization:verify`
- Pass: `node --check scripts/load/verify-hot-path-optimization.mjs`
- Pass: `git diff --check`
- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR flow. No runtime rollout is required. Operators
can use the runbook after the next live pressure-test cycle to rank and resolve
the top three hot paths.

## Rollback Plan

Revert the PR if the hot-path workflow is replaced. There are no migrations,
runtime code paths, production secrets, or customer-facing surfaces in this
release.

## Audit Evidence

- Backlog row: `T158`.
- PR URL: pending.
- Local verifier output from `npm run load:hot-path-optimization:verify`.
- Future live pressure-test evidence packets and before/after optimization
  records.

## Known Gaps

T158 remains `In progress` until live pressure-test evidence identifies the top
three hot paths and each has before/after optimization evidence or an accepted
risk disposition.
