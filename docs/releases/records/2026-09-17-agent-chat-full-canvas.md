# 2026-09-17-agent-chat-full-canvas - Expanded chat layout

## Release ID

`2026-09-17-agent-chat-full-canvas`

## Status

`candidate`

## Plain-English Summary

Expanding aVa now opens a full-window conversation instead of a width-limited modal. Messages and opening prompts share one scrolling transcript, while the composer stays at the bottom of the window. Pinned and collapsed layouts remain available.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 product presentation only. No canonical data, retrieval, agent-answer, or approval behavior changes.

## Client Applicability

- All clients: Shared agent dock surfaces that expose Expand.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing dock mode control.

## Changes Included

- `src/components/agent/AgentDock.tsx`: full-window Expand layout, centered conversation column, one transcript scroll area, and background scroll lock.
- `src/components/agent/__tests__/AgentDock.test.tsx`: expanded-mode layout regressions.

## QA / Validation

- Focused expanded-mode component tests: pass.
- Scoped ESLint: pass.
- TypeScript no-emit check: pass.
- Full component suite: seven pre-existing failures remain on the base commit; no additional failures after this change.
- Signed-in browser proof: pending deployment.

## Rollout Plan

Squash merge the PR, then let the repo-owned ACA main deploy workflow build and deploy the exact main SHA. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Check template, 100% traffic revision, and required worker images after deploy.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Open Expand on an affected product surface; verify full viewport, readable messages, internal scrolling, and visible composer at desktop and narrow widths.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow if the chat layout regresses. No data rollback is involved.

## Audit Evidence

PR and CI URLs, exact deploy SHA/digest, and signed-in viewport screenshots to be attached after rollout.

## Known Gaps

The seven existing component-suite failures remain outside this layout change.
