# 2026-07-22 Moves Phase Approval Decision Surface

## Release ID

`2026-07-22-moves-phase-approval-decision-surface`

## Status

`candidate`

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
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA deploy workflow should build and deploy the exact merge SHA to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA runtime invariant and rerun the signed-in First Capital P2 Approve & Build page check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, First Capital sandbox Move P2 Approve & Build page.

## Rollback Plan

Revert this PR or remove the merged commit from the next ACA image. Backend evidence review, generation, and gate logic are unchanged, so rollback only affects the approval-page presentation.

## Audit Evidence

- PR URL: Pending.
- ACA deployment proof: Pending.
- Signed-in browser proof after deploy: Pending.

## Known Gaps

- This does not fix the underlying P2 blocked generated deliverable quality outcome.
- This does not change deliverable prompts, page limits, or the automated document-quality scoring model.
- This does not redesign Files & Evidence or artifact supersession UX.
