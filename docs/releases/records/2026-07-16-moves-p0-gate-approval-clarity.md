# 2026-07-16-moves-p0-gate-approval-clarity — P0 Gate Approval Clarity

## Release ID

`2026-07-16-moves-p0-gate-approval-clarity`

## Status

`candidate`

## Plain-English Summary

Moves P0 could show all seven Originate answers as captured while the Gate approval checklist still showed several open checks. Clicking Approve could appear to do nothing because the user stayed on the same P0 screen and the gate error was not explained clearly. This release aligns P0 gate evaluation with the saved seven-answer charter, separates hard gate blockers from soft carry-forward caveats, explains which checks are completed by approval itself, and routes the user to the next phase after successful approval.

Follow-up live proof showed one more UI-state gap: opening an already-completed P0 URL after the Move advanced to P1 still displayed an active approval button and current-phase gate criteria. This release now also renders completed historical phases as read-only with a direct Continue-to-current-phase action.

Final copy polish fixes the already-approved message spacing so the current-phase label reads cleanly.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves P0 gate evaluation and phase workspace behavior for all tenants.
- Runtime data reads: P0 gate evaluation now reads the existing saved Move charter/scaffold fields in addition to signed brief text and approval snapshots.
- Runtime data writes: No new write path beyond the existing P0 gate approval and phase advancement paths.
- No data-layer/candidate impact: Does not promote candidate data, read candidate preview context, update Active Tenant Access, or change Home/module context behavior.

## Client Applicability

- All clients: Yes, for Strategic Moves P0 Originate gate approval.
- Specific clients: Meridian Health is the live reproduction tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/governance.ts`
  - Reads saved P0 charter/scaffold fields for problem, value hypothesis, sponsor/title, scope, evidence family, and foundation readiness.
  - Keeps `program_seed_recorded` tied to the signed origination brief, but no longer relies on brittle generated-brief keyword matching for the rest of the P0 gate.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Separates hard gate criteria from soft carry-forward criteria.
  - Explains that the P0 seed and value checks are completed by approving the gate.
  - Shows blocked/approved/approving messages with visible status styling.
  - Redirects to the approved next phase when the gate approval API returns `newPhase`.
  - Shows already-approved historical phases as read-only and routes the user back to the current phase instead of rendering another approval loop.
  - Fixes spacing in the already-approved continuation message.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
  - Adds regression coverage for the Meridian-style seven-answer P0 charter.
  - Updates the test fake to support the real `.in('phase', ...)` evidence query shape.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds regression coverage for viewing completed P0 after the Move has advanced to P1.

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/lib/programs/governance.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: signed-in browser proof after ACA deployment showed P0 capture complete, approved, and advanced to P1.
- Pending: signed-in browser proof after the historical-phase read-only follow-up deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After deploy, verify the Meridian P0 gate URL shows already-approved P0 as read-only, hides the stale approval loop, offers Continue to P1 Charter, and confirms the read-only gate API reports P0 approved/current phase P1.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior digest-pinned ACA image. No schema rollback is required.

## Audit Evidence

- Initial PR URL: https://github.com/abarva-platform/abarva/pull/4900
- Initial ACA revision: `ca-abarva-web-lab-eastus--m03502ae6`
- Initial image digest: `sha256:5e79f6246baa44fcfac7c948b97b05cf6ea80b102d35ebc4a4e73a0444a1f737`
- Initial live proof bundle: `proof/moves-p0-gate-approval-clarity-live-2026-07-16T19-55-03Z`
- Follow-up PR URL: Pending.
- Follow-up ACA revision: Pending.
- Follow-up live proof bundle: Pending.
- Copy-polish PR URL: Pending.

## Known Gaps

This release does not change P1-P5 gate criteria, data-layer extraction, candidate promotion, or Tower outcome claims.
