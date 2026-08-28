# 2026-08-28-source-contract-optimization-story-neutrality — Source Contract Optimization Story Neutrality

## Release ID

`2026-08-28-source-contract-optimization-story-neutrality`

## Status

`candidate`

## Plain-English Summary

This change keeps contract optimization advisory language portable across tenants and industries.
Generic scenario labels and service-accountability guidance no longer include fixture-specific buyer
or industry wording unless that wording comes from the contract profile itself.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Source contract optimization story text, markdown brief output, and prompt
  packet content are made tenant-neutral for reusable advisory flows.
- Layer 3 Canonical Model: No change.
- Layer 2 Source Adapters: No change.
- Layer 1 Client Intake: No change.

## Client Applicability

- All clients: Yes, for Source contract optimization advisory story output.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source contract optimization story-pack wording.
- Source contract optimization brief wording.
- Source contract optimization synthetic fixture display label.
- Focused regression coverage for tenant-neutral scenario titles and service-accountability wording.

## QA / Validation

- `npx jest src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts --runInBand`
  passed.
- `npx eslint src/lib/source/contract-optimization/story-pack.ts src/lib/source/contract-optimization/mve-profile.ts src/lib/source/contract-optimization/brief.ts src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts`
  passed.
- `npx tsc --noEmit --pretty false` passed.
- Prettier was run on touched Source contract optimization files.

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and
deploy the next application image. No migration, loader run, feature flag, or data-plane write is
required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared app rollout after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Verified by the repo-owned deploy workflow.
- Worker image invariant: Verified by the repo-owned deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not required for this text-only story-pack correction; existing
  Source optimization screens should continue to be covered by the current demo proof bundle.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6931
- CI / deploy run: To be added.
- Local validation commands listed above.

## Known Gaps

This does not add a new PDF/DOCX renderer or change live contract data. It only tightens the
existing deterministic story output and regression coverage.
