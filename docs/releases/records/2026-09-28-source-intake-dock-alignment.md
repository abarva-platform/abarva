# 2026-09-28-source-intake-dock-alignment - Decision-side progress dock

## Release ID

`2026-09-28-source-intake-dock-alignment`

## Status

`candidate`

## Plain-English Summary

The fixed Request approval progress dock now aligns with the decision column on wide screens, keeping the supporting brief unobscured. Its viewport-constrained width retains the same visible blocked and ready states on narrow screens.

## Layer Impact

`global-control-lane`, Layer 4 Source presentation only. Canonical facts, approval policy, decision payload and server authorization are unchanged.

## Client Applicability

- All clients: Source New Request approval screen.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Anchor the fixed dock to the decision side instead of centering it over the supporting brief.
- Preserve the green ready action, grey blocked status, bottom offset and narrow-viewport width limit.

## QA / Validation

- Pass: red-first mounted positioning assertion failed on the centered dock and passed after alignment.
- Pass: focused approval component tests, 16 of 16.
- Pass: Source component suite, 90 suites and 617 tests.
- Pass: Node 24 TypeScript check with an 8 GB heap; scoped ESLint and release control.
- Not run: signed-in desktop and narrow-viewport visual readback, pending the official main deployment.

## Rollout Plan

Squash merge the reviewed PR, then deploy only through `.github/workflows/aca-main-deploy.yml`. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned web template, healthy 100%-traffic revision, and both delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: unobscured desktop brief and visible desktop/narrow blocked and ready dock states without submitting a decision.

## Rollback Plan

Revert the PR through protected main and allow the repo-owned workflow to deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

Red/green mounted test, PR checks, official deploy run, Azure digest readback, and signed-in visual smoke ledger.

## Known Gaps

This is a placement correction only. It does not create an approval, upload evidence or advance an event.
