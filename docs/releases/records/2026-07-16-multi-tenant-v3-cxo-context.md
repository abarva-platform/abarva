# 2026-07-16-multi-tenant-v3-cxo-context — Multi-Tenant V3 CXO Context Generation

## Release ID

`2026-07-16-multi-tenant-v3-cxo-context`

## Status

`candidate`

## Plain-English Summary

Adds repeatable tenant context generation for Meridian, SkyHarbor Air, and First Capital Financial. The release creates synthetic, evidence-rich v3 tenant inputs, Meridian executive interview evidence through SA07 Executive Interview Insights, generated context packs, Home-derived context layers, approved Claude-derived Home/Knowledge story blocks plus visual specs, and pre-generated advisory content for Home, Tower, Intelligence, Moves, and Source. This is context/advisory-layer work only; it does not generate Source event outputs such as RFPs, BAFO packs, vendor responses, negotiation memos, or decision briefs.

The local product-consumption proof now also validates that Home static runtime rendering and generated module imports can retrieve the approved artifacts for all three tenants without cross-tenant contamination or user-facing internal build-language leaks. Azure/Postgres load, deployment, signed-in browser proof, and production retrieval proof remain pending.

The data-plane load plan and dry run now inventory the generated artifacts, map each artifact to either an existing candidate `intelligence_v7` target or an explicit file-backed/future-store reason, and prove that no Azure/Postgres mutation, active promotion, or deployment action is performed by the dry run.

A candidate-only non-prod loader and readback auditor have been added, but the local execution attempt was blocked before connection because the approved lab Azure Postgres hostname is private-DNS/VNet scoped. No database mutation occurred. The next apply attempt must run from the approved Azure private operator job or another VNet-visible non-prod runner using the same candidate-only loader.

## Layer Impact

- `client-data-lane`: Adds synthetic tenant context, governance manifests, and generated context artifacts for `meridian-health`, `skyharbor-air`, and `first-capital`.
- `global-control-lane`: Generalizes local generation and validation scripts so tenant context generation is no longer Meridian-only.
- `internal-admin`: Adds audit/generation/report commands operators can run before loading or reviewing tenant context and advisory artifacts.

## Client Applicability

- All clients: reusable generation and audit commands.
- Specific clients: `meridian-health`, `skyharbor-air`, `first-capital`.
- Internal only: generation scripts, validation scripts, reports, and local proof bundles.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New tenant configs under `scripts/tenant-v6/configs/`.
- Generic tenant config registry for Meridian, SkyHarbor, and First Capital.
- Generalized tenant V6/V7 generator, validator, and V7 derivation entry points.
- New v3 input generator and v3 input audit.
- New Meridian SA07 executive interview audit and proof reports.
- New Claude CXO story-block generator and stored-artifact audit.
- New module advisory-content generator/auditor for Home, Tower, Intelligence, Moves, and Source.
- New multi-tenant context data-flow HTML report with layer-by-layer volumetrics.
- New multi-tenant local runtime retrieval proof for Home static renders, module artifact imports, visual specs, tenant isolation, internal-language scans, and missing-artifact fallback behavior.
- New multi-tenant data-plane load plan and non-mutating dry-run manifest for candidate load review.
- New guarded non-prod data-plane loader/auditor commands that refuse production targets and never promote active versions.
- New governed dataset manifests for SkyHarbor and First Capital.
- Generated tenant inputs under `datasets/tenant-inputs/`.
- Generated context packs under `datasets/meridian-health-v6-v7-current-state-v1/`, `datasets/skyharbor-air-v3-v7-context-v1/`, and `datasets/first-capital-financial-v3-v7-context-v1/`.
- Generated Knowledge/Home CXO artifacts and reports under `reports/multi-tenant-cxo-story-generation/`.
- Generated module advisory artifacts under `reports/module-cxo-content/` and `src/lib/*/narratives/generated/`.

## QA / Validation

- Pass: `node scripts/tenant-v6/generate-tenant-v3-inputs.mjs --all`
- Pass: `npm run generate:tenant-v3-data -- --tenant meridian-health`
- Pass: `npm run generate:tenant-v3-data -- --tenant skyharbor-air`
- Pass: `npm run generate:tenant-v3-data -- --tenant first-capital`
- Pass: `node scripts/tenant-v6/generate-tenant-v6-pack.mjs --tenant meridian-health`
- Pass: `node scripts/tenant-v6/generate-tenant-v6-pack.mjs --tenant skyharbor-air`
- Pass: `node scripts/tenant-v6/generate-tenant-v6-pack.mjs --tenant first-capital`
- Pass: `node scripts/tenant-v6/validate-tenant-v6-pack.mjs --tenant meridian-health`
- Pass: `node scripts/tenant-v6/validate-tenant-v6-pack.mjs --tenant skyharbor-air`
- Pass: `node scripts/tenant-v6/validate-tenant-v6-pack.mjs --tenant first-capital`
- Pass: `node scripts/v7/build-home-derived-layer.mjs --dataset datasets/meridian-health-v6-v7-current-state-v1`
- Pass: `node scripts/v7/build-home-derived-layer.mjs --dataset datasets/skyharbor-air-v3-v7-context-v1`
- Pass: `node scripts/v7/build-home-derived-layer.mjs --dataset datasets/first-capital-financial-v3-v7-context-v1`
- Pass: `node scripts/knowledge/generate-cxo-story-blocks.mjs --tenant meridian-health`
- Pass: `node scripts/knowledge/generate-cxo-story-blocks.mjs --tenant skyharbor-air`
- Pass: `node scripts/knowledge/generate-cxo-story-blocks.mjs --tenant first-capital`
- Pass: `npm run audit:meridian-executive-interviews`
- Pass: `npm run generate:module-cxo-content:all`
- Pass: `npm run audit:module-cxo-content:all`
- Pass: `npm run report:multi-tenant-context-data-flow`
- Pass: `node scripts/knowledge/audit-cxo-story-blocks.mjs --all`
- Pass: `node scripts/tenant-v6/audit-tenant-v3-inputs.mjs --all`
- Pass: `npm run audit:multi-tenant-cxo-context-proof-gate`
- Pass: `npm run audit:multi-tenant-runtime-retrieval-proof`
- Pass: `npm run plan:multi-tenant-data-plane-load`
- Blocked before connection: `npm run load:multi-tenant-data-plane -- --env nonprod --manifest reports/multi-tenant-data-plane-load-plan/load-manifest.csv` (`getaddrinfo ENOTFOUND` for private lab Postgres hostname from local machine; no mutation)
- Blocked before connection: `npm run audit:multi-tenant-data-plane-load -- --env nonprod --manifest reports/multi-tenant-data-plane-load-plan/load-manifest.csv` (`getaddrinfo ENOTFOUND` for private lab Postgres hostname from local machine; no mutation)
- Pass: `npm run audit:tenant-v3-data -- --tenant meridian-health`
- Pass: `npm run audit:tenant-v3-data -- --tenant skyharbor-air`
- Pass: `npm run audit:tenant-v3-data -- --tenant first-capital`
- Pass: `npm run audit:knowledge-cxo-story-blocks -- --tenant meridian-health`
- Pass: `npm run audit:knowledge-cxo-story-blocks -- --tenant skyharbor-air`
- Pass: `npm run audit:knowledge-cxo-story-blocks -- --tenant first-capital`
- Pass: `npm run audit:multi-tenant-cxo-story-generation`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `npm run validate:context-corpus:manifests`
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand` (pre-existing duplicate manual mock warnings emitted; suite passed)
- Pass: `node --check` on the new/changed knowledge and tenant audit scripts
- Pass: `git diff --check`

## Rollout Plan

Merge through PR. These are generated data, reports, and local/operator scripts. No Azure Container Apps runtime, traffic, feature flag, environment variable, or worker image changes are required by this release. Any future Azure/Postgres load must use the approved operator job lane and capture read-model, retrieval, and signed-in proof separately.

## Deployment Authority

- Repo-owned deploy workflow: not applicable for this data-generation candidate.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this local context-generation candidate; required before claiming tenant-visible Home/Knowledge production behavior.

## Rollback Plan

Revert the PR to remove generated tenant context, manifests, scripts, reports, and package scripts. If any future operator job loads these artifacts into Azure/Postgres, rollback must delete the corresponding dataset/version rows and search chunks through the data-plane rollback runbook after confirming no dependent proof artifacts are still required.

## Audit Evidence

- `datasets/tenant-generation-manifest.v3.json`
- `docs/governance/dataset-manifests/skyharbor-air-v3-v7-context-v1.json`
- `docs/governance/dataset-manifests/first-capital-financial-v3-v7-context-v1.json`
- `out/skyharbor-air-v3-v7-context-v1-validation.json`
- `out/first-capital-financial-v3-v7-context-v1-validation.json`
- `out/meridian-health-v6-v7-current-state-v1-validation.json`
- `reports/meridian-executive-interview-context-pack/summary.md`
- `reports/meridian-executive-interview-context-pack/proof.html`
- `reports/skyharbor-context-depth-pack/summary.md`
- `reports/financial-context-depth-pack/summary.md`
- `reports/module-cxo-content/summary.md`
- `reports/module-cxo-content/summary.json`
- `reports/multi-tenant-context-data-flow/context-data-flow.html`
- `reports/multi-tenant-runtime-retrieval-proof/summary.md`
- `reports/multi-tenant-runtime-retrieval-proof/tenant-retrieval.csv`
- `reports/multi-tenant-runtime-retrieval-proof/rendered-blocks.csv`
- `reports/multi-tenant-runtime-retrieval-proof/module-content-retrieval.csv`
- `reports/multi-tenant-runtime-retrieval-proof/visual-spec-renderability.csv`
- `reports/multi-tenant-runtime-retrieval-proof/tenant-isolation-scan.csv`
- `reports/multi-tenant-runtime-retrieval-proof/internal-language-scan.csv`
- `reports/multi-tenant-runtime-retrieval-proof/proof.html`
- `reports/multi-tenant-runtime-retrieval-proof/screenshots/`
- `reports/multi-tenant-data-plane-load-plan/summary.md`
- `reports/multi-tenant-data-plane-load-plan/load-manifest.csv`
- `reports/multi-tenant-data-plane-load-plan/dry-run-results.csv`
- `reports/multi-tenant-data-plane-load-plan/table-mapping.md`
- `reports/multi-tenant-data-plane-load-plan/rollback-plan.md`
- `reports/multi-tenant-data-plane-load-plan/tenant-isolation-plan.md`
- `reports/multi-tenant-data-plane-load-plan/active-candidate-boundary-check.csv`
- `reports/multi-tenant-data-plane-load-plan/proof.html`
- `reports/multi-tenant-nonprod-data-plane-load/summary.md`
- `reports/multi-tenant-nonprod-data-plane-load/load-results.csv`
- `reports/multi-tenant-nonprod-data-plane-load/readback-validation.csv`
- `reports/multi-tenant-nonprod-data-plane-load/checksum-validation.csv`
- `reports/multi-tenant-nonprod-data-plane-load/tenant-isolation-validation.csv`
- `reports/multi-tenant-nonprod-data-plane-load/rollback-ready.csv`
- `reports/multi-tenant-nonprod-data-plane-load/proof.html`
- `reports/multi-tenant-cxo-story-generation/summary.md`
- `reports/multi-tenant-cxo-story-generation/proof-gate-summary.md`
- `reports/multi-tenant-cxo-story-generation/proof-gate.json`
- `reports/multi-tenant-cxo-story-generation/tenant-isolation-scan.csv`
- `reports/multi-tenant-cxo-story-generation/user-facing-language-scan.csv`
- `reports/multi-tenant-cxo-story-generation/context-story-quality-review.md`
- `reports/multi-tenant-cxo-story-generation/visual-spec-validation.csv`
- `reports/multi-tenant-cxo-story-generation/skyharbor-air/proof.html`
- `reports/multi-tenant-cxo-story-generation/first-capital/proof.html`
- `reports/multi-tenant-cxo-story-generation/meridian-health/proof.html`

## Known Gaps

- No Source event artifacts are generated in this release by design.
- No Azure/Postgres load, retrieval proof, or signed-in production Home/Knowledge browser proof has been performed yet.
- Non-prod Azure/Postgres load is not complete: local execution is blocked by private DNS/VNet access and must run from the approved private operator runner.
- Generated context is synthetic planning-grade evidence, not real client data or audited value evidence.
