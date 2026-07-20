# 2026-07-19-source-event-approval-copy-archive — Remove Old Source Approvals Copy

## Release ID

`2026-07-19-source-event-approval-copy-archive`

## Status

`candidate`

## Plain-English Summary

The Source event shell no longer tells users that stage approval belongs in the old Source Approvals page. The visible aVa suggestion rail, gate readiness copy, and legacy gate route language now point users back to the event approval workspace model.

This fixes the exact remaining old-page signal visible in the FS Demo Scope screenshot: "approval belongs in Source Approvals."

## Layer Impact

- `global-control-lane`: changes Source event UI copy and removes an old event-gate route target.
- `client-data-lane`: no data, schema, query, or tenant-scoped mutation change.

## Client Applicability

- All clients: yes, for Source event shell users.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- aVa suggested action detail now says to finish inputs and open Approvals inside the event workspace.
- Legacy Scope gate copy no longer references the Source Approvals page.
- Legacy Scope gate no longer routes to `/source/approvals`.
- Static and render tests ban the old visible phrase and old route from event-shell files.

## QA / Validation

- Focused Jest: passed (`SourceAnalyticsCanvas.chat`, `source-event-shell-v2`, legacy subnav guard, old Source Approvals copy guard; 18/18).
- ESLint: passed for touched Source event shell files and tests.
- TypeScript: passed (`npx tsc --noEmit --pretty false --incremental false`).
- Diff hygiene: passed (`git diff --check`).
- Release check: passed (`npm run release:check`).
- Pending in this candidate: signed-in browser proof after deploy.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in browser proof on the FS Demo Source Scope event from the reported screenshot. Confirm the left aVa suggestion no longer says "approval belongs in Source Approvals."

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The change is UI copy/routing only and has no data rollback requirement.

## Audit Evidence

- Candidate PR diff and validation output.
- Post-deploy signed-in screenshot/crawl of the FS Demo Scope event.

## Known Gaps

- The broader Source home / queue / portfolio IA redesign remains open. This slice removes old approval-page language from event-shell surfaces.
