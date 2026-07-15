# 2026-07-15-tower-knowledge-layer-pressure-test — Tower Knowledge Layer Pressure Test

## Release ID

`2026-07-15-tower-knowledge-layer-pressure-test`

## Status

`candidate`

## Plain-English Summary

This release adds a deterministic Tower pressure test against the Enterprise Knowledge Layer. It checks whether Tower has enough governed context for budget, spend, value, vendors, programs, metrics, evidence, gaps, and relationships before any Tower UI/API is migrated.

The proof is intentionally conservative: it does not migrate Tower, does not change Tower answers, and does not allow realized-value claims unless measured evidence and Tower calculation validation exist.

## Layer Impact

- `experimental`: Adds an audit-only proof command and proof bundle for the Tower Knowledge Layer path.
- `global-control-lane`: Adds no runtime behavior change, but documents the Tower migration boundary for all tenants/modules.

## Client Applicability

- All clients: The Tower pressure-test standard applies to every tenant before Tower consumes Knowledge Layer measurement context.
- Specific clients: Proof fixtures cover Meridian Health and HarborTrust Bank.
- Internal only: The generated proof artifacts are engineering/operator evidence.
- Public/demo only: None.
- Feature flag: No flag default changes.

## Changes Included

- `package.json`: adds `npm run audit:tower-knowledge-pressure`.
- `scripts/audit/build-tower-knowledge-pressure-proof.ts`: generates the Tower pressure proof.
- `reports/enterprise-knowledge-layer/tower-pressure-proof/*`: generated JSON, CSV, Markdown, and HTML proof bundle.
- `docs/releases/records/2026-07-15-tower-knowledge-layer-pressure-test.md`: this release record.

## QA / Validation

- `npm run audit:tower-knowledge-pressure`: Pass.
- `npm run audit:enterprise-knowledge-cache`: Pass.
- `npm run audit:enterprise-knowledge-assembler`: Pass.
- `npm run audit:enterprise-knowledge-layer`: Pass.
- `npm run audit:enterprise-naming`: Pass.
- `npm run release:check`: Pass.
- Isolated TypeScript compile for touched Tower audit / Knowledge files: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge the PR to `main`. The change becomes available as an audit command and proof bundle. No product runtime path, module runtime behavior, tenant data, Active Tenant Access record, candidate version, or Tower answer path is changed.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow if merged to `main`.
- Shared runtime mutators: None introduced by this PR.
- Approved image digest: Determined by ACA main deploy workflow if merged.
- ACA runtime invariant: Required only if deployed through ACA main.
- Worker image invariant: Required only if deployed through ACA main.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for the audit command itself; required before any future Tower runtime migration claim.

## Rollback Plan

Revert the PR. No tenant data, candidate data, Active Tenant Access metadata, Tower value data, feature flags, or runtime behavior need rollback.

## Audit Evidence

- `reports/enterprise-knowledge-layer/tower-pressure-proof/summary.md`
- `reports/enterprise-knowledge-layer/tower-pressure-proof/summary.json`
- `reports/enterprise-knowledge-layer/tower-pressure-proof/tower-readiness.csv`
- `reports/enterprise-knowledge-layer/tower-pressure-proof/default-vs-knowledge-path-diff.json`
- `reports/enterprise-knowledge-layer/tower-pressure-proof/tower-knowledge-pressure-proof.html`

## Known Gaps

- Default Tower remains on the existing Tower/CIO read path; this PR does not migrate it.
- Lakehouse, core banking, and payments analytics scenarios show generic-context risk where the current semantic clusters are not specific enough.
- Realized-value claims remain blocked; measured value and calculation-basis proof is still required before Tower can claim savings, ROI, spend reduction, or value captured.

