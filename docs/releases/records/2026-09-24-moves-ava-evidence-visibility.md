# 2026-09-24-moves-ava-evidence-visibility — Moves aVa Evidence Visibility

## Release ID

`2026-09-24-moves-ava-evidence-visibility`

## Status

`candidate`

## Plain-English Summary

Moves aVa now counts evidence already loaded for the active workspace when building its deterministic guidance packet. An empty linked-evidence relation no longer causes aVa to tell the user that zero evidence is visible when the page context or current Move context extract already loaded attached evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates the Moves chat grounding path so visible workflow guidance matches the workspace evidence context already loaded by the route.

## Client Applicability

- All clients: Moves users with aVa chat enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves aVa hardening flag controls whether the packet is injected.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts`
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `src/lib/programs/ava-chat/evidence-count.ts`
- `src/lib/programs/ava-chat/__tests__/evidence-count.test.ts`

## QA / Validation

- `npm run test -- --runTestsByPath src/lib/programs/ava-chat/__tests__/evidence-count.test.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts --runInBand` — passed.
- `npm run test -- --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/ava-chat/__tests__/evidence-count.test.ts src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts --runInBand` — passed.
- `npx eslint src/app/api/chat/agent/route.ts 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx' src/lib/programs/ava-chat/evidence-count.ts src/lib/programs/ava-chat/__tests__/evidence-count.test.ts src/app/api/chat/agent/__tests__/moves-ava-scoped-context-gate.test.ts` — passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: No change.
- Live signed-in proof required: Yes, retest Moves aVa guidance on the active smoke-test Move.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL: To be filled after PR creation.
- Local smoke evidence: `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/post8384-live-p5-ava-guidance-checks.json`
- Follow-up smoke evidence: `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/post8386-live-p5-ava-guidance-checks.json`

## Known Gaps

This does not change evidence storage or gate decisions; it only fixes the aVa packet count used for chat guidance. The current page route now forwards the Move context extract attached-evidence count into chat surface context so guidance no longer depends only on legacy linked evidence or request evidence arrays.
The standalone Moves phase aVa composer also forwards the same count; this closes the separate local chat path used by the phase page's embedded aVa panel.
