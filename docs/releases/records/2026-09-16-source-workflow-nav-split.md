# 2026-09-16 Source workflow navigation split

## Release ID

`2026-09-16-source-workflow-nav-split`

## Status

`candidate`

## Plain-English Summary

The product navbar now exposes the existing Source contract workspace and New Event intake as distinct destinations. Users can reach the sourcing-event workflow without knowing its URL or mistaking contract optimization for event creation.

## Layer Impact

`global-control-lane`: Layer 4 navigation only. No intake, adapter, canonical-model, database, or event records change.

## Client Applicability

- All clients: authenticated users with Source access receive both links.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source module permission only.

## Changes Included

The shared top navigation labels the current Source workspace `Source Optimize` and links `Source New` to the existing `/source/new` intake. Event routes keep the latter active; portfolio and contract routes keep the former active. The narrow-screen menu accommodates the additional item.

## QA / Validation

- pass: Focused navigation tests, 2 suites / 23 tests.
- pass: TypeScript `tsc --noEmit`.
- pass: Scoped ESLint on touched TypeScript files.
- pass: `git diff --check`.
- pass: `npm run release:check`.
- not-run: Production build and deployed signed-in navigation proof.
- not-run: ACA runtime image invariant for this release.

## Rollout Plan

Merge by PR and deploy only through the repository-owned ACA main workflow. No migration or data job is required for this navigation release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolve from the workflow proof.
- ACA runtime invariant: template, active revision, and required workers match that digest.
- Worker image invariant: required worker images match the web image.
- Feature/env flag update path: none.
- Live signed-in proof required: both Source nav items render and each opens its expected route without duplicate chrome.

## Rollback Plan

Revert the navigation PR through the main deploy lane. No data rollback is needed.

## Audit Evidence

PR and CI links, deploy run, digest invariant, and signed-in route checks.

## Known Gaps

`/source/events` currently redirects to `/source`; this change takes users directly to New Event intake rather than adding an event index. The event workspace remains available by its existing event URL.
