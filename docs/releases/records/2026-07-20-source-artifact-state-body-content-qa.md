# 2026-07-20-source-artifact-state-body-content-qa — Score Source artifact-state bodies in Files

## Release ID

`2026-07-20-source-artifact-state-body-content-qa`

## Status

`candidate`

## Plain-English Summary

Source Files now uses authored document bodies from the live Source artifact-state table when the artifact registry row does not expose readable text. This closes the proof gap where generated documents existed in `source_event_artifact_states.body`, but the Files matrix still showed `Content scored 0` because it was reading only the registry/blob path.

## Layer Impact

- `global-control-lane`: Updates the shared Source event shell data adapter for all tenants using the Source Analytics Canvas.
- UI/data binding: The Files matrix receives the same authored artifact bodies that generation and edit flows write to the Source substrate.
- Governance/reporting: Deterministic content QA can now score generated/final body text instead of honestly stopping at `Content not scored` when only the registry shell is present.

## Client Applicability

- All clients: Yes, for Source events rendered through the unified Source Analytics Canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a pure Source shell helper to merge registry artifacts with authored `source_event_artifact_states.body` content.
- Reads artifact states on the Source event route and sends the merged artifact set to task hydration and the Source Analytics Canvas.
- Adds unit coverage for existing registry rows, state-only authored artifacts, and blank-body exclusion.

## QA / Validation

- Pass — focused Source shell/artifact tests: `npm test -- --runInBand src/lib/source/__tests__/source-event-shell-v2.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` (27/27).
- Pass — ESLint on changed files: `npx eslint src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/source-event-shell-v2.test.ts 'src/app/(maestro)/source/events/[eventId]/page.tsx'`.
- Pass — TypeScript compile: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass — release governance: `npm run release:check`.
- Pending — ACA deploy after merge.
- Pending — signed-in production browser proof that the FS Demo Source Files matrix shows at least one `Content scored` artifact.

## Rollout Plan

Merge via PR to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the exact main SHA, then prove the Source event route in a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. The route will return to registry-only artifact content, which is safe but will again leave generated state bodies unscored in the Files matrix.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending.
- ACA deploy: Pending.
- Signed-in screenshot: Pending.

## Known Gaps

This does not generate or approve documents. It only makes already-authored Source substrate bodies visible to deterministic artifact QA.
