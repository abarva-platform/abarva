# 2026-08-22-moves-gate-status-clarity — Moves Gate Status Clarity

## Release ID

`2026-08-22-moves-gate-status-clarity`

## Status

`candidate`

## Plain-English Summary

Moves phase pages now separate captured input state from gate-ready output state. A filled input no longer uses the same visual language as an approved or gate-ready deliverable, and the gate approval area is reduced to one primary decision with supporting details behind disclosure controls.

## Layer Impact

Layer 4 Products: Updates the Moves workspace UI only. No tenant intake, canonical model, registry, graph substrate, data-plane loader, migration, or runtime routing changes are included.

## Client Applicability

- All clients: Moves users reviewing phase inputs, generated artifacts, and gate readiness.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Phase input rows now show `Captured` instead of reusing green completion semantics.
- Workflow rows now show `Viewed` for already visited steps instead of implying gate completion.
- Generated deliverable statuses now say `Gate-ready` or `Not gate-ready`.
- Blocked generated-deliverable diagnostics are condensed to evidence, readiness, missing items, and next action.
- Gate approval top-level UI is simplified to a single decision card; evidence details, blockers, next-phase readiness, checklist, and role approvals are available behind disclosure controls.

## QA / Validation

- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — pass.
- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx -t "supports the explorer, upload, aVa launcher, and gate ceremony interactions" --runInBand` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Moves page before claiming client-visible behavior.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior UI. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in Moves page proof after deployment.

## Known Gaps

This does not change artifact generation quality, final DOCX/PPTX policy, or evidence gates. The current artifact QA found weak DOCX layout and placeholder visual exhibits; those require a separate artifact-quality gate and generation-template slice.
