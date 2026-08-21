# 2026-08-20-p3-client-safe-option-loader — P3 Client-Safe Option Loader

## Release ID

`2026-08-20-p3-client-safe-option-loader`

## Status

`candidate`

## Plain-English Summary

The P3 artifact generator can now load a sponsor-approved solution option when
the approval record stores the approver as a client-safe role instead of a raw
user identifier. This preserves public/client-facing disclosure hygiene while
still allowing the governed P3 architecture and design batch to build from the
approved option.

## Layer Impact

- global-control-lane / Layer 4 Products: Strategic Moves generation reads the already-signed P3
  option decision correctly before building the P3 design package.
- global-control-lane / Governance artifact lineage: no data model or migration change. The parser
  normalizes the existing client-safe approval shape into the internal decision
  object used for generation lineage.

## Client Applicability

- All clients: Strategic Moves P3 option approval and P3 design generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/approved-solution-approach.ts`
- `src/lib/programs/__tests__/approved-solution-approach.test.ts`

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/__tests__/approved-solution-approach.test.ts --runInBand` — passed, 4/4 tests.
- `npx eslint src/lib/programs/approved-solution-approach.ts src/lib/programs/__tests__/approved-solution-approach.test.ts` — passed.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow may build
and deploy the resulting image; no migration, data load, registry activation, or
runtime flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: allowed by main branch workflow if this PR merges.
- Shared runtime mutators: none.
- Approved image digest: produced by repo-owned deploy workflow after merge.
- ACA runtime invariant: verify if the workflow deploys a new image.
- Worker image invariant: verify if the workflow deploys a new image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, P3 generation should be retried on a signed-in Move that already has a client-safe option approval.

## Rollback Plan

Revert the PR. Existing signed option approvals remain in the database; reverting
would restore the prior behavior where client-safe role approvals are not loaded
as approved P3 architecture basis.

## Audit Evidence

- Focused Jest and ESLint command output from the PR branch.
- Signed-in P3 generation retry proof should be captured after deployment.

## Known Gaps

This does not change the P3 option approval route, database schema, or generated
artifact quality checks. It only makes the loader accept the existing
client-safe approval shape.
