# 2026-08-08 Source Golden Evidence Tower Subject Hotfix

## Release ID

`2026-08-08-source-golden-evidence-tower-subject-hotfix`

## Status

`candidate`

## Plain-English Summary

The golden contract evidence loader now writes Tower tracked-subject rows with
the selected contract ID from the verified contract register row. This prevents
the operator load from attempting to create a Tower subject with a null subject
reference.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: No change.
- Source adapters: No change to the source package shape.
- Canonical model: The loader preserves the contract ID when writing Tower
  tracked-subject evidence for contract optimization claims.
- Products: No direct UI change; Contract 360 and Tower can read the loaded
  claim only after the operator job succeeds.

## Client Applicability

- All clients: Loader behavior is tenant-agnostic.
- Specific clients: None.
- Internal only: Operator load path.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Script: `scripts/source/load-source-golden-contract-evidence.mjs`

## QA / Validation

- `npm run source:contract-evidence:golden:plan` passed.
- `npx eslint scripts/source/load-source-golden-contract-evidence.mjs` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow
build and deploy the digest-pinned web image, then rerun the private operator
script `source:contract-evidence:golden:apply`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Determined by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required before rerunning the operator job.
- Worker image invariant: Required by the ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after the data job succeeds.

## Rollback Plan

Revert the PR. No independent schema rollback is needed because the change only
corrects the tracked-subject key used by the data loader.

## Audit Evidence

- CI release-record check.
- ACA deploy workflow after merge.
- Private operator load output after rerun.

## Known Gaps

The data load is intentionally separate and must be proven by the private
operator job after this hotfix is deployed.
