# Moves reviewed-value claim guard

## Release ID

`2026-10-01-moves-reviewed-value-claim-guard`

## Status

`candidate`

## Plain-English Summary

The generated-deliverable review route now blocks an uploaded replacement when it introduces an explicit currency amount or strengthens a financial hypothesis into a confirmed claim that was not in the generated source. A reviewed replacement remains the approved deliverable version, but is not marked as independently evidence-verified or citation-ready.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Adds a fail-closed validation to the Moves reviewed-deliverable approval route.
- **Canonical model:** Preserves the distinction between an approved deliverable and approved source evidence; evidence revision linkage remains unchanged.

## Client Applicability

- All clients using the Moves client-reviewed replacement flow.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `POST /api/v1/programs/:programId/artifacts/:artifactId/client-approval` rejects unsupported financial-claim deltas before persistence or sign-off.
- Uploaded reviewed deliverables carry explicit client-approved-deliverable provenance and are not citation-ready by default.
- Regression coverage includes a new amount, a hypothesis upgraded to a confirmed claim, and a supported replacement path.

## QA / Validation

- Targeted client-approval route suite: 13 tests passed.
- The new negative case was run before the fix and returned HTTP 200; after the fix it returns HTTP 422 with no artifact save, deliverable version, or sign-off.
- Typecheck, lint, release check, and CI: pending.
- Signed-in review-flow verification: pending deployment.

## Rollout Plan

Merge through the protected pull-request path. Runtime rollout uses the repository-owned ACA main deploy workflow. Verify the exact merged SHA, pinned image digest, active revision, 100% traffic, and worker image invariant, then verify a signed-in reviewed replacement in the Moves UI.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment verification.
- Worker image invariant: Pending deployment verification.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes; confirm supported human review still works and unsupported financial deltas fail before sign-off.

## Rollback Plan

Revert the pull request through a follow-up pull request and deploy the resulting main revision through the repository-owned ACA workflow. The prior approved deliverable versions and source evidence remain unchanged.

## Audit Evidence

- Pull request: Pending.
- CI run: Pending.
- Exact-SHA ACA deploy run and runtime invariant: Pending.
- Signed-in review-flow proof: Pending.

## Known Gaps

The guard detects explicit currency amounts and strengthened financial assertions in parsed text; it is not a general semantic redline classifier. New or changed financial facts still require approved source evidence and regenerated deliverables. The reviewer-upload route continues to record approval as one combined action.
