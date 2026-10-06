# 2026-09-09-source-selection-governed-readiness — Remove legacy selection projection

## Release ID

`2026-09-09-source-selection-governed-readiness`

## Status

`candidate`

## Plain-English Summary

The canonical Source event canvas no longer places a legacy seed-based selection-readiness panel ahead of the event's normalized vendor evaluation. Selection and executive-decision stages now use the governed event response and scorecard views introduced by the preceding release, avoiding contradictory vendor, evidence, and approval statements.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: removes a compatibility projection from the canonical Source event route.
- Layers 1-3: No intake, adapter, schema, canonical-record, or data mutation change.

## Client Applicability

- All clients: Yes, for Source competitive-event Selection and Executive Decision rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Stop building the legacy seed-based selection-readiness projection in the canonical event route.
- Remove its bridge panel and prop from the analytics event canvas.
- Preserve the normalized event-specific award decision lens as the single visible selection posture.

## QA / Validation

- PASS — 19 focused Source analytics-canvas tests.
- PASS — scoped ESLint.
- PASS — TypeScript no-emit compile.
- PASS — release governance check.
- NOT RUN — live signed-in Selection proof; required after deployment.

## Rollout Plan

Merge through a protected pull request and deploy the merge SHA through `.github/workflows/aca-main-deploy.yml`. Verify the digest-pinned runtime invariant, then confirm the signed-in Selection page contains the normalized event vendor decision and none of the removed compatibility-panel copy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned main deploy workflow only.
- Approved image digest: Recorded by the deploy workflow for the merge SHA.
- ACA runtime invariant: Web template and 100% traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new pull request and redeploy through the main workflow. No data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deploy evidence for the merge SHA.
- Signed-in Selection browser proof.

## Known Gaps

Numeric bid values remain unavailable until accepted pricing facts are parsed. The event decision remains conditional and must continue to show its evidence holdbacks.
