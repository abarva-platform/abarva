# Release Outcome Reconciliation

## Release ID

`2026-09-21-release-outcome-reconciliation`

## Status

`candidate`

## Plain-English Summary

This control-only release reconciles five recently merged pull requests with their exact merge commits and immutable deployment evidence. Each release now has an individual private outcome record, including the carrier deployment when GitHub concurrency cancelled its own run.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1-4: no product, adapter, canonical-model, or client-intake behavior changes.
- Internal operations: clarifies ownership of the post-deployment closeout step.

## Client Applicability

- All clients: no runtime product change.
- Specific clients: none.
- Internal only: release operations.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Reconciled five pull requests individually in the private execution register.
- Named each merge SHA, its own or carrier ACA run, and the digest read from that run's immutable runtime-invariant artifact.
- Kept merge, deployment, runtime proof, and signed-in proof as separate states.

## Process Ownership

The queue-driven execution supervisor owns a mandatory post-deployment closeout step: after the repo-owned ACA workflow reaches a terminal state, it appends one outcome record per pull request from that run's immutable evidence, naming a descendant carrier explicitly when concurrency cancelled the pull request's own run.

## QA / Validation

- PASS: each of the five merge SHAs was read from GitHub and confirmed in repository ancestry.
- PASS: each successful deployment or carrier deployment was read from the repo-owned ACA workflow.
- PASS: three immutable `aca-main-deploy` artifacts were downloaded and parsed; every runtime invariant passed with no errors, 100% traffic on the named revision, and matching digest-pinned template, active revision, and two governed workers.
- PASS: the two cancelled runs are recorded as cancelled and rely only on a named successful descendant carrier.
- PASS: the private register contains one new outcome line per pull request rather than one batch status.
- PASS: the T-581 and T-584 reconciliation sets were not altered.

## Rollout Plan

Merge through a pull request. This release changes only a public-safe control record; it does not require an application deployment, migration, data build, feature flag, or traffic change.

## Deployment Authority

- Repo-owned deploy workflow: not required for this record-only change.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this record-only change.
- ACA runtime invariant: verified for the reconciled releases from their immutable artifacts.
- Worker image invariant: verified for the reconciled releases from their immutable artifacts.
- Live signed-in proof required: no.

## Rollback Plan

Revert this record. The private append-only outcome lines remain audit evidence and are not rewritten.

## Audit Evidence

- Private execution-register outcome lines for the five pull requests.
- GitHub merge and workflow metadata.
- Immutable `aca-main-deploy` runtime-invariant artifacts for the successful own and carrier runs.

## Known Gaps

This records existing release outcomes; it does not automate the closeout step. A future automation may append equivalent records, but it must preserve one-line-per-release attribution and carrier ancestry proof.
