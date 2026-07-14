# 2026-07-13-moves-p0-origination-shell — Moves P0 Shared Shell

## Release ID

`2026-07-13-moves-p0-origination-shell`

## Status

`candidate`

## Plain-English Summary

Moves P0 origination now uses the same shared phase workspace shell as P1-P5 instead of a bespoke chat-first layout. The left phase explorer shows P0 through P5, the main canvas carries the seven P0 questions in three compact tabs, and aVa is available through the shared AgentDock rather than owning the page. P0 also supports direct field entry without chat, short strategic Move names, and role/title-only sponsor capture.

## Layer Impact

- Product UI: Replaces the standalone P0 layout with the shared Moves phase shell and compact grouped question canvas.
- Agent workflow: Keeps aVa available through the shared AgentDock and passes current P0 brief state into the agent context.
- Control-plane submission: Allows role/title sponsor capture at P0 and derives short strategic Move names before promotion.
- Test coverage: Updates P0 tests to cover shared dock usage, direct field submission, short-name derivation, and role/title sponsor submission.

## Client Applicability

- All clients: Yes, for the Strategic Moves P0 origination surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/MovePhaseExplorer.tsx`
- `src/components/strategic-moves/MovePhaseExplorer.module.css`
- `src/components/strategic-moves/StrategicMoves.module.css`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- `src/lib/programs/phase-explorer-tallies.ts`
- `src/lib/programs/__tests__/phase-explorer-tallies.test.ts`
- `src/lib/programs/origination-submit.ts`
- `src/lib/programs/__tests__/origination-submit-contract.test.ts`
- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts` (CI hygiene: preserve placeholder-token detection while avoiding a literal placeholder text violation)

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/lib/programs/origination-submit.ts src/lib/programs/__tests__/origination-submit-contract.test.ts`
- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts src/lib/programs/__tests__/person-label.test.ts --runInBand`
- Pass: `npx jest src/lib/programs/__tests__/phase-explorer-tallies.test.ts --runInBand`
- Pass: `npm run integrity:dom`
- Pass: `npx tsc --noEmit --pretty false`

## Rollout Plan

Open a PR against `abarva-platform/abarva`, squash merge to `main`, then allow the repo-owned ACA main deploy workflow to build and deploy the exact merged SHA to `ca-abarva-web-lab-eastus`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this release.
- Approved image digest: Pending main deploy workflow.
- ACA runtime invariant: Required before marking live-proven.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, verify `/strategic-moves/new` with a signed-in session and confirm P0 uses the left explorer, grouped questions, AgentDock, direct field capture, and title-only sponsor promotion.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4770.
- ACA revision: Pending.
- Live signed-in proof: Pending.
- Local validation: commands listed in QA / Validation.

## Known Gaps

- Candidate is not live-proven until merged, deployed through ACA, and browser-verified in a signed-in session.
