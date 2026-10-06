# 2026-09-13-source-dense-contract-readpath — Dense Contract Detail Read Path

## Release ID

`2026-09-13-source-dense-contract-readpath`

## Status

`candidate`

## Plain-English Summary

Ensures Contract 360 detail pages read loaded evidence from the canonical dense Source lanes. A contract header can now remain active when multiple governed package versions share one load run, while each package's versioned facts remain isolated. Evidence, Scope, Performance, Optimize, and contract anatomy no longer fall back to empty compatibility projections when canonical rows are present.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 canonical/evidence: Keeps package-specific facts version-scoped and shared contract headers run-scoped during Layer 4 projection.
- Layer 4 products: Binds contract-detail evidence readers to canonical Source projections before legacy compatibility tables and reports register, archetype, and term state independently.

## Client Applicability

- All clients: The read-path behavior is shared, subject to tenant RLS and available canonical rows.
- Specific clients: Any tenant with an approved dense contract package.
- Internal only: No.
- Public/demo only: Synthetic governed packages only.
- Feature flag: Not applicable.

## Changes Included

- PR `#7674`.
- Layer 4 shared-run/version-aware projection logic in `scripts/source/project-contract-depth-package-layer4.ts`.
- Canonical contract evidence readers in `src/lib/source/data-model/read-adapter.ts`.
- Contract anatomy register/archetype/term state in the Source workspace.
- Regression coverage for shared-run package versions and dense contract detail reads.

## QA / Validation

- Focused Jest suite: 24 tests passed.
- ESLint passed on every changed file.
- `git diff --check` passed.
- Post-merge validation must include the approved ACA data-build quality gate and authenticated tab-by-tab Source proof.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA with a digest-pinned image. After the runtime invariant passes, run the approved private ACA data-build job to rebuild the affected Layer 4 views, then perform authenticated Source validation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The repo-owned ACA workflow only.
- Approved image digest: Recorded after the merged-SHA workflow succeeds.
- ACA runtime invariant: Required before live claims.
- Worker image invariant: Required for the private data-build job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Contract 360 tabs and tenant isolation.

## Rollback Plan

Revert through a protected PR and redeploy the prior approved main SHA through the ACA workflow. If a data rebuild must be reversed, use a separately scoped operator job with dataset-version readback; do not truncate shared Source tables or manually delete rows.

## Audit Evidence

- PR `#7674` and its CI checks.
- Merged-SHA ACA deploy run and digest invariant.
- Private ACA data-build proof bundle, validation output, and quality gate.
- Authenticated Source tab-by-tab smoke output and screenshots.

## Known Gaps

This release does not classify or enrich every register contract. Contracts without an authoritative archetype and dense evidence package remain explicitly unclassified or evidence-gated. Finance confirmation and realized value remain separate from candidate opportunity amounts.
