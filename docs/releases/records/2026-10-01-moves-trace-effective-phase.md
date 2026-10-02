# 2026-10-01 — Moves Decision Trace Uses Effective Phase

## Release ID

`2026-10-01-moves-trace-effective-phase`

## Status

`released`

## Plain-English Summary

The Moves Decision Trace now presents the phase confirmed by current evidence and gate checks, rather than a stored phase that may be ahead of the verified workflow. When the stored phase is ahead, the trace labels the state as requiring gate review.

## Layer Impact

- **Release lane: `global-control-lane`.** The Moves Decision Trace read path now uses the shared effective-phase resolver. It changes display only and does not write Move state or relax a gate.

## Client Applicability

- All clients: Yes. The read-only trace presents the phase already used by the phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Decision Trace page projects the Move through the shared effective-phase resolver before rendering.
- Trace view-model projection labels an ahead-of-gate stored phase as requiring gate review.
- Regression tests cover both stale stored phase and unchanged effective phase.

## QA / Validation

- `jest --runTestsByPath src/lib/programs/__tests__/cross-module-trace-view.test.ts --runInBand` — 16 passed.
- Targeted ESLint for the changed page, view-model, and test — passed.
- `npm run audit:test-ci-coverage:check` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed before merge.
- PR #8848: all required checks passed, including TypeScript/reasoning-layer tests, Programs unit and governance suites, lint, coverage, browser matrix, accessibility, and release control.
- Signed-in browser proof on the deployed revision: Decision Trace shows `P1 Charter · Gate review required`; the phase workspace remains P1 at 1/2 hard criteria with P2 locked. No phase or approval was changed.

## Rollout Plan

Merge through a reviewed pull request. The repo-owned ACA main deploy workflow builds and deploys the merged commit. No migration, worker behavior, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:c520d0bd1ad4e7847dce39ab8aa4ce4490bff28c51724f5fdd86cf515ececa96`.
- ACA runtime invariant: Passed on exact merged SHA `51603993a735eeb9ddd78150b55f26ec43d3fb71`; revision `ca-abarva-web-lab-eastus--m51603993` is healthy and carries 100% traffic, and the Container App template uses the same digest.
- Worker image invariant: Passed; `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` both read back the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; completed as recorded under QA / Validation.

## Rollback Plan

Revert the application change through a follow-up pull request and deploy it through the repo-owned ACA main deploy workflow. No data migration or persisted state needs rollback.

## Audit Evidence

- [PR #8848](https://github.com/abarva-platform/abarva/pull/8848), merged as `51603993a735eeb9ddd78150b55f26ec43d3fb71`; required CI checks passed.
- [Exact-SHA ACA deploy run #36955662653](https://github.com/abarva-platform/abarva/actions/runs/36955662653) — succeeded.
- Azure readback: revision `ca-abarva-web-lab-eastus--m51603993`, healthy, 100% traffic; web template and both worker jobs match digest `sha256:c520d0bd1ad4e7847dce39ab8aa4ce4490bff28c51724f5fdd86cf515ececa96`.
- Signed-in browser readback confirmed the Decision Trace phase matches the phase workspace's effective P1 state and clearly indicates gate review is required.

## Known Gaps

This display correction does not approve a gate, change a stored phase, or repair missing governed approvals. The synthetic smoke Move remains at P1 with 1/2 hard criteria met; its sponsor sign-off is a separate, explicit workflow action. P2/P3 execution was not resumed or claimed as complete.
