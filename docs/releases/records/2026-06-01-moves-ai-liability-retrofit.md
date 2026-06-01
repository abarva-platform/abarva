# 2026-06-01-moves-ai-liability-retrofit — Moves Human Decision Controls

## Release ID

`2026-06-01-moves-ai-liability-retrofit`

## Status

`candidate`

## Plain-English Summary

Moves phase advancement now requires a human rationale before a gate can be approved or a phase can advance. The approval path also records a shared AI decision-support evidence packet so reviewers can see the AI recommendation, reviewer identity, rationale, assumptions, alternatives, and evidence references. Moves deliverables are visibly marked as AI drafts so operators treat generated briefs and next steps as decision-support material that must be reviewed before commitment.

## Layer Impact

- `global-control-lane`: Adds shared runtime controls to Moves phase-gate APIs, the agent phase-advance tool, and the Moves workspace UI for all clients.
- `internal-admin`: Updates the pilot readiness tracker to show T235-T237 as actively in branch execution.

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
- `src/components/programs/PhaseAdvanceButton.tsx` opens a human-rationale commit step before the phase-advance API call.
- `src/components/programs/ProgramDetailPage.tsx` adds the human decision attestation to gate approval UI, enforces the rationale bar in inline approvals, and labels Moves deliverables as AI drafts.
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` marks T235-T237 as in progress for this branch.

## QA / Validation

- Passed: `npx jest src/lib/programs/__tests__/moves-ai-liability.test.ts src/app/api/programs/phase-gate/__tests__/route.test.ts 'src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts' src/lib/agent/tools/__tests__/advancePhase.test.ts src/components/programs/__tests__/PhaseAdvanceButton.test.tsx --runInBand`
- Passed: `npx jest src/lib/agent/tools/__tests__/advancePhase.test.ts --runInBand`
- Passed: `./node_modules/.bin/tsc --noEmit --pretty false`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI is green. The controls activate immediately with the normal Vercel deployment because the changed paths are runtime application code and shared library code. No database migration or manual tenant action is required.

## Rollback Plan

Revert the merge commit. This restores the prior phase-gate request contracts and removes the branch tracker notes. No migration rollback is required.

## Audit Evidence

- Pull request: https://github.com/anandsundaram-hash/abarva/pull/2719
- Local focused Jest and TypeScript validation listed above.
- Release record: this file.
- Tracker evidence: `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` rows T235-T237.

## Known Gaps

This release does not complete the broader cross-module catalog rows T231-T232, Source rows T238-T240, Tower rows T241-T243, or live legal/counsel sign-off. It also does not add a database migration for a new approval evidence table; the evidence packet is carried through the existing gate entry, audit refs, approval context, and program snapshot paths.
