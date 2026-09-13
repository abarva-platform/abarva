# 2026-09-13-source-contract-depth-cte-scope - Layer 4 View CTE Scope

## Release ID

`2026-09-13-source-contract-depth-cte-scope`

## Status

`candidate`

## Plain-English Summary

Ensures the contract vendor projection declares every active-version CTE it uses. This keeps the dense Layer 4 rebuild executable when version-aware overlays are applied.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 canonical/evidence: No canonical facts are changed.
- Layer 4 products: Repairs the SQL view definition used by Contract 360 projections.

## Client Applicability

- All clients: Shared projection code, subject to tenant RLS and available canonical rows.
- Specific clients: Tenants with an approved dense contract package.
- Public/demo only: Synthetic governed packages only.

## Changes Included

- Declare `active_contract_versions` in the contract vendor projection CTE scope.
- Add regression coverage for the generated view definition.

## QA / Validation

- Focused Layer 4 Jest suite passed.
- ESLint passed on changed files.
- `git diff --check` passed.
- Post-merge validation requires the ACA runtime invariant, private data-build quality gate, and authenticated Contract 360 tab proof.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds the merged SHA with a digest-pinned image. Run the affected private ACA data-build job only after that invariant passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The repo-owned ACA workflow only.
- Live signed-in proof required: Yes, for Contract 360 tabs and tenant isolation.

## Rollback Plan

Revert through a protected PR and redeploy the prior approved main SHA. Do not truncate shared Source tables or manually delete rows.

## Audit Evidence

- PR and CI checks.
- Merged-SHA ACA deploy digest invariant.
- Private ACA data-build proof bundle and quality gate.
- Authenticated Source tab-by-tab smoke output.

## Known Gaps

This change does not classify or enrich every register contract. Contracts without an authoritative archetype and dense evidence package remain explicitly unclassified or evidence-gated.
