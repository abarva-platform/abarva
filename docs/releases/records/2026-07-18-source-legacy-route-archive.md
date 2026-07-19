# 2026-07-18-source-legacy-route-archive — Archive Old Source Event Pages

## Release ID

`2026-07-18-source-legacy-route-archive`

## Status

`candidate`

## Plain-English Summary

Old standalone Source event pages no longer render their legacy UI. They now redirect users into the supported Source portfolio, event canvas, or workspace so the new shell remains the only visible event experience.

## Layer Impact

- `global-control-lane`: archives obsolete Source event index and child pages by redirect.
- Navigation: visible document and scorecard drilldowns now point to workspace/canvas destinations.
- Governance docs: updates the Source legacy-surface retirement plan to mark archived routes explicitly.

## Client Applicability

- All clients: yes, for Source routes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `/source/events` redirects to `/source/portfolio`.
- `/source/events/[eventId]/gate`, `/report`, and `/scorecard` redirect into the event canvas.
- `/source/events/[eventId]/file-cabinet` and `/artifacts/[artifactId]` redirect into the event workspace.
- `/source/events/[eventId]/vendors/[vendorId]` redirects into the responses stage of the event canvas.
- Source document and vendor scorecard links now target supported workspace/canvas URLs.
- Added `source-legacy-route-archive` coverage so retired pages cannot quietly remount legacy components.

## QA / Validation

- PASS: `npx jest src/__tests__/integration/source/source-legacy-route-archive.test.ts --runInBand --runTestsByPath`
- PASS: `npx jest src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx --runInBand --runTestsByPath`
- PASS: `npx jest src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand --runTestsByPath`
- PASS: Focused updated Source integration/component tests.
- PASS: `npx eslint` on touched files; Markdown files are ignored by ESLint config.
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`, then use the repo-owned ACA main deploy workflow to build and deploy the immutable production image for `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: produced by the workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, prove old URLs redirect and FS Demo event still opens in the new shell.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No schema or data migration is involved.

## Audit Evidence

PR, validation output, ACA deploy workflow run, and signed-in browser proof bundle to be attached after merge/deploy.

## Known Gaps

Approval and value-proof pages remain because they are live workflow/proof surfaces, not archived legacy pages. The internal legacy components can be physically deleted in a follow-up once all imports and tests are retired.
