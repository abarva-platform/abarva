# 2026-07-20-source-artifact-state-body-content-qa — Score Source artifact-state bodies in Files

## Release ID

`2026-07-20-source-artifact-state-body-content-qa`

## Status

`released`

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
- Pass — PR checks for #5124: all GitHub checks passed before merge, including ESLint, Typecheck + reasoning-layer tests, Chrome Firefox Safari mobile smoke, production readiness, Lighthouse budget, public axe accessibility, release record, and hygiene gates.
- Pass — ACA deploy after merge: run `29730725194` completed successfully for main SHA `3e2b05ef66a480b56b4b1ee95c14cba8fa29024e`.
- Pass — signed-in production browser proof: FS Demo Source event `/source/events/dcd31955-e1ac-416b-8c3b-52b83e8650de?stage=scope`, Files workspace, artifact lifecycle matrix reported `CONTENT SCORED 1`, `CONTENT BLOCKERS 3`, `CONTENT WARNINGS 0`; screenshot saved to `/Users/anand/Downloads/source-5124-live-artifact-state-body-content-qa.png`.

## Rollout Plan

Merge via PR to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the exact main SHA, then prove the Source event route in a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:0abd25ff083165accee8368297493c365739d520fb8be8956a14e1c3c58c6284`
- ACA runtime invariant: Passed in deploy run `29730725194`; 100% traffic holder `ca-abarva-web-lab-eastus--m3e2b05ef`.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed.

## Rollback Plan

Revert the PR. The route will return to registry-only artifact content, which is safe but will again leave generated state bodies unscored in the Files matrix.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5124`
- CI checks: `https://github.com/abarva-platform/abarva/pull/5124/checks`
- ACA deploy: `https://github.com/abarva-platform/abarva/actions/runs/29730725194`
- Production revision: `ca-abarva-web-lab-eastus--m3e2b05ef`
- Signed-in screenshot: `/Users/anand/Downloads/source-5124-live-artifact-state-body-content-qa.png`
- Signed-in proof counters: `CONTENT SCORED 1`, `CONTENT BLOCKERS 3`, `CONTENT WARNINGS 0`.

## Known Gaps

This does not generate or approve documents. It only makes already-authored Source substrate bodies visible to deterministic artifact QA.
