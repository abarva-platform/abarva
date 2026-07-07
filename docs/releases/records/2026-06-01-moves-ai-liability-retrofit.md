# 2026-06-01-moves-ai-liability-retrofit — Moves Human Decision Controls

## Release ID

`2026-06-01-moves-ai-liability-retrofit`

## Status

`candidate`

## Plain-English Summary

Moves phase advancement now requires a human rationale before a gate can be approved or a phase can advance. The approval path also records a shared AI decision-support evidence packet so reviewers can see the AI recommendation, reviewer identity, rationale, assumptions, alternatives, and evidence references. Moves deliverables are visibly marked as AI drafts so operators treat generated briefs and next steps as decision-support material that must be reviewed before commitment.

## Layer Impact

- `global-control-lane`: Adds shared runtime controls to Moves phase-gate APIs, the agent phase-advance tool, and the Moves workspace UI for all clients.
- `internal-admin`: Updates the pilot readiness tracker to show T235-T237 as completed for this branch while leaving broader persistence/legal sign-off rows unchanged.

## Client Applicability

- All clients: Moves approval and phase-advance behavior receives the rationale/evidence controls.
- Specific clients: None.
- Internal only: Pilot readiness tracker status notes.
- Public/demo only: None.
- Feature flag: Existing `GATE_APPROVAL_STRICT_MODE` behavior remains intact; this release does not add a new flag.

## Changes Included

- `src/lib/programs/moves-ai-liability.ts` centralizes Moves rationale validation, phase-decision evidence packet construction, audit references, and snapshot enrichment.
- `src/app/api/programs/phase-gate/route.ts` requires human rationale, stores it in the phase-gate entry, writes audit evidence refs, and returns the evidence packet.
- `src/app/api/v1/programs/[programId]/advance/route.ts` requires human rationale for phase advance and passes evidence metadata into the program snapshot.
- `src/lib/agent/tools/program/advancePhase.ts` rejects agent phase-advance calls that do not include a human rationale and records decision-support metadata when advancing.
- `src/app/api/reasoning/gate-approval/route.ts` enforces the same minimum rationale bar for gate approval.
- `src/app/api/reasoning/audit/route.ts` exposes the decision evidence packet reference in approval audit output when present.
- `src/lib/programs/deliverable-canvas-polish-view.ts` carries AI Draft and edit-before-commit requirements in the Moves deliverables view model.
- `src/components/programs/PhaseAdvanceButton.tsx` opens a human-rationale commit step before the phase-advance API call.
- `src/components/programs/ProgramDetailPage.tsx` adds the human decision attestation to gate approval UI, enforces the rationale bar in inline approvals, and labels Moves deliverables as AI drafts.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` and `src/components/strategic-moves/GeneratePhasePackage.tsx` now expose the same AI Draft, edit-before-commit, and human decision-support labels on the production Strategic Moves document and phase-generation surfaces.
- `src/lib/programs/strategic-move-route-params.ts` rejects legacy slug-like route ids before Strategic Moves database reads so `/programs/:legacySlug` redirects do not become production 500s.
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` marks T235-T237 as done with implementation notes.

## QA / Validation

- Passed: `npx jest src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx src/lib/programs/__tests__/strategic-move-route-params.test.ts --runInBand`
- Passed: `npx jest src/lib/programs/__tests__/strategic-move-route-params.test.ts src/lib/programs/__tests__/deliverable-canvas-ai-draft.test.ts --runInBand`
- Passed: `npx jest src/lib/programs/__tests__/moves-ai-liability.test.ts src/lib/programs/__tests__/deliverable-canvas-ai-draft.test.ts src/app/api/programs/phase-gate/__tests__/route.test.ts 'src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts' src/lib/agent/tools/__tests__/advancePhase.test.ts src/components/programs/__tests__/PhaseAdvanceButton.test.tsx --runInBand`
- Passed: `npx jest src/components/programs/__tests__/PhaseAdvanceButton.test.tsx --runInBand`
- Passed: `./node_modules/.bin/tsc --noEmit --pretty false`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `npm run audit:runtime-supabase-imports:guard` (only allowlisted `src/lib/supabase-server.ts` runtime helper import remains; broad legacy string matches are not runtime imports).
- Passed: tracker inspection for `Plan!A25:M27` in both `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx`; T235-T237 are `Done`.

## Rollout Plan

Merge to main after CI is green. The controls activate immediately with the normal Vercel deployment because the changed paths are runtime application code and shared library code. No database migration or manual tenant action is required.

## Rollback Plan

Revert the merge commit. This restores the prior phase-gate request contracts and removes the branch tracker notes. No migration rollback is required.

## Audit Evidence

- Pull request: https://github.com/anandsundaram-hash/abarva/pull/2719
- Pull request: https://github.com/anandsundaram-hash/abarva/pull/2721
- Follow-up branch: `codex/moves-liability-prod-surface-fix`
- Local focused Jest and TypeScript validation listed above.
- Release record: this file.
- Tracker evidence: `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` rows T235-T237.

## Known Gaps

This release does not complete the broader cross-module catalog rows T231-T232, Source rows T238-T240, Tower rows T241-T243, or live legal/counsel sign-off. It also does not add a database migration for a new approval evidence table; the evidence packet is carried through the existing gate entry, audit refs, approval context, and program snapshot paths.
