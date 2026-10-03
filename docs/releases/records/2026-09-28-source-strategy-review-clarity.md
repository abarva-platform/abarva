# 2026-09-28 Source Strategy review clarity

## Release ID

`2026-09-28-source-strategy-review-clarity`

## Status

`candidate`

## Plain-English Summary

Source Strategy drafts now ask for an explicit human review of available gate evidence, keep recommended evidence out of gate pass conditions, and carry planning-only value status with the sizing table itself. The strategy memo names the actual next governed stage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy artifact authoring guidance.
- Layer 3 Canonical Model: read-only governance context; no new fact, evidence, event, or approval write.

## Client Applicability

- All clients: Source events generating Strategy decision artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Put human review of available trigger evidence in the strategy memo's gate-session agenda.
- State that Strategy approval advances to Define/Scope, not directly to market release.
- Prevent a broad all-open-evidence condition from silently promoting recommended evidence to a hard gate.
- Require planning-only status beside the value-target sizing table for excerpts.

## QA / Validation

- Pass: red-first prompt tests failed on the prior d01 and d02 contracts and passed after the change.
- Pass: deleting the recommended-evidence closure instruction failed its targeted test; the mutation was restored.
- Pass: 13 Source generation suites / 147 tests.
- Pass: TypeScript with 8 GB heap, scoped ESLint, release:check, and diff check.
- Not run: PR CI, deployment, and signed-in regeneration; verify before live claim.

## Rollout Plan

Squash merge only after applicable CI/review and after the separate Strategy quality-guard deployment and signed-in replay settle. Deploy only through the repo-owned ACA main workflow. Verify digest-pinned web and worker images, then regenerate the two Strategy artifacts signed in. Existing drafts remain unaccepted until independently reviewed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: Both required delivery workers match that digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No schema or data rollback is required.

## Audit Evidence

PR, applicable CI, official deployment, independent runtime readback, and signed-in draft review are recorded in the private execution ledger.

## Known Gaps

Prompt guidance is not a guarantee that a model draft is correct. Independent content review and approval controls remain required; this change does not accept any artifact or advance an event.
