# 2026-07-16-candidate-invisibility-guard — Multi-Tenant Candidate Invisibility Guard

## Release ID

`2026-07-16-candidate-invisibility-guard`

## Status

`candidate`

## Plain-English Summary

This release hardens the multi-tenant Home/Knowledge runtime so newly loaded candidate tenant context cannot become visible just because it exists in shared `intelligence_v7` tables. Default runtime reads now require the explicit active tenant contract pointer. Candidate data can be viewed only through an intentional candidate preview request, and that preview is visibly labeled as not active tenant truth.

## Layer Impact

Application runtime read layer: Home, Knowledge, Intelligence V7 dossier retrieval, and Tower V7 projection now read through `intelligence_v7.active_tenant_contract_versions` instead of treating latest loaded or validated pack rows as current truth.

Data-plane safety layer: No data is loaded or promoted by this release. The guard makes future candidate loads safer by preventing default runtime visibility without active promotion.

Proof/reporting layer: Adds `npm run audit:candidate-invisibility` and proof outputs under `reports/candidate-invisibility-guard/`.

## Client Applicability

- All clients: Yes, for shared Home/Knowledge and module runtime read safety.
- Specific clients: Meridian, SkyHarbor Air, and First Capital are the immediate multi-tenant proof tenants.
- Internal only: The audit/proof script is operator-facing.
- Public/demo only: No.
- Feature flag: No runtime feature flag; candidate preview requires explicit URL parameters.

## Changes Included

- Active-pointer read guard in Home V7 context browser, Home/Knowledge V7 ask, Intelligence V7 dossier, and Tower V7 projection.
- Explicit Home candidate preview mode using `candidatePreview=true` plus `candidateContractVersion`.
- Visible candidate preview labels: `Candidate preview`, `Not active tenant truth`, and `Not used by default module runtime`.
- Regression tests for active pointer selection, candidate invisibility, missing-active fallback, explicit candidate preview, preview labeling, and tenant isolation.
- New non-mutating audit command: `npm run audit:candidate-invisibility`.

## QA / Validation

- Pass: `npm run audit:candidate-invisibility`
- Pass: targeted Jest for Home V7 browser, HomeSurface, Home/Knowledge V7 ask, Intelligence V7 dossier, and Tower V7 projection.
- Pass: `npm run audit:multi-tenant-runtime-retrieval-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Note: the first default-heap TypeScript attempt exhausted Node heap before diagnostics; the higher-heap compile completed successfully.

## Rollout Plan

Merge through PR. No Azure/Postgres load, no tenant promotion, no deploy, and no data-plane mutation are included in this release candidate. Runtime activation occurs only after the normal ACA release path deploys the merged app image.

## Deployment Authority

- Repo-owned deploy workflow: Required for any future app deployment.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Required only after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after any deploy before claiming live product proof.

## Rollback Plan

Revert this release commit or redeploy the last known-good ACA image digest. No database rollback is required because this release performs no data-plane mutation.

## Audit Evidence

- `reports/candidate-invisibility-guard/summary.md`
- `reports/candidate-invisibility-guard/reader-audit.csv`
- `reports/candidate-invisibility-guard/default-read-tests.csv`
- `reports/candidate-invisibility-guard/candidate-preview-tests.csv`
- `reports/candidate-invisibility-guard/proof.html`

## Known Gaps

No Azure/Postgres load, no tenant promotion, no deploy, and no signed-in browser proof are claimed by this release candidate.
