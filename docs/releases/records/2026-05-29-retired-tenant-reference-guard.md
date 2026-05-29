# 2026-05-29-retired-tenant-reference-guard — Retired Tenant Reference Guard

## Release ID

`2026-05-29-retired-tenant-reference-guard`

## Status

`candidate`

## Plain-English Summary

Retired tenant references were removed from active code, test fixtures, seed scripts, and migration helper surfaces. A new guard now fails CI when retired tenant names or retired Northstar tenant keys reappear outside approved audit/archive evidence.

## Layer Impact

Control lane: tenant routing, setup/admin tests, Source helpers, and stress/audit harnesses now use the canonical tenant set instead of retired examples.

Data layer: Northstar setup and context loaders now write/read `northstar-clinical`; fresh migration replay no longer assigns the retired energy tenant key.

QA lane: canonical tenant drift CI now includes a retired-tenant reference scan.

## Client Applicability

- All clients: retired tenant references are blocked from active code paths.
- Specific clients: Northstar uses `northstar-clinical`; First Capital no longer accepts Brindlemark as an active alias.
- Internal only: Phase 0D scripts and archived evidence remain allowed history.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/verify-retired-tenant-references.mjs`
- `.github/workflows/canonical-tenant-drift.yml`
- Northstar setup/context loader key updates
- Retired Helix seed entrypoint deletion
- Active test and audit fixture cleanup

## QA / Validation

- PASS: `npm run db:verify:retired-tenants`
- PASS: `npm run db:verify:canonical-tenants`
- PASS: `npm run db:verify:tenant-keys`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: focused Jest tenant/admin/program suite
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`; Vercel production deploy follows the normal release path. The guard runs in the canonical tenant drift workflow for future PRs and scheduled checks.

## Rollback Plan

Revert this PR if the guard blocks an intended historical-evidence path. Do not restore retired tenants to active routing or seed paths without a new ADR.

## Audit Evidence

- Live canonical tenant verifier: clean
- Live tenant-key verifier: clean
- Retired reference verifier: clean

## Known Gaps

Historical docs, datasets, and Phase 0D audit evidence still contain retired tenant names by design.
