# 2026-07-16-moves-p1-posture-not-approach — Moves P1 Charter Posture Correction

## Release ID

`2026-07-16-moves-p1-posture-not-approach`

## Status

`candidate`

## Plain-English Summary

P1 Charter no longer asks the client to choose a solution approach or claims that aVa recommends one. P1 now captures an initial transformation posture to validate during P2 discovery. P3 remains the phase where solution approaches are compared and selected after evidence is collected.

## Layer Impact

- `global-control-lane`: Updates shared Moves phase workspace behavior and copy for all tenants using the phase workspace.
- Product UX contract: Aligns P1 with chartering and keeps evidence-backed solution recommendation in P3.

## Client Applicability

- All clients: Yes, all Moves tenants using the shared phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds P1-only "Initial transformation posture" cards.
  - Keeps P3-only "Decide the approach" cards and recommendation language.
  - Changes phase capture wording so P1 records a posture to validate, not a selected approach.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds regression coverage proving P1 does not render solution approach recommendation language.
  - Adds regression coverage proving P3 still owns solution approach selection.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - 16 tests passed.
  - Added regression coverage proving P1 renders "Initial transformation posture" and does not render "Decide the approach", "Phased platform + operating-model shift", or "aVa recommends".
  - Added regression coverage proving P3 still renders solution approach selection and recommendation language.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for markdown/GFM mocks; the targeted suite still passed.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No schema migration or data backfill is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None outside the main deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, verify a P1 Move shows posture language and P3 still shows approach selection.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image through the repo-owned deploy workflow. Since this is UI/copy behavior only, rollback has no data migration dependency.

## Audit Evidence

- PR URL: Pending.
- Validation output: Pending.
- Live proof: Pending.

## Known Gaps

P3 approach options are still static cards in this slice. Dynamic domain/use-case-specific P3 option generation remains follow-up work.
