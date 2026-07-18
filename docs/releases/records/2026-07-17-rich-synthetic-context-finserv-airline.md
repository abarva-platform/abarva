# 2026-07-17-rich-synthetic-context-finserv-airline - Rich Synthetic Candidate Context

## Release ID

`2026-07-17-rich-synthetic-context-finserv-airline`

## Status

`candidate`

## Plain-English Summary

Generates rich planning-grade synthetic candidate context for FS Demo and Airline Demo. The artifacts include source templates, executive interviews, deterministic derived layers, Home render packs, Tower context, Moves/Source handoff context, evidence lineage, graph context, gaps, retrieval chunks, and proof reports.

## Layer Impact

- Client data lane: adds candidate-only synthetic tenant data and manifests.
- Control/proof lane: adds generator, richness audit, guarded candidate-load preflight, reconciliation reports, and proof HTML.
- Runtime: demo-safe tenant label/configuration paths are updated so AbarVa-facing pages show `FS Demo` and `Airline Demo`; no default candidate context read path is changed.
- Data plane: no Azure/Postgres mutation is performed by this PR.

## Client Applicability

- All clients: no default runtime impact.
- Specific clients: FS Demo and Airline Demo candidate data only.
- Internal only: generation, audit, load-preflight, reconciliation, and proof reports.
- Public/demo only: AbarVa-facing demo labels for the financial-services and airline demo tenants.
- Feature flag: none.

## Changes Included

- `scripts/tenant-v3/generate-rich-synthetic-tenant.mjs`
- `scripts/audit/synthetic-tenant-richness.mjs`
- `scripts/knowledge/load-tenant-candidate-context.mjs`
- `scripts/knowledge/reconcile-tenant-data-plane.mjs`
- Demo-safe tenant labels in page/runtime configuration for `FS Demo` and `Airline Demo`.
- Candidate datasets under `datasets/tenant-inputs/candidates/` and derived artifacts under `datasets/tenant-inputs/generated/`.
- Dataset manifests under `docs/governance/dataset-manifests/`.
- Proof reports under `reports/*synthetic-context-generation/` and `reports/*azure-persistence/`.

## QA / Validation

- PASS: `npm run generate:synthetic-tenant -- --tenant first-capital-financial`
- PASS: `npm run generate:synthetic-tenant -- --tenant skyharbor-air`
- PASS: `npm run audit:synthetic-tenant-richness -- --tenant first-capital-financial`
- PASS: `npm run audit:synthetic-tenant-richness -- --tenant skyharbor-air`
- PASS: `npm run load:tenant-candidate-context -- --tenant first-capital-financial --dry-run`
- PASS: `npm run load:tenant-candidate-context -- --tenant skyharbor-air --dry-run`
- PASS: `npm run reconcile:tenant-data-plane -- --tenant first-capital-financial`
- PASS: `npm run reconcile:tenant-data-plane -- --tenant skyharbor-air`
- PASS: `npm run audit:home-candidate-consumption -- --tenant first-capital-financial`
- PASS: `npm run audit:home-candidate-consumption -- --tenant skyharbor-air`
- PASS: `npm run audit:tower-candidate-consumption -- --tenant first-capital-financial`
- PASS: `npm run audit:tower-candidate-consumption -- --tenant skyharbor-air`
- PASS: `npm run audit:intelligence-candidate-retrieval -- --tenant first-capital-financial`
- PASS: `npm run audit:intelligence-candidate-retrieval -- --tenant skyharbor-air`
- PASS: `npm run audit:moves-candidate-consumption -- --tenant first-capital-financial`
- PASS: `npm run audit:moves-candidate-consumption -- --tenant skyharbor-air`
- PASS: `npm run audit:source-candidate-consumption -- --tenant first-capital-financial`
- PASS: `npm run audit:source-candidate-consumption -- --tenant skyharbor-air`
- PASS: `npm run audit:default-runtime-invisibility`
- PASS: `npm run validate:context-corpus:manifests`
- PASS: `npm run audit:enterprise-naming`
- PASS: `npx jest src/lib/__tests__/client-config-canonical.test.ts --runInBand`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge only for source-controlled candidate artifacts and demo-safe label wiring. Candidate Azure/Postgres persistence requires a separately approved non-prod target and guarded write execution. Active promotion is out of scope.

## Deployment Authority

- Repo-owned deploy workflow: not used during PR validation. A merge to `main` may invoke the repo-owned ACA main deploy workflow; do not treat that as data-plane load or active-context promotion.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: only after a future approved candidate load and runtime preview path.

## Rollback Plan

Revert this PR to remove generated candidate files and scripts. If a future candidate load uses these artifacts, rollback must delete by `load_run_id` and candidate contract version before any active promotion.

## Audit Evidence

- first-capital-financial: 4840 source rows, 9680 canonical facts, 1600 graph nodes, 2600 graph edges, 2100 context gaps.
- skyharbor-air: 4840 source rows, 9680 canonical facts, 1600 graph nodes, 2600 graph edges, 2100 context gaps.

## Known Gaps

- Azure/Postgres candidate persistence is not run in this PR.
- Page/API consumption proof against the persisted data plane is pending the approved candidate load.
- AbarVa-facing page labels are `FS Demo` and `Airline Demo`; physical/generated tenant keys remain `first-capital-financial` and `skyharbor-air`.
- First Capital governance canonical key remains `first-capital`; physical generated tenant key for this lane is `first-capital-financial`.
