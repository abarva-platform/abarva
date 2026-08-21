# 2026-08-21-move-satisfied-gate-close — Move Satisfied Gate Close

## Release ID

`2026-08-21-move-satisfied-gate-close`

## Status

`candidate`

## Plain-English Summary

When a Move phase already has every hard gate satisfied, the workspace now lets an authorized runner submit the phase gate directly instead of re-running artifact generation first. This keeps approval gates intact while avoiding duplicate generation after the required outputs are already on file.

## Layer Impact

- Lane: `global-control-lane`.
- Product layer: Updates the Moves approval workspace behavior for already-satisfied phase gates.
- Canonical/data layer: No schema change and no loader change. The existing phase-gate approval endpoint remains the authoritative writer.

## Client Applicability

- All clients: Yes, for Moves users with phase-gate approval rights.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` renders a direct gate-close confirmation when the current phase has no open hard criteria.
- The direct close path reuses the existing phase-gate approval handler; it does not create deliverables or bypass gate evaluation.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — 67/67 tests passed.
- Pass: `npx tsc --noEmit`.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through a PR to `main`; the repo-owned ACA main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify an already-satisfied gate can close without regenerating artifacts.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. The existing generate-and-poll path remains unchanged for phases that still have open hard criteria.

## Audit Evidence

- PR: Pending.
- Local validation: targeted Jest, TypeScript, ESLint, and release check passed before PR.
- Runtime proof: Pending.

## Known Gaps

This does not change gate rules, role policy, deliverable generation, or artifact quality validation. It only changes the UI path used after hard gates are already satisfied.
