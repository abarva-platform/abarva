# 2026-09-23 Source Stage 07 brief refusal

## Release ID

`2026-09-23-source-stage07-brief-refusal`

## Status

`candidate`

## Plain-English Summary

A refused negotiation brief no longer returns response, pricing, or other rows labeled as accepted facts. The refusal reasons and next actions remain available for review.

## Layer Impact

`global-control-lane`: Layer 4 product projection only. Canonical records and review decisions are unchanged.

## Client Applicability

All clients using the Source Stage 07 negotiation brief planner. No feature flag.

## Changes Included

The Stage 07 planner now returns an empty accepted-fact set when required evidence is missing. Its behavioral tests cover missing pricing and evaluator authority.

## QA / Validation

Red-first focused test: 2 failures, 4 passes before the fix because refused briefs still returned accepted facts. A temporary mutation restoring fact construction on the refusal branch reproduced the same 2 failures, then was removed. The focused planner and mounted-panel suites passed 9/9 after the fix; focused ESLint, repository typecheck, and release check passed. CI and signed-in replay are pending at this candidate stage.

## Rollout Plan

After PR review and applicable checks, merge to main and deploy only through the repo-owned ACA main workflow. Verify the digest-pinned runtime separately, then replay the mounted Stage 07 view signed in when governed evidence makes that stage reachable.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none from this change
- Approved image digest: pending deployment
- ACA runtime invariant: pending deployment
- Worker image invariant: pending deployment
- Feature/env flag update path: none
- Live signed-in proof required: yes, after the genuine stage gates

## Rollback Plan

Revert the PR through a reviewed follow-up and allow the repo-owned workflow to deploy the revert. No schema or data rollback is involved.

## Audit Evidence

Focused red/green test output, PR review and CI, ACA immutable runtime proof, and later signed-in Stage 07 replay.

## Known Gaps

This change is a narrow fail-closed correction, not completion of the Stage 07 negotiation-brief authority. A candidate brief still needs persisted reviewed-fact authority and positive signed-in acceptance; the frozen event remains behind an earlier governed gate.
