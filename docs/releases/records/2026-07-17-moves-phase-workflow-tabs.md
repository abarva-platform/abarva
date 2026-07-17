# 2026-07-17-moves-phase-workflow-tabs — Moves Phase Workflow Tabs

## Release ID

`2026-07-17-moves-phase-workflow-tabs`

## Status

`candidate`

## Plain-English Summary

This release makes the Strategic Moves phase workspace clearer for operators running P1-P5. Phase tabs now describe the actual workflow step, the page shows a compact guidance table for what to do now and what counts as done, uploaded phase files are listed immediately after upload, and File Cabinet artifact Open no longer risks navigating the current Moves workspace away.

Follow-up correction in `codex/moves-remove-legacy-prepare-wall`: the P2-P5 Prepare tab now actually owns the visible body. The legacy long-form phase workspace and session playbook wall no longer render underneath the new tabs. Prepare now shows a compact command center, evidence checklist, and explicit Upload files / Review gate actions; Upload & review is the evidence action step; Review findings owns readiness/finding review.

## Layer Impact

- `global-control-lane`: Updates the shared Strategic Moves phase shell and File Cabinet review/open behavior for all tenants.
- `global-control-lane`: Extends the focused Moves phase test to cover multi-file upload visibility and the safe artifact Open contract.

## Client Applicability

- All clients: Yes, for Strategic Moves users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Follow-up: `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Follow-up: `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass follow-up: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass follow-up: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass follow-up: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pending before follow-up release: release check and diff whitespace check after release-record update.
- Pending after follow-up deploy: signed-in browser smoke proving P2 Prepare no longer shows the legacy Phase Sessions / Generate Session Pack wall.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the ACA main deploy workflow.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and let the ACA main deploy workflow publish the previous Strategic Moves shell. No migration or data rollback is required.

## Audit Evidence

- PR URL: Pending.
- ACA deployment: Pending.
- Signed-in browser proof: Pending.
- Follow-up PR URL: Pending.
- Follow-up ACA deployment: Pending.
- Follow-up signed-in browser proof: Pending.

## Known Gaps

- This does not redesign the full P2-P5 content model or generate richer session packs; it removes the confusing legacy session wall from the active Prepare tab.
- File Cabinet review content is made artifact-specific at the header level; deeper packet logic remains governed by the existing review APIs.
