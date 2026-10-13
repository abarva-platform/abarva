# 2026-10-13 Tower projection assessment identity

## Release ID

`2026-10-13-tower-projection-assessment-identity`

## Status

`candidate`

## Plain-English Summary

Tower's private projection loader now gives every physical page row an ID that includes its assessment. Its quality check also identifies rows by both page and row key, allowing the same record to appear in different sections. A newly staged version can coexist with the retained version. The served version remains selected separately.

## Layer Impact

- Release lane: `public-demo`.
- Layer 4 products: Physical Tower row IDs are unique to an assessment. Source, adapter, canonical, metric, and cube identities are unchanged.

## Client Applicability

- All clients: No data change.
- Specific clients: One synthetic demo tenant's pending private stage.
- Internal only: Operator loader behavior.
- Public/demo only: The synthetic Tower candidate after separate serving approval.
- Feature flag: None.

## Changes Included

- Scope physical row IDs in the four Tower projection tables to the tenant and assessment.
- Carry the wrapper's exact Git commit into the private-stage proof when the runtime image omits `.git`.
- Add a regression check for uniqueness across retained and candidate assessments and repeatability within one assessment.
- Include page keys in private readback and proof, and check uniqueness within each page rather than across unrelated pages.

## QA / Validation

- PASS: `node scripts/tower/__tests__/run-layer4-assessment-identity-tests.mjs` verifies all four physical tables.
- The earlier Layer 2 and Layer 3 private jobs completed with clean readbacks. A later Layer 4 job committed an inactive candidate but its quality gate rejected repeated row keys across different pages. The operator job returned to idle. Layer 4 must be rerun after this check is deployed.
- Required before merge: `npm run release:check` and relevant loader tests.

## Rollout Plan

Merge through a PR, deploy by the repo-owned ACA main workflow, verify the web and worker digest invariant, then rerun the approved private Layer 4 stage. A separate serving approval and selector operation remain required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only.
- Approved image digest: Record from the successful main deployment before the next private job.
- ACA runtime invariant: Verify template, 100% traffic revision, and required workers match.
- Worker image invariant: Required before the private stage.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after a later serving switch.

## Rollback Plan

Keep the existing assessment selected. Revert this loader change through a PR if needed. The candidate projection remains inactive until a separate serving decision.

## Audit Evidence

- Regression test, PR checks, the stopped Layer 4 ACA execution, and the later private stage readback and Blob proof.

## Known Gaps

- The candidate Layer 4 projection is inactive. Its private stage proof has not yet passed the quality gate or been uploaded, and it has not been served.
