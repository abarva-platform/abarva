# 2026-07-31-home-knowledge-explore-inventory-binding — Home Knowledge Explore Inventory Binding

## Release ID

`2026-07-31-home-knowledge-explore-inventory-binding`

## Status

`candidate`

## Plain-English Summary

Home Knowledge Explore now exposes the governed inventory projections that are already produced by the data-build path. Data product and technology-estate rows no longer render as unavailable when the active baseline has those projection rows.

## Layer Impact

Release lane: `global-control-lane`.

Products: updates the Home Knowledge consumption reader and Explore UI binding. It does not alter source, canonical, publication, baseline, projection build, Cube, Source, or aVa grounding data.

## Client Applicability

- All clients: Home Knowledge tenants with activated consumption projections receive the reader and layout fix.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Extend the Home Knowledge projection-name contract with the existing technology-estate and data-product projection names.
- Read `consumption.technology_estate_v1` and `consumption.data_product_inventory_v1` in the Explore consumption path.
- Bind the Explore Data products and Infrastructure and cloud tabs to those projections.
- Improve Explore layout so inventory tables scroll horizontally instead of being compressed by the aVa side rail.
- Add reader and full-shell regression coverage for projection-backed Explore tabs.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/knowledge/consumption-server/__tests__/reader.test.ts src/components/knowledge/__tests__/knowledge-shell-smoke.test.tsx`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA to the shared lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before live proof.
- Worker image invariant: unchanged by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: `/home/knowledge` Explore tabs for Systems, Infrastructure and cloud, Data products, and Vendors.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migrations or data rollback are required.

## Audit Evidence

- Pull request and CI checks for this release candidate.
- Focused reader and Knowledge-shell regression test output.
- Post-deploy ACA runtime invariant and signed-in Home Knowledge screenshots.

## Known Gaps

Programmes, risks and controls, measures, and integrations still require dedicated projection construction or reader binding before they can be claimed as UI-available.
