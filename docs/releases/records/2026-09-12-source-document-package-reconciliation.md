# Source document package reconciliation

## Release classification

- Release lane: `client-data-lane`
- Layer impact: Layer 2 source loading and Layer 3 document evidence projection
- Client applicability: Specific synthetic tenant package used for Source Contract 360 validation
- Feature flag: None

## What changed

The contract document companion loader now reconciles stale document-shaped rows when a package is
reloaded. Cleanup is limited to rows that belong to the selected contract and carry the exact same
package provenance; current rows are then replaced idempotently. Cross-contract file ownership
conflicts still fail closed instead of being overwritten.

## QA / Validation

- PASS: document evidence loader behavior tests, including same-package stale-file selection.
- PASS: JavaScript syntax and diff validation.
- Required after merge: ACA deployment, runtime invariant, and the scoped document evidence job.
- Required after reload: signed-in Source Evidence proof confirms the stale file is absent and the
  current package file set is visible.

## Rollout plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, prove the digest-pinned
web and worker image invariant, then run the scoped ACA operator job for the affected package.

## Deployment authority

- Repo-owned ACA deploy workflow: Required.
- Data mutation: ACA operator job only; no production web request performs the load.
- Live signed-in proof: Required for the affected Source Contract 360 Evidence tab.

## Rollback plan

Rollback the web runtime to the prior approved digest if the loader regresses. No schema rollback is
required. The data job is idempotent and can be rerun with the approved package after correction.

## Audit evidence

- PR: pending.
- ACA deployment digest and runtime invariant: captured in the deployment workflow artifact.
- ACA data-job proof: captured in the scoped operator-job output.

## Known gaps

This release reconciles package-scoped document rows only. It does not invent missing documents or
resolve the separate portfolio register/depth identity gap.
