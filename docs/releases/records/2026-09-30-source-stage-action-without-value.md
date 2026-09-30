# 2026-09-30-source-stage-action-without-value - Keep stage decisions independent of value analytics

## Release ID

`2026-09-30-source-stage-action-without-value`

## Status

`candidate`

## Plain-English Summary

An authorized stage decision is now offered even when an event has no computable value lever. Missing financial analytics continue to be shown as missing; they do not determine whether the separate, governed approval action exists. The approval endpoint still validates stage, access, evidence, criteria, and confirmations before changing state.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source event presentation passes a server-verified current-stage action independently of the value-waterfall view. No canonical fact, evidence row, approval row, or schema is changed by this release.

## Client Applicability

- All clients: The Source event canvas uses this control for authorized current-stage viewers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Current-stage action resolution moves outside the fact-driven analytics branch in the event page.
- The canvas accepts that server-verified action for either a live or evidence-backed fallback view.
- Focused route and mounted-canvas regressions cover absent computed value, current-stage access, and denial.
- No migration or data build.

## QA / Validation

- Red-first tests reproduced the absent action on the event page and canvas. Focused tests pass after the change.
- The new route test is named in the Source CI suite; its directory census is 6 files / 5 covered, with the existing exact quarantine unchanged. The census check and ownership control pass.
- TypeScript, scoped ESLint, release check, broader adjacent tests, and PR CI are required before merge; record their results in the PR.
- Signed-in stage-action and approval replay is required after official deployment.

## Rollout Plan

Squash merge the validated PR to main. Only the repository-owned ACA main workflow may build and deploy the digest-pinned web and required workers. No feature flag, migration, or manual traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only.
- Approved image digest: Verify after deploy.
- ACA runtime invariant: Web template and sole 100% healthy revision must match the approved digest.
- Worker image invariant: Required delivery worker templates must match the same digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Current-stage action appears; future/unauthorized viewers do not gain it; the approval endpoint determines stage exit.

## Rollback Plan

Revert the PR through a new governed main release. No data rollback is needed.

## Audit Evidence

PR checks, red/green route and mounted-canvas tests, official deploy run, immutable runtime readback, and signed-in stage decision readback.

## Known Gaps

An available approval action is not proof of an approved stage. Stage exit and downstream release remain separately governed.
