# 2026-08-05-synthetic-healthcare-demo-phase-a — Synthetic Healthcare Demo Phase A Package

## Release ID

`2026-08-05-synthetic-healthcare-demo-phase-a`

## Status

`candidate`

## Plain-English Summary

Adds a dependency-free audit-only generator and validator for a synthetic healthcare demo package. The reusable repo code emits the large package into Downloads and keeps generated data out of git.
It also uses one lightweight enterprise outcomes/KPI map tab instead of separate value-driver or KPI catalog workbooks.
This correction hardens the Phase A audit gate so structural volume alone is insufficient: outcome-map substance, hard-question lineage, semantic predicates, planted source join keys, evidence subject relevance, field/source guidance, workbook usability and corrupted canaries must now pass before the package is audit-ready.
The latest correction removes the arbitrary 40-file requirement, drops detailed payer claims/enrollment and Stars/HEDIS operational extracts from the core package, and replaces them with a small optional aggregate health-plan outcome snapshot. The validator now requires core-source completeness, blocks those detailed health-plan files in the Phase A core package, and checks optional-domain readiness without making sensitive health-plan data a prerequisite.

## Layer Impact

Layer 1 client intake lane: creates source-owner-shaped workbooks and source-system-shaped synthetic extracts for audit. Layer 2 adapter lane: documents future adapter expectations but does not execute adapters. Layer 3 canonical lane: records candidate model-fit gaps only. Layer 4 product lane: no product runtime or projection is changed.
The latest update adds an executable Layer 1 source-volume loader with `self-test`, `plan`, `preflight`, `apply` and `verify` modes. It remains gated: plan and self-test are local only, while apply requires an approved proof SHA and an ACA data-build job context.

## Client Applicability

All clients: no runtime effect.
Specific clients: none active.
Internal only: AbarVa audit workflow for a synthetic healthcare demo package.
Public/demo only: candidate package artifacts are local Downloads outputs, not a released demo tenant.
Feature flag: not applicable.

## Changes Included

- `scripts/source/build-phs-healthcare-demo-package.mjs`
- `scripts/source/validate-phs-healthcare-demo-package.mjs`
- `scripts/source/plan-phs-healthcare-demo-data-layers.mjs`
- `scripts/foundation-v2/load-phs-healthcare-demo-source-volume-db.mjs`
- `scripts/source/fixtures/phs-healthcare-demo/canary-defects.json`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_A_PACKAGE.md`
- `docs/source/PHS_HEALTHCARE_DEMO_MODEL_FIT_AUDIT.md`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_B_TEST_LOAD_PLAN.md`
- `docs/source/PHS_HEALTHCARE_DEMO_ONE_CLICK_MIGRATION_SPEC.md`
- `package.json` npm scripts

## QA / Validation

Passed: `node --check scripts/source/build-phs-healthcare-demo-package.mjs && node --check scripts/source/validate-phs-healthcare-demo-package.mjs`.
Passed: `node scripts/source/build-phs-healthcare-demo-package.mjs --out-dir /Users/anand/Downloads`.
Passed: `node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T214256Z`.
Passed: `unzip -t /Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T214256Z.zip`.
Passed: source-system extract readback found all required core enterprise extracts plus optional `HEALTH_PLAN_OUTCOME_SNAPSHOT.csv`; detailed payer claims/enrollment and detailed Stars/HEDIS extracts are absent.
Passed: SHA-256 attestation matches `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T214256Z.zip`.
Passed: workbook inspection found exactly one `ENTERPRISE_OUTCOMES_AND_KPI_MAP` tab, no separate KPI/value-driver/dependency-tree tabs and 36 total sheets.
Passed: offline validation report records 32 corrupted canaries, 32 passed, 0 validation failures.
Passed: semantic readback found 180/180 questions with aligned planted source records, 180/180 with aligned evidence refs and 180/180 with both source and evidence aligned.
Passed: independent join audit found zero mismatches for BPO supplier quality, BAFO exception, med-surg rebate, purchase substitution, workforce pyramid, payments reconciliation, contract document completeness and workforce transition cost.
Passed: field/source map readback found 608 rows, zero missing generated native fields and one explicit `client_native_field_to_confirm` marker.
Passed: `node --check scripts/source/plan-phs-healthcare-demo-data-layers.mjs`.
Passed: `npm run source:phs-healthcare-demo:data-layer-plan -- --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T214256Z --out-dir /Users/anand/Downloads`.
Passed: data-layer plan ZIP SHA-256 attestation matches `/Users/anand/Downloads/PHS_Healthcare_Demo_Data_Layer_Plan_20260805T214902Z.zip`.
Passed: `node --check scripts/foundation-v2/load-phs-healthcare-demo-source-volume-db.mjs`.
Passed: `npm run source:phs-healthcare-demo:layer1:self-test -- --out-dir /tmp/phs-layer1-self-test`.
Passed: `npm run source:phs-healthcare-demo:layer1:plan -- --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T214256Z --out-dir /tmp/phs-layer1-plan`.
Passed: negative apply-gate check stopped before mutation authority because `PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true` was not present.

## Rollout Plan

No runtime rollout. This PR can merge as reusable audit tooling only. A future Phase B load requires separate approval, tenant bootstrap, additive migrations if approved, isolated lab/test deployment and signed-in proof.
Layer 1 apply must run as an approved ACA data-build job with the exact proof SHA and isolated lab target; local plan proof is not activation proof.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: Phase B only, after explicit approval.

## Rollback Plan

Revert the generator, validator, fixtures, docs and npm scripts. Generated Downloads artifacts are local audit outputs and are not deployed or loaded.

## Audit Evidence

Inspect the local proof ZIP, validation report JSON/HTML, file hashes, canary outputs and hard-stop statement produced by the generator. The latest local proof ZIP is `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T214256Z.zip`.
Proof ZIP SHA-256: `95c3cd7540903551faa1a5a9705de8f8add3f449b8c03ceb61647a8f11e5c0da`.
Proof ZIP SHA-256 attestation: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T214256Z.zip.sha256`.
Latest generated counts: 70,497 structured rows; 39 source-system extract CSVs; 38 required core source extracts; 12 optional health-plan outcome snapshot rows; 16,000 evidence spans; 180 hard questions; 30 interview roles; 44 enterprise outcomes/KPI map records; 71 CDAO questions.
Latest non-mutating data-layer plan ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Data_Layer_Plan_20260805T214902Z.zip`.
Data-layer plan ZIP SHA-256: `124b4d6aae69e7cfc42f635e2bc29b9e24b1d5b9263c5d81b4a5e101628af847`.
Layer 1 planned counts: 39 source files; 50,597 source records; 1,519,811 source field values; mutation executed: false.
Layer 1 executable loader proof remains non-mutating unless `PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true`, the approved proof SHA and the ACA job context are present.
Before correction, the package could pass with placeholder canary statements and weaker lineage/substance checks. After correction, the emitted validation report proves resolved question coverage, substantive outcome-map rows across required portfolios, semantic predicate checks, evidence/source joins, planted source join keys, evidence subject relevance and real injected negative canaries.

## Known Gaps

The synthetic healthcare tenant is not active in canonical tenant code. No database load, migration, Cube update, web deployment, Source/Tower/Home/Intelligence/Moves/aVa proof or tenant activation has occurred.
