# 2026-07-21-home-tenant-coverage-artifacts — Home Tenant Coverage Artifacts

## Release ID

`2026-07-21-home-tenant-coverage-artifacts`

## Status

`candidate`

## Plain-English Summary

Home’s richer CXO cockpit was effectively Meridian-only because the page only rendered the design-contract surface for Meridian and the other active demo tenants did not have validated Home design-contract packs or derived relationship graphs. This release removes the Meridian-only render gate, promotes/derives planning-grade relationship depth for active demo tenants, and adds repeatable generators that create tenant-safe Home packs and source-derived relationship graphs from each active tenant’s current CSV files.

## Layer Impact

- `global-control-lane`: `/home` can render any tenant with a valid Home design-contract pack instead of hard-gating Meridian.
- `client-data-lane`: generated approved local Home packs and `relationship-graph.json` files for non-Meridian active demo tenants.
- `client-data-lane`: promoted validated SkyHarbor and First Capital relationship candidates into active planning-grade relationship rows, and derived equivalent active relationship rows for Retail Demo and Lakeshore Holdings from active source dimensions.
- `client-data-lane`: derived endpoint-complete Healthcare Demo relationship rows from active source dimensions and filtered pre-existing Meridian relationship graph self-loops so every active Home graph artifact is visual-ready without source-target identity edges.
- `internal-admin`: generated a local coverage report that separates local render artifacts from Azure/Postgres promotion.

## Client Applicability

- All clients: no runtime behavior changes unless a tenant has a valid approved design-contract pack.
- Specific clients: Airline Demo, FS Demo, Lakeshore Holdings, and Retail Demo receive local Home cockpit coverage artifacts.
- Internal only: generation script and report.
- Public/demo only: active synthetic/demo tenants only.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `scripts/knowledge/promote-active-relationship-depth.mjs`
- `scripts/knowledge/generate-home-tenant-coverage-artifacts.mjs`
- `scripts/qa/home-tenant-coverage-audit.mjs`
- Active relationship row updates under `datasets/tenant-inputs/active/<tenant>/current/12_relationships.csv`.
- Generated Home design-contract packs under `datasets/context-artifacts/approved/<tenant>/home-knowledge/`.
- Generated canonical mirror packs under `datasets/tenant-inputs/<tenant>/approved-content/home/`.
- Generated derived relationship graphs under `datasets/tenant-inputs/<tenant>/derived/`.
- Cleaned self-loop edges from `datasets/tenant-inputs/meridian-health/derived/relationship-graph.json`.
- Generated report under `reports/home-tenant-coverage/`.

## QA / Validation

- `pass` — `node scripts/knowledge/generate-home-tenant-coverage-artifacts.mjs --tenant=all`
- `pass` — `node scripts/knowledge/promote-active-relationship-depth.mjs --tenant=all`
- `pass` — `node scripts/qa/home-tenant-coverage-audit.mjs --tenant=all`
- `pass` — relationship depth now has complete endpoints and 0 self-loops: Airline Demo 380 rows, FS Demo 380 rows, Healthcare Demo 1,037 rows, Retail Demo 1,713 rows, Lakeshore Holdings 364 rows.
- `pass` — focused artifact validation confirmed 19 dimensions, 19 data slots, 19 story slots, non-empty relationship graphs, and no visible `Lakeshore Industries`, `First Capital Financial`, or `SkyHarbor Air` aliases in generated packs.
- `pass` — graph self-loop validation confirmed 0 self-loops for Airline Demo, FS Demo, Lakeshore Holdings, Retail Demo, and Healthcare Demo.
- `blocked` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reached diagnostics and is blocked by unrelated existing failures in `src/__tests__/integration/responsible-ai-acknowledgment-form.test.tsx`, `src/components/strategic-moves/__tests__/EvidenceWorkbench.tabs.test.tsx`, and `src/lib/source/agent-generation/data-layer-reconciliation.ts`.
- `pass` — `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeKnowledgeDesignContractSurface.tsx scripts/knowledge/generate-home-tenant-coverage-artifacts.mjs scripts/knowledge/promote-active-relationship-depth.mjs`

## Rollout Plan

Merge through PR. Runtime deploy follows the normal Azure Container Apps main lane. Local data artifacts become visible to the Home page after deploy because `readHomeKnowledgeDesignContractForTenant` reads the approved pack paths at runtime. Azure/Postgres promotion of the same relationship layer remains a separate governed ACA data-build job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, for `/home` across affected tenants

## Rollback Plan

Revert the page-gate change and remove the generated tenant artifact files from the release branch. No Azure/Postgres rollback is required because this release does not mutate database layers.

## Audit Evidence

- `reports/home-tenant-coverage/home-tenant-artifacts-summary.md`
- `reports/home-tenant-coverage/home-tenant-artifacts-summary.json`
- `reports/home-tenant-coverage/home-tenant-artifacts-summary.csv`
- `reports/home-tenant-coverage/relationship-depth-promotion-summary.md`
- `reports/home-tenant-coverage/relationship-depth-promotion-summary.json`
- `reports/home-tenant-coverage/relationship-depth-promotion-summary.csv`
- `reports/home-tenant-coverage/home-tenant-coverage-audit.md`
- `reports/home-tenant-coverage/home-tenant-coverage-audit.json`
- `reports/home-tenant-coverage/home-tenant-coverage-audit.csv`

## Known Gaps

- Azure/Postgres promotion is intentionally out of scope until the governed ACA data-build job runs.
- Relationship graphs are planning-grade source-derived artifacts until promoted through the graph substrate quality gate.
