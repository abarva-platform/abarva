# 2026-08-04-source-v4-cube-canary-model - Source v4 Cube Canary Model

## Release ID

`2026-08-04-source-v4-cube-canary-model`

## Status

`candidate`

## Plain-English Summary

Adds a parallel Source v4 Cube model over the loaded Source v4 lab canary data. The existing Source
Cube model remains intact; the new model uses `source_v4_*` cube and view names so the richer
synthetic canary can be tested without repointing existing Source surfaces.

## Layer Impact

- `client-data-lane`: exposes the loaded v4 canary source-system extracts through tenant-scoped
  Cube semantics.
- SOURCE ADAPTERS: no loader or raw-load behavior change.
- CANONICAL MODEL: no canonical object, publication, or source-of-truth change.
- PRODUCTS: prepares Source/Home UI to consume v4 semantic views for exploratory analytics.

## Client Applicability

- All clients: no existing Source Cube view is removed or renamed.
- Specific clients: applies to the synthetic airline Source v4 lab canary tenant.
- Internal only: yes, until promoted from canary.
- Public/demo only: no public route change.
- Feature flag: none.

## Changes Included

- `cube/model/source_sourcing_v4.yml` adds parallel v4 Cube cubes and views for contracts, vendors,
  scope, spend, service credits, SaaS usage, cloud cost, rate cards, sourcing events, and context
  coverage.
- `cube/cube.py` tenant-fences every new v4 cube and v4 view prefix.
- `scripts/source/verify-source-cube-runtime.mjs` validates v4 runtime query results against the
  loaded canary counts and reconciliation totals.

## QA / Validation

- Pass: local YAML parse and syntax checks.
- Pass: local ESLint check for the Cube runtime verifier.
- Not-run: local release gate, rerun after this release-record wording fix.
- Not-run: PR checks.
- Not-run: Cube lab deploy workflow runtime verifier against the private Cube ACA app.

## Rollout Plan

Merge through the normal PR path. The Cube lab deploy workflow builds and deploys the digest-pinned
Cube image because `cube/**` changes. The workflow then runs the Cube runtime verifier against the
private Cube ACA app.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-cube-lab-deploy.yml`
- Shared runtime mutators: Cube lab deploy workflow only.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: enforced by the Cube lab deploy workflow.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, semantic runtime proof only.

## Rollback Plan

Revert this PR and redeploy the Cube lab runtime. Existing non-v4 Source Cube views remain available
because they are not removed by this change.

## Audit Evidence

- PR checks and release gate output.
- Cube lab deploy evidence artifact.
- Cube runtime verifier output proving v4 canary counts and tenant-fenced query behavior.

## Known Gaps

- This does not change the Source UI/UX by itself.
- The v4 canary remains synthetic pressure-test data and should not be described as client fact.
