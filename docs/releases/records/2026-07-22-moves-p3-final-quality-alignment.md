# MOVES-P3-QUALITY-004 — Final P3 Generation/Profile Alignment

## Release ID

`2026-07-22-moves-p3-final-quality-alignment`

## Status

`candidate`

## Plain-English Summary

Fixes two live-proven P3 quality failures: numeric assumptions now remain attached to the sentence they qualify, and Solution Design generates against its own workflow-design profile instead of the Target Architecture profile.

## Layer Impact

- `global-control-lane`: shared Moves P3 generation routing and deterministic post-generation repair.
- No schema, tenant-data, evidence-readiness, approval, or context-layer changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing generation/quality flags remain unchanged.

## Changes Included

- Place the governed assumption marker before terminal punctuation so sentence-based quality validation sees the claim and its treatment together.
- Re-run deterministic claim repair on the final assembled section surface after open-input consolidation.
- Route `solution_design` to its own orchestrator/profile, producing and evaluating the five required workflow/control exhibits in one key space.
- Add regression tests for final-assembly repair and registry-to-profile routing.

## QA / Validation

- `npx jest src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand` — pass, 48 tests.
- Post-merge GitHub checks, ACA deployment, runtime invariant verification, and signed-in disposable First Capital P3 generation proof are required before release status changes.

## Rollout Plan

Squash merge through a PR to `main`; deploy only through the repo-owned ACA main workflow. Verify the exact merge SHA across the healthy 100%-traffic web revision and both worker jobs, then rerun all four P3 artifacts on the disposable First Capital proof Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a PR and deploy the resulting `main` SHA through the repo-owned workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- GitHub checks: pending.
- ACA revision/digest/traffic proof: pending.
- Signed-in proof bundle: pending.

## Known Gaps

- Claude output may still fail a legitimate evidence or narrative-quality gate; this release removes deterministic false blockers but does not weaken those gates.
- No gate approval, phase advancement, or real client Move mutation is part of the proof.
