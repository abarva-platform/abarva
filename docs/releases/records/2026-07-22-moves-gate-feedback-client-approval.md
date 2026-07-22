# 2026-07-22 Moves Gate Feedback And Client Approval Bridge

## Release ID

`2026-07-22-moves-gate-feedback-client-approval`

## Status

`candidate`

## Plain-English Summary

Moves now tells the user when Approve & Build generated a phase draft but the phase gate is still blocked by a human approval requirement. Generated AI drafts in Files & Evidence can be accepted as authoritative by an approved reviewer, or replaced by an uploaded client-approved final, so the gate evaluates the governed deliverable record instead of leaving the user stuck.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves UI and API behavior changes for Files & Evidence and phase approval feedback.
- `client-data-lane`: Authorized client approval writes update Move-scoped deliverable records and optional approved replacement artifacts. No tenant data is read across tenant boundaries.

## Client Applicability

- All clients: Strategic Moves users whose tenants have the Moves shell enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves shell availability path; no new flag is introduced.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Surfaces a clear blocked state when generation succeeds but phase gate approval returns a hard blocker.
  - Clarifies that uploaded evidence is not authoritative until reviewed or accepted.
- `src/components/strategic-moves/FileCabinetPanel.tsx`
  - Stops direct generated artifacts from invoking the P2 sponsor-review decision endpoint.
  - Adds a client-approval action for AI-prepared generated deliverables.
  - Allows an approver to accept the AI draft or upload an edited client-approved final.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts`
  - Bridges a generated Move artifact into the governed deliverables source of truth.
  - Preserves tenant checks, program checks, authority checks, and source lineage.
  - Aligns P1 client approval with the existing P1 gate authority behavior: when no sponsor participant exists yet, the current governed user is recorded as sponsor before approval. Later phases still require approver/sponsor authority.
  - Uses the shared Moves program-access policy (`canApproveGates`) so tenant-pinned Moves admins and approved automation personas can perform the same governed client-approval action they can perform on phase gates.
  - Writes only Move-scoped authoritative deliverable state.
- Tests updated for gate-blocker feedback, sponsor-review route gating, generated-draft client approval detection, and policy-authorized client approval.

## QA / Validation

Candidate validation:

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/FileCabinetPanel.tsx 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts' src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` fails on current `origin/main` Home graph dependency resolution outside this Moves change (`@xyflow/react`, `@dagrejs/dagre`).
- Pending: `npm run release:check`
- Pending: `git diff --check`
- Pending: PR checks.
- Pending: ACA deploy and signed-in sandbox proof.
- Follow-up live finding after PR #5282: saved FS sandbox agent could reach P1 gate approval but received `403 approver authority or higher required` on the new client-approval bridge. This follow-up aligns the P1 bridge with the existing P1 phase-gate authority initialization path.
- Follow-up live finding after PR #5283: authority initialization was present but ran after the early authorization check. The route now verifies Move-scoped artifact and deliverable phase first, initializes P1 sponsor authority when needed, then enforces the normal approver/sponsor check.
- Follow-up live finding after PR #5284: P1 generated charter cards are labeled as charter deliverables in the Move File Cabinet, but the underlying orchestrator persistence stores Moves outputs as the generic `move_board_pack` artifact container. The client-approval bridge now resolves the registered deliverable key from artifact metadata / renderable document fields first, then applies a narrow title fallback for `move_board_pack` outputs.
- Follow-up live finding after PR #5285: the saved FS sandbox automation persona has the existing Moves program-access policy needed to approve gates, but the new client-approval route still depended only on participant-row `approval_authority`. The route now accepts the same `canApproveGates` policy used by phase-gate approval while preserving participant-row approval as an alternate path.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the image to `app.abarva.ai`. Verify ACA runtime invariant, then run signed-in proof only on the First Capital sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR or roll back the ACA revision to the previous known-good digest. No schema or migration changes are included. The API route can be disabled by rollback without altering existing approved deliverable records.

## Audit Evidence

- PR URL: pending
- Merge SHA: pending
- Deploy run: pending
- ACA revision: pending
- Local production discovery proof bundle: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722`
- Synthetic data pack: `/Users/anand/Downloads/firstcapital-moves-e2e-synthetic-pack-2026-07-22`

## Known Gaps

- This does not change deliverable prompt length or document structure.
- This does not auto-review uploaded evidence.
- This does not make AI-generated drafts authoritative without human action.
- This does not complete the full P0-P5 synthetic E2E run; that proof follows deployment.
