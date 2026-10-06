# Source approval actor attribution

## Release ID

`2026-09-26-source-v1-owner-approval-attribution`

## Status

`candidate`

## Plain-English Summary

The Source intake approval screen now attributes its strategy confirmation to the Event Owner who acts. It no longer writes an unsupported sponsor sign-off assertion into the approval rationale. An optional co-approver action is shown only when a reviewer is actually assigned.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: No schema, event state, approval policy, or evidence requirement changes.
- Layer 4 Source: Approval presentation and the rationale submitted to the existing decision route are corrected.

## Client Applicability

- All clients using the Source intake approval screen.
- No client-specific data or configuration change.

## Changes Included

- Label the declared decision owner as Event Owner in the approval route summary.
- Replace the strategy checkbox and submitted rationale's sponsor sign-off claim with the acting owner's own confirmation.
- Hide the co-approver command and explanatory copy when no co-approver is configured; preserve the optional route when one is present.
- Keep the three canonical strategy confirmation keys, human rationale requirement, server-side authority checks, and all existing evidence gates.

## QA / Validation

- Pass: Red-first rendered and request-payload tests exposed the old attribution.
- Pass: The focused approval-card suite passes 12/12 after the change.
- Pass: Restoring the old sponsor-sign-off payload line makes the negative transport test fail; the mutation was restored.
- Pass: The approval-route suite passes 26/26; scoped ESLint, TypeScript typecheck, and release check pass.
- Not run: Other Source component suites and PR CI at candidate creation.
- Not run: Live signed-in readback of this change; it requires the official main deployment.

## Rollout Plan

Squash merge through the protected main branch after applicable validation. Only the repository-owned ACA main workflow may build and deploy the web image. No migration, data build, external email, or existing-event approval is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators outside that workflow: None.
- Approved image digest and runtime invariant: Not run; verify after the exact merge deploy.
- Live signed-in proof: Required for the affected approval screen after deployment.

## Rollback Plan

Revert the UI and rationale change through a new PR and let the repo-owned workflow deploy its replacement digest. Previously written approval records remain append-only and are not rewritten.

## Audit Evidence

- Local focused tests and a caught deliberate mutation at candidate stage.
- PR, CI, merge SHA, deploy run, digest, and signed-in proof: Not run at candidate stage.

## Known Gaps

- This change does not make a sponsor, legal, finance, supplier, or other external attestation optional where a separately governed gate still requires it.
- It does not prove a live stage decision or update older approval records.
