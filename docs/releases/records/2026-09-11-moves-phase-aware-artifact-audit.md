# 2026-09-11 — Moves Phase-Aware Artifact Audit

## Release ID

`2026-09-11-moves-phase-aware-artifact-audit`

## Status

`candidate`

## Plain-English Summary

Adds a repository-owned audit for generated Move deliverables. The audit checks both whether required evidence appears anywhere in the generated corpus and whether decision-critical evidence appears in the phase where a reader needs it. It also detects empty required phases and selected technical disclosure patterns.

## Layer Impact

`global-control-lane` — quality-control scripts and acceptance contracts only. No product data, tenant records, loaders, or runtime request path changes.

## Client Applicability

- All clients: the evaluator and phase-contract mechanism.
- Specific clients: none.
- Internal only: live audit invocation requires an operator-supplied signed-in identity and an explicitly selected Move.
- Public/demo only: none.
- Feature flag: not applicable.

## Changes Included

- Adds a reusable artifact-content contract evaluator.
- Adds a versioned synthetic acceptance contract with phase requirements for P1 through P5.
- Adds focused regression tests for passing coverage, missing phase evidence, empty phases, and technical disclosure.
- Adds an npm command and includes the pure contract test in the Wave 0 quality gate.

## QA / Validation

- `npm run test:moves:artifact-content-contract` — passed.
- Node syntax and JSON validation — passed.
- Read-only live audit against the existing synthetic Move — executed; it correctly reported missing P2/P5 shadow-registry coverage, with no prohibited technical matches. This is an expected contract signal for the next regeneration, not a claim that the current artifact set passes the strengthened contract.
- No upload, approval, data load, delete, or runtime mutation performed.

## Rollout Plan

Merge to `main` through the normal PR path. The pure contract test runs in CI. The live audit remains an explicit operator command and produces a local report; it is not an automatic data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no runtime surface changed; the live audit is read-only proof when an operator elects to run it.

## Rollback Plan

Revert the PR or remove the quality-gate command if the contract needs revision. No database rollback or runtime rollback is required.

## Audit Evidence

- PR containing the evaluator, contract, tests, and usage documentation.
- CI Wave 0 quality-gate result.
- Local live-audit JSON report and extracted text corpus when the operator runs the read-only command.

## Known Gaps

The public contract intentionally does not contain client- or engagement-specific prohibited names. Operators may supply a private contract for those terms. Existing generated artifacts must be regenerated before the strengthened P2/P5 shadow-registry requirements can pass.
