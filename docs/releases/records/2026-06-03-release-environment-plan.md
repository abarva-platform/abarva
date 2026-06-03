# 2026-06-03-release-environment-plan - Release Environment Definitions

## Release ID

`2026-06-03-release-environment-plan`

## Status

`candidate`

## Plain-English Summary

Adds a durable architecture decision and operator runbook that define how AbarVa
uses local development, PR preview, control-plane production, single-client
pilot production, and multi-client production. The change prevents a green PR or
preview from being confused with a client-ready production environment.

## Layer Impact

`ops-release-lane`: clarifies release promotion, rollback drill expectations,
and tracker status language.

`app-control-lane`: documents how control-plane production differs from
client-data-plane readiness without changing runtime behavior.

## Client Applicability

- All clients: applies to release language and production-scope claims.
- Specific clients: single-client pilot production evidence remains scoped to
  the named client.
- Internal only: used by AbarVa operators and agents during release execution.
- Public/demo only: no direct public route impact.
- Feature flag: none.

## Changes Included

- `docs/architecture/adr/ADR-0009-release-environments-and-pilot-production.md`
- `docs/architecture/adr/README.md`
- `docs/runbooks/release-environments-and-promotion.md`
- `docs/releases/records/2026-06-03-release-environment-plan.md`

## QA / Validation

- Pass: `git diff --check`
- Pass: referenced docs exist for all runbook/ADR links.
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Docs-only rollout. The runbook and ADR become active when merged to `main`.
There is no runtime deployment, migration, feature flag, or private data-plane
operation in this release.

## Rollback Plan

Revert the PR if the environment definitions are wrong or superseded. No data,
runtime, or migration rollback is required.

## Audit Evidence

- PR URL after opening.
- Merge commit after merge.
- Local validation output listed in the PR.
- Required GitHub checks after CI runs.

## Known Gaps

- This does not reauthorize Vercel Git integration for the `abarva-platform`
  organization.
- This does not provision a private data-plane test environment.
- This does not perform a live rollback drill; it defines the drill to run.
