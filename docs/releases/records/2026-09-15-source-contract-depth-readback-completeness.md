# 2026-09-15 — Source Contract Depth Readback Completeness

## Release ID

`2026-09-15-source-contract-depth-readback-completeness`

## Status

`candidate`

## Plain-English Summary

Corrects the contract-depth Layer 3 readback contract so it counts the claim-provenance rows that the loader already writes for each optimization opportunity. This prevents a valid dense package from being rejected, or reported ambiguously, because the proof query omitted one populated canonical table.

## Layer Impact

`client-data-lane`; Layer 3 load verification only.

- L3: the package loader's transactional readback now verifies opportunity claims alongside opportunity evidence and calculation rows.
- L4: no product projection or calculation logic changes; the fix enables the approved depth package to complete its existing downstream projection phase.

## Client Applicability

- All clients: the loader behavior is reusable for governed contract-depth packages.
- Specific clients: none.
- Internal only: operator load and proof paths.
- Public/demo only: synthetic validation only; no client-identifying data is included.
- Feature flag: none.

## Changes Included

- Contract-depth Layer 3 readback query now counts `source.opportunity_claim`.
- Focused regression assertion for the readback contract.
- This release record.

## QA / Validation

- Focused contract-depth loader suite: passed, 19 tests.
- ESLint on touched loader and test files: passed.
- TypeScript no-emit check: passed.
- Azure rerun of the affected package is required after merge and deployment.

## Rollout Plan

Merge through protected `main`, deploy the exact merge SHA through the repo-owned ACA workflow, verify the digest-pinned runtime invariant, then rerun the approved package through the ACA Layer 3 and Layer 4 operator Jobs with scoped dataset and run identifiers. Completion requires package quality gates and independent row-count readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- Approved image digest: captured from the ACA workflow after merge
- ACA runtime invariant: template image and 100%-traffic revision image must match the approved digest
- Worker image invariant: the operator Job must use the same approved digest
- Feature/env flag update path: none
- Live signed-in proof required: affected Source Contract 360 tabs after the data package rerun

## Rollback Plan

Revert through a new PR and redeploy the prior approved digest. The code change is verification-only and does not require destructive data rollback. Any package correction remains scoped to its dataset version and must use a governed ACA Job with independent readback.

## Audit Evidence

- PR and merge SHA
- Focused test, typecheck, lint, and release-check output
- ACA deploy run, digest, revision, traffic, and runtime-invariant proof
- Layer 3 and Layer 4 package Job proof bundles and readbacks
- Signed-in Source tab-by-tab proof after the rerun

## Known Gaps

- This fixes verification of rows already written; it does not create missing source evidence.
- Full portfolio identity reconciliation and archetype coverage remain separate data work.
- Report/email delivery is outside this release.
