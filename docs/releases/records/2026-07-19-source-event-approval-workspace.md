# 2026-07-19-source-event-approval-workspace — Keep Source Approval In Event Shell

## Release ID

`2026-07-19-source-event-approval-workspace`

## Status

`candidate`

## Plain-English Summary

The Source event shell no longer sends users from a stage gate handoff to the old Source-wide approvals page. The event shell already has an Approvals workspace in the left rail, so the handoff now opens that in-event workspace and uses copy that matches the workflow.

This keeps the attached Source Event Shell design contract coherent: one event canvas, one left journey/workspace model, and no second Source page competing with the current step.

## Layer Impact

- `global-control-lane`: changes Source event UI behavior and copy for gate handoff actions.
- `client-data-lane`: no schema, query, tenant data, or mutation change.

## Client Applicability

- All clients: yes, for Source event detail pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; follows the existing Source event route behavior.

## Changes Included

- `GateHandoffCard` now opens the event shell's Approvals workspace instead of linking to `/source/approvals`.
- Gate readiness copy now refers to the event approval workspace rather than the standalone Source Approvals page.
- Focused tests cover the in-shell handoff and updated readiness language.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts tests/unit/source-event-shell-no-legacy-subnav.test.ts --runInBand` — pass, 15/15 tests. Existing duplicate Jest mock warnings were unchanged.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/source-event-shell-v2.ts src/lib/source/__tests__/source-event-shell-v2.test.ts tests/unit/source-event-shell-no-legacy-subnav.test.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — pass.
- `git diff --check` — pass.
- Signed-in browser proof — not run yet for this candidate; required after deploy before calling this live-proven.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run signed-in browser proof on the FS Demo Source event Scope stage. Confirm the lower gate handoff opens the in-event Approvals workspace and no old `/source/approvals` handoff link remains.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The change is UI behavior/copy only and has no data rollback requirement.

## Audit Evidence

- Candidate PR diff and test output.
- Post-deploy signed-in browser proof showing the event gate handoff stays inside the event shell's Approvals workspace.

## Known Gaps

- Broader Source home / queue / portfolio IA redesign remains open. This slice fixes the event-shell handoff only.
