# 2026-09-27 Source Mobile Review Layout

## Release ID

`2026-09-27-source-mobile-review-layout`

## Status

`candidate`

## Plain-English Summary

Source request review and event approval now fit a narrow browser viewport. The request workspace gets the full width on compact screens, with aVa available from a collapsed control. The approval brief, facts, and decision form stack rather than overflowing horizontally.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Source presentation only. No canonical data, approval authority, or persisted state changes.

## Client Applicability

- All clients: yes, on signed-in Source request and event-approval pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Compact-viewport Source request dock mode, restoring aVa below the workspace.
- Responsive request rows and event-approval grid/fact rows.
- Focused regression tests for viewport mode and responsive layout contracts.

## QA / Validation

- Pass: signed-in pre-fix reproduction at 390 px on synthetic Source request and event-approval pages. No decision was submitted.
- Pass: 28 focused Jest tests.
- Pass: scoped ESLint and TypeScript project check with an 8 GB Node heap.
- Pass: mutation proof. Restoring the fixed approval column and fixed side-rail mode made both new regressions fail.
- Not run: post-deployment signed-in mobile replay; required after official deployment.

## Rollout Plan

Squash merge after applicable CI, then use only `.github/workflows/aca-main-deploy.yml`. No migration or data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending official deployment.
- ACA runtime invariant: pending official deployment.
- Worker image invariant: pending official deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, at desktop and compact viewport.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned workflow. There is no schema or tenant-data rollback.

## Audit Evidence

- PR CI and official ACA run to be linked after release.
- Signed-in pre-fix and post-fix browser observations at a 390 px viewport.

## Known Gaps

- Human approval submission remains a separate accountable action; layout QA does not create an approval receipt.
