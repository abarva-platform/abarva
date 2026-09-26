# 2026-09-21 Source Classified Value Movement Presentation

## Release ID

`2026-09-21-source-value-movement-presentation`

## Status

`candidate`

## Plain-English Summary

Source event intelligence now presents negotiable opportunity, protected value, and risk-adjusted movement as separate commercial categories. The headline no longer nets unlike positive and negative movements into one misleading range or percentage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 read and presentation behavior only. No formulas, facts, canonical rows, source adapters, tenant data, or workflow decisions are changed.

## Client Applicability

- All clients: yes, where Source event intelligence exposes classified value movements.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event intelligence availability.

## Changes Included

- Made negotiable opportunity the primary value headline and percentage basis.
- Presented protected value and risk-adjusted movement separately.
- Kept negative movement bands visible while using explicit signed range wording.
- Updated scope insights to describe each value class independently rather than netting them together.
- Added behavioral tests for mixed positive, protected, and negative movements.

## QA / Validation

- Red-first component and insight tests failed on the previously netted headline.
- Mutation proof confirmed that dropping the risk-adjusted bucket fails the behavior test.
- Focused tests, TypeScript, scoped ESLint, release validation, and PR CI must pass before merge.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the Intelligence view states all three value categories separately and does not show a netted negative headline or percentage.

## Rollback Plan

Revert the squash merge and let the repo-owned workflow restore the previous presentation. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in read-only Source event Intelligence smoke after deployment.

## Known Gaps

This release changes presentation only. It does not alter underlying formulas, classification, evidence readiness, or value facts.

## Post-deployment signed-in replay

**Appended 2026-09-26 (item `C-528`). Every line above is left exactly as
written: this record is audit history, and a correction to it is an addition,
never an edit.** What those lines said was true when they were written — the
record is authored before the merge, and the replay happens after the deploy.

- The signed-in post-deployment replay was run. This section is the record of
  its outcome; the line above is the state as of the candidate, not the result.
- Recorded in the execution register at `2026-09-22T01:02:00Z` by `codex-source-value-movement-presentation`.
- What it found: signed-in acceptance passed on the governed intelligence
  surface, and the register quotes the negotiable headline range it saw there.
- **Scope is PARTLY settled and otherwise UNDETERMINED.** The requirement above
  names two assertions: that all three value categories are stated separately,
  and that no netted negative headline or percentage is shown. The quoted
  headline is a positive range, which speaks to the second; nothing in the
  register speaks to the first, and this correction does not infer it.
- No signed-in run was performed by this correction. It reconciles two existing
  accounts of one run, and the appended-to record is the durable one.
