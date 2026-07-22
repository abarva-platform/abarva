# 2026-07-22 Moves Approval UX Declutter

## Release ID

`2026-07-22-moves-approval-ux-declutter`

## Status

`live-proven`

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
- Pass: GitHub PR checks for PR #5280, including ESLint, typecheck + reasoning-layer tests, production readiness gate, browser matrix smoke, public axe accessibility, Lighthouse CI budget, bundle budget, release control gate, and hygiene gate.

Live validation after deploy:

- Pass: ACA main deploy run `29896419367` completed successfully for merge SHA `60dcbffda2103c7e165d98e5f2dc6b15cd0378f0`.
- Pass: ACA runtime invariant confirmed on revision `ca-abarva-web-lab-eastus--m60dcbffd` with 100% traffic and image `acrabarvalab001.azurecr.io/abarva/web@sha256:b15e179c76bd83f5566ab46b17b0c03b0c484d3c336d9c4d62c2bd4d5c03010e`.
- Pass: `https://app.abarva.ai/api/health` returned `ok: true` with Postgres checks healthy.
- Pass: signed-in Meridian browser proof showed P0, P2, and P4 using the Finder-style shell with no old long session-pack blocks.
- Pass: signed-in Meridian P1 approval proof showed no unrelated key-design-decision UI and no old long session-pack block.
- Pass: Stage workspace, Files & Evidence, Phase Intelligence, and Approvals workspace links switched live with no browser console errors and no non-aborted network failures.
- Pass: P2/P4 approval/workflow pages preserve Approve & Build controls while keeping the workflow rows central.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the image to `app.abarva.ai`. Verify ACA runtime invariant and then run signed-in browser proof on a sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: `sha256:b15e179c76bd83f5566ab46b17b0c03b0c484d3c336d9c4d62c2bd4d5c03010e`
- ACA runtime invariant: confirmed on `ca-abarva-web-lab-eastus--m60dcbffd`
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR or roll back the ACA revision to the previous known-good digest. No schema, migration, or data changes are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5280
- Merge SHA: `60dcbffda2103c7e165d98e5f2dc6b15cd0378f0`
- Deploy run: https://github.com/abarva-platform/abarva/actions/runs/29896419367
- ACA revision: `ca-abarva-web-lab-eastus--m60dcbffd`
- ACA image digest: `sha256:b15e179c76bd83f5566ab46b17b0c03b0c484d3c336d9c4d62c2bd4d5c03010e`
- Local signed-in proof bundle: `proof/moves-approval-ux-live-20260722`
- Screenshots captured:
  - `04-p2-meridian-readonly.png`
  - `05-p4-meridian-readonly.png`
  - `09-p1-meridian-approval-readonly.png`
  - `workspace-files-evidence.png`
  - `workspace-phase-intelligence.png`
  - `workspace-approvals.png`

## Known Gaps

- This is not the full Moves UX redesign.
- It does not implement client-approved deliverable supersession.
- It does not change document-generation prompt length or quality controls.
- It does not change evidence readiness or gate evaluation semantics.
