# 2026-08-15-source-rfp-operating-workflow - Source RFP Operating Workflow

## Release ID

`2026-08-15-source-rfp-operating-workflow`

## Status

`candidate`

## Plain-English Summary

This release applies the Scope and Strategy reference workflow pattern to the RFP stage of New Event. RFP now shows a purpose-first local branch, keeps the active canvas focused on the RFP release task, and surfaces canonical RFP evidence readiness so the user can see what must be loaded before moving toward Responses.

Follow-up ready-state fix: keep the same RFP gate-readiness strip visible after local RFP inputs are complete and the canvas switches to the stage-ready review state, so the user still sees what the RFP package unlocks and what canonical evidence remains before approval.

This is an RFP-only UX/workflow slice. It does not change workflow persistence, schema, tenant data, parser ingestion, approval automation, authentication, membership, vendor messaging, vendor dispatch, or data-plane writes.

## Layer Impact

- Layer 4 Products: updates the reachable Source event canvas and Source shell view model used by that canvas.
- Layers 1-3: no client intake, adapter, canonical model, schema, loader, or data-plane changes.

## Client Applicability

- All clients: yes, for the shared Source RFP canvas after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none introduced.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
  - Adds an RFP-specific local work group label so the left tree names the RFP release package instead of falling back to generic evidence wording.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
  - Reuses the stage gate-readiness panel for RFP.
  - Keeps the RFP gate-readiness panel visible in the stage-ready state when local RFP inputs are already complete.
  - Keeps the panel backed by canonical evidence requirements, simple-stage screen resolution, gate auto-assessment, and requirement coverage.
  - Does not add vendor release, live parser ingestion, approval automation, or durable upload persistence.
- Tests updated:
  - `src/lib/source/__tests__/source-event-shell-v2.test.ts`
  - `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand`
  - Result: 3 suites passed, 48 tests passed.
  - Note: Jest printed existing duplicate manual mock warnings for markdown/GFM mocks.
- Pass: `npm run qa:source-new-event-journey-smoke`
  - Result: 1 suite passed, 15 tests passed.
  - Note: Jest printed existing duplicate manual mock warnings for markdown/GFM mocks.
- Pass: `npm run qa:source-stage-shell-layout`.
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`.
- Pass: `npx eslint src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Open a PR and merge through the protected `main` branch. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deployment, run the ACA runtime invariant and signed-in browser/DOM proof on a real Source RFP event before claiming the change is live.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR; do not use ad-hoc ACA traffic mutation.
- Approved image digest: pending main deploy.
- ACA runtime invariant: pending main deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the reachable RFP canvas after deployment.

## Rollback Plan

Revert the PR. No schema, persistence, data-plane, parser, auth, membership, vendor dispatch, or approval automation rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy: pending.
- Runtime invariant: pending.
- Signed-in RFP browser/DOM proof: pending.
- Local focused proof: 3 Jest suites passed, 48 tests passed.
- Local 11-stage smoke proof: 1 Jest suite passed, 15 tests passed.
- Local shell layout harness: passed.
- Local typecheck, focused lint, diff check, and release check: passed.

## Known Gaps

- This is RFP only. `SRC63`-`SRC70` will generalize the same operating model to Responses, Evaluation, Pricing, BAFO, Executive Decision, Selection, Transition, and Value one stage at a time.
- RFP still uses the existing upload/readiness plumbing. This release clarifies what evidence is required and how readiness is shown; it does not add live parser ingestion, requirement-specific upload persistence, or vendor dispatch.
- Approval persistence and durable evidence acceptance remain separate governed slices.
