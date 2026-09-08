# 2026-09-08 Source Supplemental Contract Discovery

## Release ID

`2026-09-08-source-supplemental-contract-discovery`

## Status

`candidate`

## Plain-English Summary

The Source contract finder now searches both the governed contract register and contract-depth or action-layer records that have not yet been matched into that register. Supplemental records are labeled explicitly and do not alter the governed register denominator.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source contract discovery only.
- Layers 1-3: No intake, adapter, canonical data, calculation, or tenant record changes.

## Client Applicability

- All clients: Yes, when supplemental contract-depth or action rows are present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Build a single contract-finder index from register, evidence-coverage, and action-candidate rows.
- Prefer governed register identity when a contract exists in more than one source.
- Label depth-only and action-only matches as supplemental and state that they sit outside the governed register denominator.
- Preserve direct Contract 360 navigation for supplemental matches.

## QA / Validation

- Focused Source workspace Jest suite: PASS (6 tests).
- Scoped ESLint: required before publication.
- TypeScript no-emit check: required before publication.
- Release-control check: required before publication.
- Live signed-in Source proof: required after deployment.

## Rollout Plan

Merge by squash through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA, after which the finder is exercised against a depth-only contract.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deployment workflow after merge.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Worker image invariant: No worker behavior changes; the workflow still proves image alignment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new PR and redeploy the resulting main SHA. No data rollback is required.

## Audit Evidence

- PR URL and merge SHA after publication.
- Focused test, lint, typecheck, and release-check output.
- ACA deployment artifact for the exact merge SHA.
- Signed-in Source search and Contract 360 navigation proof.

## Known Gaps

Supplemental discovery does not promote a depth record into the governed contract register. Register matching remains a separate governed data operation.
