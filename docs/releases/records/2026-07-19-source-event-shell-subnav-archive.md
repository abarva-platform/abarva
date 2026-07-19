# 2026-07-19-source-event-shell-subnav-archive — Archive Old Source Event Subnav

## Release ID

`2026-07-19-source-event-shell-subnav-archive`

## Status

`candidate`

## Plain-English Summary

Source event-scoped pages no longer render the old Decisions / Approvals / Portfolio / Capabilities / Setup strip above the event workflow. The Source Event Shell HTML contract already carries the event navigation inside the left journey/workspace rail, so the old secondary nav created two competing Source canvases on the same page.

This slice makes the event shell authoritative for event detail, event workspace, and event approval routes.

## Layer Impact

- `global-control-lane`: changes shared Source event chrome for all tenants using event-scoped Source routes.
- `client-data-lane`: no data, schema, query, or tenant-scoped mutation change.

## Client Applicability

- All clients: yes, for Source event-scoped routes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; follows existing route access and `source_analytics` behavior where applicable.

## Changes Included

- Removed `SourceSubNav` from `SourceAnalyticsCanvas`.
- Removed `SourceSubNav` from `/source/events/[eventId]/workspace`.
- Removed `SourceSubNav` from `/source/events/[eventId]/approval`.
- Added render and static guard tests so event-scoped Source routes do not re-mount the retired subnav.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx tests/unit/source-event-shell-no-legacy-subnav.test.ts --runInBand` — pass, 9/9 tests. Existing duplicate Jest mock warnings were unchanged.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx 'src/app/(maestro)/source/events/[eventId]/workspace/page.tsx' 'src/app/(maestro)/source/events/[eventId]/approval/page.tsx' tests/unit/source-event-shell-no-legacy-subnav.test.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — pass.
- `git diff --check` — pass.
- Signed-in browser proof — not run yet; required after deploy before calling this live-proven.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in browser proof on `https://app.abarva.ai/source/events/<eventId>?stage=scope` to verify the old section strip is gone and the left journey/workspace shell remains.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The change is UI chrome only and has no migration or data repair requirement.

## Audit Evidence

- Candidate diff and tests in the PR.
- Post-deploy signed-in Source event screenshot / crawl proving no `Source sections` subnav is rendered on event-scoped pages.

## Known Gaps

- Broader Source home / queue / portfolio IA remains open. This slice only prevents those old Source-wide tabs from appearing inside the event shell.
