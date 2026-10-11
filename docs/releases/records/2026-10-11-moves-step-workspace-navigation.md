# Moves step workspace navigation

## Release ID

`2026-10-11-moves-step-workspace-navigation`

## Status

`candidate`

## Plain-English Summary

On a Moves step page, Files and Record now open the corresponding Move workspaces. Previously, the root-causes step sent both links to the bare phase address, which returned the reader to the step. Other step pages sent Files to a separate documents page. The global product navigation remains available above these views.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 (Products — Moves): corrected step-page links and the phase route's read-only workspace selection.
- Layers 1–3: unchanged. No tenant data, canonical records, schema, or write path changes.

## Client Applicability

- All clients: the existing step-page feature behaves consistently wherever enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves step-page and capture flags; no new flag.

## Changes Included

- The phase page accepts `workspace=files` and opens its existing Files & Evidence view.
- Step-page Files and Record links open the existing Files & Evidence and Phase Intelligence workspaces. Record includes the full assumptions register.
- Component and signed-in walk checks cover both destinations, a stored file download, the return to Steps, and the global navigation bar at desktop and phone widths while scrolling.

## QA / Validation

- Read-only signed-in reproduction: both root-causes links pointed to the bare phase route and returned to the step. The global navigation bar was visible and stayed visible while scrolling in the current live step and briefing pages. The existing Files workspace listed stored downloadable deliverables.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --silent`: 346 tests passed.
- `npm run test:nav`: 26 tests passed.
- Mutation check: three changes (Files target, Record target, workspace redirect guard) each failed the matching component test; original code restored.
- `npx eslint` on the changed TypeScript files: passed.
- `npm run typecheck`: passed.
- `npx playwright test tests/e2e/moves-step-pages-live-walk.spec.ts --list`: five tests discovered.
- Library-orphan, route-reachability and export-reachability checks: passed with no new findings.
- Test coverage census: current, zero new test files. Tenancy-fence census and its 15 checks: passed with no census change.
- `npm run release:check`: all 11 gates passed.
- The post-deploy signed-in walk is required before claiming this change is live proven.

## Rollout Plan

Squash merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image; its successful run triggers the read-only signed-in Moves walk. No migration or flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: established by the deploy workflow, not this release record.
- ACA runtime invariant: verified by the deploy workflow before live proof.
- Worker image invariant: no worker behavior change; deploy workflow verification still applies.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the walk must open Files and Record from a step, read an existing stored file download, return to Steps, and keep the global product bar visible at desktop and phone widths while scrolling.

## Rollback Plan

Revert the PR through the normal release path. No data rollback is needed.

## Audit Evidence

- PR and CI checks for this release candidate.
- ACA main deploy artifact and signed-in Moves walk artifact after deployment.

## Known Gaps

- Live proof of the corrected links is pending deployment.
