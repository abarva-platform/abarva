# 2026-10-12-tower-serving-readback-verification — Verify selected Tower pages

## Release ID

`2026-10-12-tower-serving-readback-verification`

## Status

`candidate`

## Plain-English Summary

The Tower operator can independently check a selected assessment after a serving change. The check compares the active selector and every served page against the staged source-linked rows, then saves an exact private proof. It does not change the selection or any source data.

## Layer Impact

Release lane: `client-data-lane`.

- Layers 1–3: no source or canonical data changes.
- Layer 4: read-only verification recognizes the page groups deliberately combined in the command center and value proof serving views. It still checks each group against its separate staged count and fingerprint.

## Client Applicability

- All clients: no automatic data change.
- Specific clients: the read-only Job runs only for the exact tenant and assessment named by its operator request and reviewed preflight proof.
- Internal only: the ACA operator Job and private proof output.
- Public/demo only: no separate public behavior change.
- Feature flag: none.

## Changes Included

- Check the command center serving view's summary, decision lanes, and recommended actions as three separately fingerprinted populations.
- Keep the value proof view's value and cost populations separately checked.
- Add `tower:registered-intake:verify-job` for a read-only post-selection check. It saves the serving readback to private Blob, downloads it to confirm identical bytes, and prints the exact proof and SHA-256 in the private Job log.
- Bind the verification Job to the existing private ACA wrapper's image, job, timeout, and execution lane checks.

## QA / Validation

- Local focused ACA Job tests passed (12 of 12); focused ESLint and governance manifest validation passed. `npm run release:check` must pass before merge.
- Live read-only Job and signed-in Tower checks: not run for this candidate until the new image is deployed. The Job must report one active assessment and matching counts and fingerprints for all nine page populations.

## Rollout Plan

Merge through a protected PR. Let the repo-owned main ACA workflow build and deploy the digest-pinned image. Confirm web and required worker digest parity. Run the read-only verification Job with the exact staged ZIP and reviewed preflight URI/SHA-256. Compare its private proof and logged checksum, then inspect the signed-in Tower views.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` exclusively changes shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: captured from the successful main deploy before running the private Job.
- ACA runtime invariant: healthy 100% web revision, template image, and required worker images match the approved digest.
- Worker image invariant: the required workers use that same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: affected Tower tabs after the read-only serving check.
- ACR build policy: only the repo-owned deploy workflow builds the shared web image, using the Premium registry and Buildx cache. The private verification Job reuses the approved digest and does not build or prune images.

## Rollback Plan

The verification code changes no data. Revert this PR through the protected main path if the checker needs correction. Any Tower selector rollback follows the separately governed promotion proof and rollback procedure.

## Audit Evidence

PR and CI results, repo-owned deploy run, ACA digest readback, the private `serving-readback.json` URI/SHA-256, Job contract, and signed-in Tower observations.

## Known Gaps

This check proves selected row populations and lineage fingerprints. It does not supply missing approved budgets, Finance clearance, or user-entered explanations absent from the source intake.
