# 2026-08-10-source-event-stage-tree-handoff — Source Event Stage Tree Handoff

## Release ID

`2026-08-10-source-event-stage-tree-handoff`

## Status

`candidate`

## Plain-English Summary

Source event stage pages now make the path from evidence collection to approval explicit. The shared event shell renders a grouped stage tree on the left, shows the active evidence group as a clear row-by-row checklist on the right, and turns a fully ready stage into a direct handoff to the event approval page instead of leaving the user on a completed step.

## Layer Impact

- `global-control-lane`: updates the shared Source event shell and approval handoff behavior for all Source event stages.
- `client-data-lane`: no schema, migration, seed, or data mutation. The UI continues to read the existing Source event task, artifact, and approval projections.

## Client Applicability

- All clients: yes, for Source event detail pages where the Source analytics shell is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: uses the existing Source analytics event-shell route behavior.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`: adds stage approval route metadata and clearer readiness copy.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: adds a global grouped substep rail, evidence-request table, stage-ready panel, and approval-page CTA.
- `src/components/source/canvas/analytics/ScopeGate.tsx`: aligns the older gate button with the standalone event approval page route.
- Focused Source shell tests updated to lock the approval-page handoff behavior.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` — 30/30 tests passed. Jest printed existing duplicate manual mock warnings.
- PASS: `npx eslint src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/ScopeGate.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `git diff --check`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: `npm run release:check`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`.
- PENDING: PR/deploy and signed-in browser smoke.

## Rollout Plan

Open a PR, merge through the repository rules, and allow the repo-owned Azure Container Apps main deploy workflow to publish the new web image. After deployment, run signed-in browser smoke on a representative Source event stage: incomplete stage should show evidence rows and a locked approval handoff; complete stage should show the direct event approval page CTA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The change is UI/read-model only and introduces no database migration or data mutation.

## Audit Evidence

- Focused Jest output: Source shell and chat behavior tests passed.
- Focused ESLint output: clean.
- TypeScript output: clean.
- Diff whitespace check: clean.
- Release control output: clean.
- Production build output: clean with webpack and an 8GB Node heap.
- Browser smoke evidence: pending deployment.

## Known Gaps

- Live signed-in browser proof is still required after deployment before this can be called live-proven.
