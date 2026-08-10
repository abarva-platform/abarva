# 2026-08-10-source-workflow-checklist-evidence-readback — Source Workflow Checklist Evidence Readback

## Release ID

`2026-08-10-source-workflow-checklist-evidence-readback`

## Status

`candidate`

## Plain-English Summary

This release makes Source workflow checklist actions auditable. A mapped confirm or decision task now writes to the governed evidence-answer route and refreshes the page so the checklist reads the persisted evidence back. The checklist no longer depends only on in-browser state for a gate-relevant decision step.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake: no change to client templates or accepted file formats.
- Source adapters: no change to parser behavior.
- Canonical model: uses the existing Source evidence-state contract for task completion readback.
- Products: Source workflow UI now persists and rehydrates mapped non-upload checklist actions.

## Client Applicability

- All clients: yes, for Source workflow journeys using the analytics canvas.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Shared task-to-evidence mapping for Source checklist tasks.
- Source event page reads effective evidence states and passes them into task hydration.
- Source task checklist posts mapped confirm/decide actions to the governed evidence answer route.
- Hydration tests cover mapped decision evidence, stale evidence, artifact-backed tasks, and canonical task-id fallback.
- UI tests cover successful and failed checklist evidence saves.

## QA / Validation

- `npx jest src/lib/source/facts/view/__tests__/task-evidence-hydration.test.ts --runInBand` passed.
- `npx jest src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx eslint src/components/source/canvas/analytics/TaskChecklist.tsx src/lib/source/facts/task-evidence-requirements.ts src/lib/source/facts/view/task-evidence-hydration.ts src/app/(maestro)/source/events/[eventId]/page.tsx src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx src/lib/source/facts/view/__tests__/task-evidence-hydration.test.ts` passed.

## Rollout Plan

Merge to main by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before live claim.
- Worker image invariant: no worker changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source workflow evidence save and readback.

## Rollback Plan

Revert the PR. The fallback behavior is the prior checklist rendering path, with upload tasks still using the existing governed artifact/fact routes.

## Audit Evidence

- PR URL: pending.
- CI / local validation: commands listed above.
- Live proof: pending post-deploy signed-in workflow check.

## Known Gaps

- Rich proposal-dossier parsing and later-stage template-to-evidence mapping are tracked as follow-up backlog items and are not completed by this release.
