# 2026-09-19-source-new-request-first - Source New Request-First Entry

## Release ID

`2026-09-19-source-new-request-first`

## Status

`candidate`

## Plain-English Summary

The default Source New entry now opens on a request-first screen. The screen shows Stage 01 request intake separately from governed event workspaces, states that a request is not an event until accepted through the governed flow, and keeps the current create-intake surface behind an explicit route mode.

This is a presentation and navigation slice only. It does not create request rows, apply activation state, send email, infer solicitation motion, or promote any request into an active event.

## Layer Impact

`global-control-lane`: Layer 4 product presentation and routing only. The product surface now separates request intake from event workspaces before opening the existing intake flow.

No Layer 1 client intake, Layer 2 adapter, Layer 3 canonical model, data-plane schema, migration, row mutation, or projection contract changes are included.

## Client Applicability

- All clients: Source New users who open `/source/new`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/source/new` defaults to the request-first entry screen.
- `/source/new?mode=intake` preserves the existing governed create-intake flow.
- Existing non-optimization intent routes continue to use the old intake surface.
- Existing contract-optimization routing still redirects before request queue loading.
- A new request-first component covers empty, loading, authorization, and event-handoff states.

## QA / Validation

- Focused route and component tests: `npx jest --runInBand --runTestsByPath 'src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts' 'src/components/source/new-workspace/SourceNewRequestFirstPage.test.tsx'` passed, 9 tests.
- Scoped ESLint on changed files passed.
- Full `npx eslint src/` passed with existing warnings and no errors.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` passed.
- `npm run release:check` passed.
- Mutation guard: flipping the default route condition failed the route test; exposing event workspaces in the unauthorized state failed the component test. Both mutations were reverted.
- Local browser render was not attempted because this isolated worktree has no `.env.local`; per repo instructions, Clerk-wrapped routes need valid Clerk environment variables.
- PR CI, deployment readback, and signed-in browser proof remain pending.

## Rollout Plan

Squash-merge through the protected PR path after validation. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA. No manual shared-runtime command, migration apply, tenant-data mutation, or feature flag change is part of this rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve after the repo-owned workflow builds.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: `/source/new` opens the request-first surface; `/source/new?mode=intake` opens the existing intake; contract optimization still routes to the existing contract-bound path; no request appears as an event workspace.

## Rollback Plan

Revert the route/component change through a new PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

Focused test output, PR checks, ACA digest/runtime invariant, and signed-in browser proof to be attached after rollout.

## Known Gaps

- No authoritative request ledger is created in this slice, so the request queue is an honest empty/not-configured state.
- No activation-state migration is applied.
- No request accept, return, merge, or decline mutation is implemented.
- No signed-in acceptance has been claimed.
