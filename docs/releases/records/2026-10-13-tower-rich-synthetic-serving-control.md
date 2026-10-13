# 2026-10-13 Tower rich synthetic serving control

## Release ID

`2026-10-13-tower-rich-synthetic-serving-control`

## Status

`candidate`

## Plain-English Summary

Adds a separate operator for selecting a privately staged synthetic Tower generation. A private load can finish while the currently served generation remains selected. The operator checks exact source, approval, image, stage proof, row fingerprints, and the current selector before changing what Tower serves. It records an independently checked result and provides an exact rollback path.

## Layer Impact

`client-data-lane`. Layer 4 serving selection only. The operator does not create intake, adapter, canonical, or Tower data rows. It changes a selector after separate review.

## Client Applicability

- All clients: No automatic change.
- Specific clients: Only the explicitly selected synthetic tenant and assessment in a reviewed operator job.
- Internal only: Private ACA operator workflow and Blob proof.
- Public/demo only: A synthetic demonstration candidate may be selected after its own approvals.
- Feature flag: None.

## Changes Included

`scripts/tower/operate-rich-synthetic-serving.mjs`, focused tests, the corresponding package scripts, and an operator runbook.

## QA / Validation

Static syntax, focused unit tests, release check, and read-only candidate inspection must pass before a job runs. A private check job must return `ready` with exact stage proof and approval binding before promotion. No database mutation or live serving proof is claimed by this record.

## Rollout Plan

Merge through a PR. Build the approved digest-pinned operator image through the repo-owned workflow. Run the check and promotion modes only in the private ACA Job with the exact immutable stage proof URI and SHA-256, named manifest serving approval, reviewed preflight URI and SHA-256, and operator identity. Keep the selected generation unchanged until promotion commits and independent readback passes.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared image; no branch image may shift shared web traffic.
- Shared runtime mutators: None in this operator.
- Approved image digest: Required as an exact `sha256:` value at job execution.
- ACA runtime invariant: Confirm before reporting the surface live.
- Worker image invariant: Private operator job must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after data promotion and any related web release.
- ACR build policy: The shared web image is built only by the repo-owned main deploy workflow using the Premium registry and its required Buildx cache. This operator does not build or push an image.

## Rollback Plan

Use the `rollback` mode with the immutable promotion proof URI and SHA-256. The job verifies the current and prior generations before restoring the prior selector. If post-commit proof publication fails, the immutable pending proof can drive the same guarded rollback. Verify the restored serving rows and signed-in page afterward.

## Audit Evidence

The private stage tar URI and SHA-256; its stage proof and quality gate; the check proof URI and SHA-256; the named exact-version manifest approvals; promotion or pending proof; post-switch serving readback; rollback proof when used; ACA Job logs and digest; and signed-in page evidence.

## Known Gaps

No private stage, serving approval, check proof, promotion, deployment, or signed-in readback is recorded yet.
