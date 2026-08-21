# 2026-08-21-p3-option-decision-hash-loader — P3 Option Decision Hash Loader

## Release ID

`2026-08-21-p3-option-decision-hash-loader`

## Status

`candidate`

## Plain-English Summary

The P3 artifact generator can now load a signed solution-option approval whose
client-facing context uses a role label while the audit lineage keeps the
decision hash from the original approval packet. This keeps generated artifacts
free of raw actor identifiers without discarding the signed approval hash needed
for architecture lineage.

## Layer Impact

- global-control-lane / Layer 4 Products: Strategic Moves P3 generation reads
  an existing signed option approval as the basis for the P3 design package.
- global-control-lane / Governance artifact lineage: no schema, migration, or
  data-load change. The loader validates the stored hash against the signed
  lineage packet and keeps the client-safe role label for generated context.

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

- PASS: `npx jest --runTestsByPath src/lib/programs/__tests__/approved-solution-approach.test.ts --runInBand` — 4/4 tests passed. Jest reported pre-existing duplicate manual mock warnings.
- PASS: `npx eslint src/lib/programs/approved-solution-approach.ts src/lib/programs/__tests__/approved-solution-approach.test.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- FAIL: `npm run release:check` initially failed because this record used planned validation wording instead of explicit status.
- PASS: `npm run release:check` after updating the validation statuses in this record.

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
- Live signed-in proof required: yes, retry P3 generation on a signed-in Move
  that already has a signed solution-option approval.

## Rollback Plan

Revert the PR. Existing signed option approvals remain in the database; reverting
would restore the prior behavior where client-safe context and audit-lineage
hashes are treated as incompatible.

## Audit Evidence

- Focused Jest, TypeScript, ESLint, and release gate output from the PR branch.
- Signed-in P3 generation retry proof should be captured after deployment.

## Known Gaps

This does not change the P3 option approval route, database schema, or generated
artifact quality checks. It only aligns the loader with the already-signed
approval packet shape used by the product.
