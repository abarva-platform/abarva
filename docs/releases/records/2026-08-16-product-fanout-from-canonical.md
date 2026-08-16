# 2026-08-16-product-fanout-from-canonical — Product Fanout Dry Run

## Release ID

`2026-08-16-product-fanout-from-canonical`

## Status

`candidate`

## Plain-English Summary

Adds a report-only product fanout command that reads the integrated canonical tenant build and emits
dry-run projection artifacts for Home, Source, Tower, Moves, and Intelligence. This makes the Layer 4
boundary explicit: a canonical source row is not treated as product-refreshed until the product has a
projection artifact and later read-model/write/readback proof.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1: No change to intake files or templates.
- Layer 2: No adapter behavior change.
- Layer 3: Reuses the canonical build output in read-only mode.
- Layer 4: Adds dry-run product projection artifacts for the major product surfaces. It does not
  write product read models, refresh cubes, index retrieval, or change runtime routing.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: None.
- Internal only: Operators and agents validating layer refresh coverage.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `scripts/data-build/project-products-from-canonical.ts`.
- Adds `npm run data-build:product-fanout`.
- Emits per-product JSON projection artifacts plus a summary table from the same canonical build.
- Refuses direct writes through `--write` so product read-model mutation stays in the governed job
  lane.

## QA / Validation

- PASS: `npm run data-build:product-fanout -- --out-dir /tmp/nexus-product-fanout-coverage.1786923531 --tenant meridian-health --tenant skyharbor-air`.
- PASS: `/tmp/nexus-product-fanout-coverage.1786923531/summary.json` reports 9,676 accepted
  canonical records read, 9,676 projected to at least one product route, and 0 unprojected
  canonical records.
- PASS: `npm run data-build:product-fanout -- --out-dir /tmp/nexus-product-fanout-write-refusal --write` exits non-zero with `Product fanout dry-run refuses direct writes.`
- PASS: `npx eslint scripts/data-build/project-products-from-canonical.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to main after validation. The repo-owned deploy workflow may rebuild the web image, but this
change only adds operator tooling. No database migration, registry activation, data load, product
read-model refresh, cube refresh, retrieval indexing, or runtime routing change is performed by this
release.

## Deployment Authority

- Repo-owned deploy workflow: Allowed by standing session approval if the PR is merged.
- Shared runtime mutators: None.
- Approved image digest: Determined by repo-owned deploy workflow if triggered.
- ACA runtime invariant: Required only if the repo-owned deploy workflow runs.
- Worker image invariant: Required only if the repo-owned deploy workflow runs.
- Feature/env flag update path: None.
- Live signed-in proof required: No; operator-only script. Post-deploy crawl may still run by repo
  automation.

## Rollback Plan

Revert the PR. Since this command is report-only and refuses direct writes, rollback does not require
data-plane repair.

## Audit Evidence

- Product fanout dry-run output under the operator-provided `--out-dir`.
- PR checks and release-control output.

## Known Gaps

This release does not perform canonical/data-plane writes, graph materialization, product read-model
updates, cube readbacks, retrieval indexing, or live-client claims. It prepares the projection
contract needed before those write/readback steps can be proven product by product.
