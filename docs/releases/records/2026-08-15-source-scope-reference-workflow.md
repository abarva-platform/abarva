# 2026-08-15-source-scope-reference-workflow — Source Scope Reference Workflow

## Release ID

`2026-08-15-source-scope-reference-workflow`

## Status

`candidate`

## Plain-English Summary

This release makes Scope the first production-quality reference implementation for the simplified New Event workflow. The live Source canvas now presents Scope as a clear sequence of local work branches, shows the exact required and optional evidence from the canonical registry, marks uploaded/done items with visible checks, and keeps one forward action toward the approval gate.

This is a Scope-only UX/workflow slice. It does not change workflow persistence, schema, tenant data, parser ingestion, approval automation, authentication, membership, vendor messaging, or data-plane writes.

## Layer Impact

- Layer 4 Products: updates the reachable Source event canvas and the Source shell view model used by that canvas.
- Layers 1-3: no client intake, adapter, canonical model, schema, loader, or data-plane changes.

## Client Applicability

- All clients: yes, for the shared Source Scope canvas after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none introduced.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`
  - Renames Scope local work groups to plain purpose labels: Work in scope, Work out of scope, Owners, Baseline evidence, Approval.
  - Keeps the change Scope-specific; other stages continue to use the existing grouping logic.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
  - Adds a compact Scope gate-readiness strip inside the focused work canvas.
  - Reuses canonical evidence requirements, simple-stage screen resolution, gate auto-assessment, stage requirement coverage, and evidence lifecycle status to summarize readiness.
  - Simplifies the active evidence table columns around evidence item, required/optional, source/owner, format, template, upload, parse, done, and next action.
  - Reuses the Files-tab row model so active workflow and Files readiness do not drift.
- Tests updated:
  - `src/lib/source/__tests__/source-event-shell-v2.test.ts`
  - `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
  - `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx --runInBand`
  - Result: 3 suites passed, 43 tests passed.
  - Note: Jest printed existing duplicate manual mock warnings for markdown/GFM mocks.
- Pass: `npm run qa:source-new-event-journey-smoke`
  - Result: 1 suite passed, 12 tests passed.
- Pass: `npm run qa:source-stage-shell-layout`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- Pass: `npx eslint src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Open a PR and merge through the protected `main` branch. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. After deployment, run the ACA runtime invariant and signed-in browser/DOM proof on a real Source Scope event before claiming the change is live.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR; do not use ad-hoc ACA traffic mutation.
- Approved image digest: pending main deploy.
- ACA runtime invariant: pending main deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the reachable Scope canvas after deployment.

## Rollback Plan

Revert the PR. No schema, persistence, data-plane, parser, auth, membership, or approval automation rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy: pending.
- Runtime invariant: pending.
- Signed-in Scope browser/DOM proof: pending.
- Local focused proof: 3 Jest suites passed, 43 tests passed.
- Local focused lint: passed on touched implementation and test files.

## Known Gaps

- This is Scope only. The pattern should be generalized to the other 10 stages only after Scope is reviewed and the 11-stage smoke continues to protect layout/navigation regressions.
- `ScopeAnalyticsStage.tsx` and `ScopeGate.tsx` are older analytics components that are not mounted by the live route. This release does not repurpose them. Deleting or archiving them should be handled as a separate cleanup slice because deletion is outside this Scope reference implementation.
- Files tab upload still routes through the existing generic session evidence capture. This release clarifies what to upload and how readiness is shown; it does not add new parser ingestion or requirement-specific upload persistence.
- Approval persistence and durable evidence acceptance remain separate governed slices.
