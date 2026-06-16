# 2026-06-16-source-auto-assessment-persistence — Source Auto-Assessment Persistence

## Release ID

`2026-06-16-source-auto-assessment-persistence`

## Status

`candidate`

## Plain-English Summary

Source gate readiness now has a durable audit path. When evidence satisfies a pending gate input, Source can persist that input as met with system provenance, evidence links, and an activity log record. The gate checklist was also simplified so operators see the client job first: a compact input/status table showing which files or confirmations are ready, missing, or awaiting review. Manual override, advance-with-gaps, and audit details remain available but are no longer the default clutter.

## Layer Impact

- `global-control-lane`: Source gate behavior and Source canvas UI changed for all clients using the shared Source workflow.
- Data-plane writes: existing `source_event_gate_criterion_states` columns are used; no schema migration was added.

## Client Applicability

- All clients: Yes, when using the Source stage gate canvas.
- Specific clients: Live verification target is SkyHarbor Air.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/lib/source/gate-auto-assessment-persist.ts`.
- Extended `sourceWriteAdapter.updateGateCriterion` to optionally write `notes` and `evidence_artifact_ids`.
- Persisted auto-assessment best-effort after a successful Source stage entry.
- Rendered persisted `system:auto-evidence` rows as auto-assessed after reload.
- Simplified the Gate tab from internal blocker labels to a compact required-input table with advanced audit details and advance-with-gaps controls collapsed.

## QA / Validation

- `npx jest src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts src/__tests__/integration/source/source-canvas-gate-tab.test.tsx --runInBand` — passed, 47 tests.
- `npx eslint src/lib/source/gate-auto-assessment.ts src/lib/source/gate-auto-assessment-persist.ts src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/lib/data-plane/write-adapters/sourceWriteAdapter.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts 'src/app/api/v1/source/[eventId]/stage/route.ts' src/components/source/canvas/workspace-tabs/GateTab.tsx src/__tests__/integration/source/source-canvas-gate-tab.test.tsx` — passed.
- `npx tsc --noEmit --pretty false` — touched files type clean; local run stops on pre-existing missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image, shift traffic to the new revision, and browser-verify the SkyHarbor Source event Scope gate.

## Rollback Plan

Roll back to the prior Azure Container Apps revision or revert the PR. No migration or data deletion is involved.

## Audit Evidence

- PR URL and CI checks once opened.
- Browser screenshots from the SkyHarbor Source event after deployment.
- Source activity log rows with `action_type=gate_criterion_auto_assessed` when auto-assessment writes occur.

## Known Gaps

- This slice only persists criteria that are already pending and auto-met from evidence. It does not auto-waive, auto-mark-not-met, or override any human decision.
- Full positive live proof requires at least one stage-entry target with evidence at or above the threshold.
