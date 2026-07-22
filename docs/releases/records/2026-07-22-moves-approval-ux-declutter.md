# 2026-07-22 Moves Approval UX Declutter

## Release ID

`2026-07-22-moves-approval-ux-declutter`

## Status

`candidate`

## Plain-English Summary

Moves phase approval screens are tightened so the selected workflow step owns the current action. For P1-P5, long gate criteria and next-phase readiness sections no longer sprawl underneath the approval card by default; they are available as compact disclosure rows inside the approval decision surface. The optional key-design-decision recorder is limited to later design/plan phases where option selection is relevant, rather than appearing during P1 Charter approval.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves UI behavior changes for the phase workspace shell. The change is presentation-only and preserves existing upload, evidence, gate, and Approve & Build API contracts.

## Client Applicability

- All clients: Strategic Moves users whose tenants have the Moves phase shell enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves shell availability path; no new flag is introduced.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Compact P1-P5 approval supporting detail into disclosure rows.
  - Keep P0 behavior separate because P0 approval has different consequences.
  - Restrict the optional key design decision recorder to P3-P5.
  - Reduce main canvas side padding and rail width slightly so the center workspace uses available width better.

## QA / Validation

Candidate validation:

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` fails on current `origin/main` Home graph dependency resolution outside this Moves change (`@xyflow/react`, `@dagrejs/dagre`).
- Pass: `npm run release:check`
- Pass: `git diff --check`

Live validation after deploy:

- Pending: signed-in FS Demo or Meridian Move phase page shows the compact approval surface.
- Pending: P1 approval no longer shows unrelated key-design-decision UI.
- Pending: P2-P5 approval supporting detail is reachable through disclosure rows.
- Pending: Existing upload, Files & Evidence, Phase Intelligence, and Approve & Build controls still render.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the image to `app.abarva.ai`. Verify ACA runtime invariant and then run signed-in browser proof on a sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: to be recorded after deploy
- ACA runtime invariant: required before live-proven status
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR or roll back the ACA revision to the previous known-good digest. No schema, migration, or data changes are included.

## Audit Evidence

To be recorded:

- PR URL
- Merge SHA
- ACA revision and digest
- Signed-in screenshots for P1 and P2 approval views

## Known Gaps

- This is not the full Moves UX redesign.
- It does not implement client-approved deliverable supersession.
- It does not change document-generation prompt length or quality controls.
- It does not change evidence readiness or gate evaluation semantics.
