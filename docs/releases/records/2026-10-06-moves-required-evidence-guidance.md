# 2026-10-06 — Moves Required-Evidence Guidance

## Release ID

`2026-10-06-moves-required-evidence-guidance`

## Status

`candidate`

## Plain-English Summary

When a Moves phase cannot be built because required evidence is still open, the expanded evidence section now names each required item, its next action, likely source owner, and accepted formats. Optional details explain why the item matters and provide clearly labelled examples. Examples remain guidance, not client evidence.

## Layer Impact

- **Release lane: `global-control-lane`.**
- **Layer 4 — Products / Moves:** presentation-only improvement to the phase build screen. It does not change captured data, evidence evaluation, approvals, gate criteria, or artifact generation.

## Client Applicability

- All clients using the affected Moves phase build screen.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `PhaseApproveAndBuild` renders the structured details already present in required-evidence packets.
- Regression tests cover packet details and the blocked build action.

## QA / Validation

- Focused Jest suites: 208 tests passed across 2 suites.
- ESLint: passed for all changed TypeScript files.
- Full local `tsc --noEmit` ended with a JavaScript heap out-of-memory error before diagnostics; CI typecheck remains authoritative.
- `git diff --check`: passed.
- Release check: all 11 gates passed with `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Live signed-in verification: pending; this candidate is not live-proven.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow will build and deploy the merged code. No data migration, feature-flag update, or operator data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None outside the repo-owned deployment workflow.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Must remain aligned with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the rendered evidence details and unchanged blocked state.

## Rollback Plan

Revert the merged PR through a follow-up PR and deploy through the repo-owned ACA main deploy workflow. No schema rollback is needed.

## Audit Evidence

- PR and CI links: Pending.
- Focused Jest and ESLint output: captured in the implementation run.
- Deployment run, digest invariant, and signed-in proof: pending.

## Known Gaps

This change explains the evidence already declared by the readiness packet; it does not resolve the separate authorization and policy requirements for loading synthetic evidence. Evidence approval and phase advancement remain human-governed.
