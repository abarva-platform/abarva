# 2026-06-01-architecture-boundary-enforcement — Architecture Boundary Enforcement

## Release ID

`2026-06-01-architecture-boundary-enforcement`

## Status

`candidate`

## Plain-English Summary

Adds a dependency-cruiser guard so app-tier and component runtime code cannot add new direct imports into graph, vector, tenant-data, or enterprise-data-room internals. Those paths must go through the Agent Context Broker or context-broker boundary.

## Layer Impact

Engineering governance / internal-admin: adds an architecture-boundary audit script and CI workflow for PRs.

Control plane: protects app-tier code from bypassing the documented broker boundary. No product UI, database schema, or runtime route behavior changes.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: engineering CI and review discipline.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.dependency-cruiser.cjs`
- `.dependency-cruiser-known-violations.json`
- `.github/workflows/architecture-boundary.yml`
- `package.json`
- `package-lock.json`

## QA / Validation

- `npm run audit:architecture-boundaries` passed with the checked-in seven-violation baseline ignored.
- `npx depcruise -c .dependency-cruiser.cjs --no-ignore-known src/app src/components` reported the seven existing known broker-boundary bypasses captured in the baseline.

## Rollout Plan

Merge to `main`. The GitHub Actions workflow then runs on future pull requests and blocks new unbaselined broker-boundary bypasses.

## Rollback Plan

Revert this PR to remove the dependency-cruiser config, baseline, npm script, workflow, and dependency metadata.

## Audit Evidence

- CI check: `Architecture Boundary / Agent context broker boundary`
- Local audit script: `npm run audit:architecture-boundaries`
- Baseline file: `.dependency-cruiser-known-violations.json`

## Known Gaps

Seven existing app-tier graph/knowledge bypasses remain intentionally baselined. Follow-on work should route those through the Agent Context Broker and then shrink the baseline to zero.
