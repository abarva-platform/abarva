# 2026-08-14-relationships-mapping-profile — Relationship Tab Mapping Coverage

## Release ID

`2026-08-14-relationships-mapping-profile`

## Status

`candidate`

## Plain-English Summary

Adds a Layer 2 mapping profile for the governed relationships intake tab so dry-run coverage can evaluate relationship rows with the same adapter registry mechanics used by the other active template tabs.

## Layer Impact

Release lane: `global-control-lane`.

Layer 1 — Client Intake: No intake files are changed. The existing relationships tab remains the source packet input.

Layer 2 — Source Adapters: Adds a relationship mapping profile and source-class coverage so the dry-run registry no longer treats the relationships tab as missing adapter coverage.

Layer 3 — Canonical Model: Maps relationship rows to `relationship_edge` candidate attributes only. Graph reconciliation remains quarantine-first and does not materialize canonical graph tables.

Layer 4 — Products: No product route, read model, prompt, or runtime projection is changed.

## Client Applicability

- All clients: Applies to all active tenants when the local dry-run audit is executed.
- Specific clients: None.
- Internal only: Layer 2 audit and validation tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts`
- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts`
- `src/lib/enterprise-data/contracts/tenant-packet.ts`
- `scripts/audit/tenant-layer-refresh.mjs`
- `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand` — 1 suite, 38 tests passed. Jest emitted pre-existing duplicate manual mock warnings.
- PASS: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-relationships-profile-final.SwXGXQ/layer-reconciliation --no-package` — relationship dimension failures dropped to 0 and total dry-run failures dropped to 36.
- PASS: `npm run release:check` — Release Control Gate, Deploy Authority Gate, and Pilot Data Loader Gate passed.
- PASS: `git diff --check`

## Rollout Plan

Merge to main through PR review. The code becomes available through the normal repo-owned Azure Container Apps deployment path, but it does not load tenant data, activate registries, or change product routing.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required only if deployed to the shared runtime.
- Worker image invariant: Required only if deployed to the shared runtime.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this audit-only Layer 2 mapping profile unless bundled with runtime-affecting changes.

## Rollback Plan

Revert the PR. Existing dry-run reports will return to showing relationships as an unprofiled canonical dimension; no tenant data rollback is required.

## Audit Evidence

- PR diff and local validation output.
- Dry-run `layer2-adapter-dry-run-failures.json` showing relationship dimension coverage.

## Known Gaps

This does not promote relationship rows to canonical graph tables, normalize all relationship verbs, resolve missing endpoints, or mark any aVa context as agent-ready.
