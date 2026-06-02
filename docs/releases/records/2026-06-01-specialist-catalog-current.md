# 2026-06-01-specialist-catalog-current — Specialist Catalog Control Checkpoint

## Release ID

`2026-06-01-specialist-catalog-current`

## Status

`candidate`

## Plain-English Summary

Updates the canonical specialist catalog so architecture reviewers know which file is current, which product agents own each specialist surface, and which real repo paths anchor the inventory.

## Layer Impact

- Release lane: `internal-admin`.
- Architecture documentation: clarifies the specialist catalog source of truth and maintenance rule.
- Runtime: no runtime code, database, or product UI behavior changes.

## Client Applicability

- All clients: No direct runtime effect.
- Specific clients: None.
- Internal only: Architecture, engineering governance, and pilot-readiness tracking.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/specialist-catalog.md`
- `docs/releases/records/2026-06-01-specialist-catalog-current.md`

## QA / Validation

- Pass: `git diff --check`
- Pass: real-path spot checks for the catalog control checkpoint.
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No production deploy, migration, or feature flag is required.

## Rollback Plan

Revert the PR to restore the prior catalog wording and remove this release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2780
- Catalog path: `docs/architecture/specialist-catalog.md`

## Known Gaps

Tower and Intelligence remain placeholder-level specialist inventories and still need dedicated product audits before they can be called complete.
