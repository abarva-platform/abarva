# 2026-07-17-tower-intelligence-canvas-redesign — Tower Intelligence Canvas Redesign

## Release ID

`2026-07-17-tower-intelligence-canvas-redesign`

## Status

`candidate`

## Plain-English Summary

This release updates the Tower command mart surface so it uses the same executive canvas language, palette, and charting posture as the Intelligence page. The Tower page keeps the same governed Tower mart facts, but presents them through a wider horizontal canvas, Recharts-powered budget/value/AI visuals, and less sidebar clutter.

## Layer Impact

- `global-control-lane`: Updates the shared Tower UI component and visual rendering behavior for the Tower command center.
- Data plane: No change. Tower continues to read the existing Tower mart/runtime view model supplied to the component.
- Model/agent egress: No change. This release does not alter Claude prompts, answer generation, retrieval, or aVa routing.

## Client Applicability

- All clients: Tower visual component behavior changes wherever the Tower mart command center is available.
- Specific clients: Healthcare Demo/Meridian receives the primary visible proof path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Aligns Tower design tokens with the Intelligence executive canvas palette.
  - Replaces the Tower left analysis rail with horizontal canvas tabs.
  - Adds Recharts-based budget split, value proof funnel, and AI value/readiness scatter matrix visuals.
  - Preserves existing Tower mart facts and evidence-safe wording.

## QA / Validation

- `npx eslint src/components/tower/TowerIndexPage.tsx` — passed with pre-existing unused-code warnings in the large Tower file.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm test -- --runInBand src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — passed, 14/14 tests. Jest emitted existing duplicate mock warnings and Recharts jsdom sizing warnings.
- `git diff --check` — passed.

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to `ca-abarva-web-lab-eastus`. After deploy, confirm the active ACA revision, image digest, traffic split, runtime invariant, and signed-in Healthcare Demo Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker change.
- Feature/env flag update path: No flag update.
- Live signed-in proof required: Yes, Healthcare Demo `/tower`.

## Rollback Plan

Revert the PR and allow the main ACA deploy workflow to build/deploy the previous Tower component. No database or migration rollback is required.

## Audit Evidence

- PR URL: To be added when opened.
- Local validation output: command logs in Codex session.
- Browser proof: To be captured after deploy under `proof/tower-intelligence-canvas-redesign-*`.
- ACA revision/digest: To be captured after deploy.

## Known Gaps

- This release improves Tower visual presentation only. It does not add new Tower mart facts, Azure data-plane tables, source-adapter feeds, Copilot/ServiceNow/Workday usage extracts, or benefit-realization records.
