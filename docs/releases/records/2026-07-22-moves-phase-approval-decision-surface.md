# 2026-07-22 Moves Phase Approval Decision Surface

## Release ID

`2026-07-22-moves-phase-approval-decision-surface`

## Status

`released`

## Plain-English Summary

The First Capital sandbox end-to-end run showed that P2 could truthfully block on open hard gates, but the approval page still read like a long system ledger. This release turns phase approval into a decision surface: the page now starts with whether the phase can advance, which evidence supports the decision, which blockers remain, and what the next phase needs. The underlying gate, evidence, and Approve & Build behavior is unchanged.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves phase-shell presentation for phase approval.
- `client-data-lane`: No schema, ingestion, retrieval, evidence policy, candidate-promotion, or tenant data behavior changes.

## Client Applicability

- All clients: Applies wherever the Moves phase shell is active.
- Specific clients: Validated first against the First Capital FS Demo sandbox Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves shell rollout path; this PR does not add a new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds a decision-first approval readout with explicit ready, blocked, and complete states.
  - Moves the mechanical gate execution checklist into a disclosure section.
  - Keeps the governed Approve & Build call path unchanged.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds regression coverage that blocked approval pages show a decision blocker instead of reading as ready.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Result: 44 passed / 44 total.
  - Notes: Existing duplicate Jest mock warnings and the existing `EvidenceUploadControl` act warning still appear.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: GitHub PR checks on PR #5291, including typecheck, release record, architecture rules, route/disclaimer, browser smoke, and production-readiness gates.
- Pass: signed-in First Capital sandbox proof on `https://app.abarva.ai/strategic-moves/4bf889aa-d4ee-4c1d-936b-51574614d191/phase/2`.
  - The P2 Approve & Build tab rendered the decision-first surface.
  - Visible proof showed `P2 cannot advance yet`, `3/5 hard gates met`, `6 evidence items`, `OPEN BLOCKERS`, `NEXT PHASE READINESS`, and the collapsed/expandable `Gate execution checklist`.
  - The stale `100% ready · Approve & Build` copy was absent.
  - Browser proof captured zero console errors and zero failed non-prefetch network requests.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA deploy workflow should build and deploy the exact merge SHA to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA runtime invariant and rerun the signed-in First Capital P2 Approve & Build page check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Merge SHA: `c77df5ba156a8d59566b8104b44ce4f39622403e`.
- ACA deploy workflow run: `29915437829`.
- ACA revision: `ca-abarva-web-lab-eastus--mc77df5ba`.
- Approved image digest: `sha256:cdd734ae407e6b829af55d0cf3041379f89f448d4cc3e87f4956c4abf1a62efe`.
- ACA runtime invariant: Pass. `ca-abarva-web-lab-eastus--mc77df5ba` receives 100% traffic and runs the digest above.
- Worker image invariant: Pass in deploy workflow; worker jobs were updated to the same image by the repo-owned deploy lane.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Complete, First Capital sandbox Move P2 Approve & Build page.

## Rollback Plan

Revert this PR or remove the merged commit from the next ACA image. Backend evidence review, generation, and gate logic are unchanged, so rollback only affects the approval-page presentation.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5291
- ACA deployment proof: https://github.com/abarva-platform/abarva/actions/runs/29915437829
- Runtime invariant: `ca-abarva-web-lab-eastus--mc77df5ba`, 100% traffic, digest `sha256:cdd734ae407e6b829af55d0cf3041379f89f448d4cc3e87f4956c4abf1a62efe`.
- Health proof: `https://app.abarva.ai/api/health` returned `ok: true`, with Postgres and direct Postgres checks true.
- Signed-in browser proof after deploy:
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/50-post-decision-surface-p2-approve-build-proof.json`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/50-post-decision-surface-p2-approve-build.png`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/51-post-decision-surface-gate-checklist-expanded.png`

## Known Gaps

- This does not fix the underlying P2 blocked generated deliverable quality outcome.
- This does not change deliverable prompts, page limits, or the automated document-quality scoring model.
- This does not redesign Files & Evidence or artifact supersession UX.
