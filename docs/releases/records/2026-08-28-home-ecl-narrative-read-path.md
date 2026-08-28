# 2026-08-28-home-ecl-narrative-read-path — Home ECL Narrative Read Path

## Release ID

`2026-08-28-home-ecl-narrative-read-path`

## Status

`candidate`

## Plain-English Summary

Home's ECL preview now reads published narrative claim rows from the governed projection layer
instead of synthesizing fallback chapter claims at request time. If the projection has no published
claim rows, the ECL preview refuses rather than silently creating substitute narrative.

## Layer Impact

- `global-control-lane`: changes shared Home ECL preview read behavior.
- Layer 4 Products: Home preview now builds chapter claim arrays from `chapter_claim` projection rows.
- Layer 4 Products: Published narrative claim rows are no longer flattened into generic context items.
- Layer 4 Products: The deterministic signal packet remains available for estate counts and visual
  datasets, but it no longer creates substitute Home chapter claims.

## Client Applicability

- All clients: yes, for Home ECL preview behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home provider selection and ECL serving defaults apply.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`

## QA / Validation

- PASS — `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand`

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deployment workflow.
No schema migration or data reload is required for this code path. Existing published projection rows
are consumed after deployment.

## Deployment Authority

- Repo-owned deploy workflow: required for live app rollout.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the main deploy workflow.
- ACA runtime invariant: required before claiming live behavior.
- Worker image invariant: required by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: Home preview should render published claim text after deployment.

## Rollback Plan

Revert the PR. If reverted, Home may return to request-time fallback synthesis for ECL preview rows.
No database rollback is required.

## Audit Evidence

- PR URL and CI run after publication.
- ACA deployment evidence after merge.
- Signed-in Home preview screenshot after deployment.

## Known Gaps

This release only corrects the Home read path for already-published narrative rows. It does not create
new narrative rows, alter the writer, or certify narrative quality beyond the existing writer gates.
