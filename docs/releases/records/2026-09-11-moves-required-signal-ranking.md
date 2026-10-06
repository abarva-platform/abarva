# 2026-09-11-moves-required-signal-ranking — Moves Required Signal Ranking

## Release ID

`2026-09-11-moves-required-signal-ranking`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now prefer exact, phase-captured metric signals over broad prose inherited from prior generated artifacts when selecting the required evidence signals that must appear in the next artifact. This keeps precise counts and rates from being displaced by general narrative that mentions the same theme.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Moves generated deliverables receive stronger required-evidence anchors for rich evidence packs.

Canonical model layer: No schema, loader, or tenant-data mutation change. The change only ranks already-governed evidence rows before prompt and quality validation.

## Client Applicability

- All clients: Yes, for Moves generated deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/evidence-signals.ts`
- `src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts`

## QA / Validation

- Passed: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts --runInBand`
- Passed: `npx eslint src/lib/deliverables/orchestrator/evidence-signals.ts src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts`

## Rollout Plan

Merge through PR, then deploy via the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Verify after deploy before claiming live proof.
- Worker image invariant: Verify affected web and worker images after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Moves synthetic generation and artifact-content audit paths.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Focused required-signal ranking regression output.
- Post-deploy Moves synthetic smoke output and generated-artifact content audit.

## Known Gaps

No data cleanup is included.
