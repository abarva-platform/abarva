# 2026-07-20-source-queue-route-archive — Archive Old Source Queue Entry

## Release ID

`2026-07-20-source-queue-route-archive`

## Status

`candidate`

## Plain-English Summary

Source now has one canonical entry surface: the portfolio book at `/source/portfolio`. The old `/source/queue` Decision Queue page no longer renders as a separate Source home; it redirects to the portfolio book so users do not see two competing Source landing experiences.

## Layer Impact

- `global-control-lane`: changes Source route behavior and visible navigation/copy for all tenants using the shared app.
- No schema, data-plane, ingestion, or model-runtime behavior changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is route compatibility behavior.

## Changes Included

- `/source/queue` now redirects to `/source/portfolio` instead of rendering `SourceDecisionQueueView`.
- Archived-event and approval fallbacks now return to `/source/portfolio`.
- Renewal not-found/back links now say and target the sourcing book.
- Stale E2E/static assertions that treated the old Queue as the Source home now encode the portfolio-book entry contract.

## QA / Validation

- PASS: Focused Jest for Source route, lifecycle, subnav, and queue-view link contracts.
- PASS: ESLint on changed Source files and tests.
- PASS: TypeScript `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.
- PENDING: signed-in browser proof after merge and ACA deploy.

## Rollout Plan

Merge through a PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA. Live acceptance requires a signed-in browser crawl proving `/source/queue` redirects to `/source/portfolio` and the portfolio book renders without the retired Source section tabs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned ACA workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the ACA workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to restore the old `/source/queue` rendered page and old fallback destinations, then redeploy through the repo-owned ACA main workflow.

## Audit Evidence

Pending:

- PR URL.
- Local validation output.
- ACA deploy run.
- Signed-in browser proof for `/source/queue` and `/source/portfolio`.

## Known Gaps

This archives the old Queue entry route; it does not redesign or delete the dormant `SourceDecisionQueueView` component or decision-queue data model. A future slice can reintroduce decision work as an embedded portfolio/workspace panel if product needs it.
