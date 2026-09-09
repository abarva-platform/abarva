# Source Event Journey Approval Repair

## Release ID

`2026-09-09-source-event-journey-approval`

## Status

`candidate`

## Plain-English Summary

Keeps Source stage approvals on the journey explicitly stored for the event. An event with a linked contract profile no longer switches from a competitive market journey to a shorter contract-optimization journey during approval. It also aligns Scope artifact structural checks with the headings their generation contracts require.

## Layer Impact

- **Lane:** `global-control-lane` for approval and artifact-verification behavior.
- **Layer 4:** Source event approvals and artifact quality metadata.
- **Client data lane:** an operator-only, tenant-scoped repair command can restore one event after an incorrect journey advance. It uses optimistic current-stage checks and preserves approval history.

## Client Applicability

- **All clients:** approval routing and Scope structural verification.
- **Specific clients:** none named in this public record.
- **Internal only:** the journey repair command.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- Source approval reads and honors `source_events.sourcing_motion`.
- Approval regression coverage for an explicit competitive journey with a linked optimization profile.
- Scope artifact section verification matches the authored d04, d06, and d07 prompt contracts.
- Adds `source:event-journey:repair-job` for controlled, optimistic stage/motion correction through the private ACA operator lane.

## QA / Validation

- **PASS:** focused route, journey, and section-conformance tests.
- **PASS:** scoped ESLint for touched TypeScript files.
- **PASS:** `npx tsc --noEmit --pretty false`.
- **Required after deploy:** operator script execution through the digest-pinned ACA lane with tenant, optimistic-stage, and readback checks.
- **Required after deploy:** signed-in affected-event verification.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. After runtime health and digest invariants pass, run the repair command through the private ACA operator job for the explicitly approved event and capture the proof bundle.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** main deploy workflow only.
- **Approved image digest:** recorded after deployment.
- **ACA runtime invariant:** template image and 100% traffic revision must match the approved digest.
- **Worker image invariant:** the private operator execution must use the same digest-pinned image.
- **Feature/env flag update path:** none.
- **Live signed-in proof required:** yes.

## Rollback Plan

Revert the PR to restore prior approval routing. The repair command has no automatic inverse; a reverse correction requires the same tenant, expected-stage, target-stage, and readback controls. Approval records are append-only and are not removed.

## Audit Evidence

- PR, merge SHA, ACA deploy run, runtime digest check, operator proof `summary.json`, and signed-in event readback.

## Known Gaps

- Existing events with a null `sourcing_motion` still use the established inference rules until an operator or product workflow records an explicit motion.
