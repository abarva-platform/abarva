# 2026-08-05-synthetic-healthcare-demo-phase-a — Synthetic Healthcare Demo Phase A Package

## Release ID

`2026-08-05-synthetic-healthcare-demo-phase-a`

## Status

`candidate`

## Plain-English Summary

Adds a dependency-free audit-only generator and validator for a synthetic healthcare demo package. The reusable repo code emits the large package into Downloads and keeps generated data out of git.
It also uses one lightweight enterprise outcomes/KPI map tab instead of separate value-driver or KPI catalog workbooks.
This correction hardens the Phase A audit gate so structural volume alone is insufficient: outcome-map substance, hard-question lineage, semantic predicates, planted source join keys, evidence subject relevance, field/source guidance, workbook usability and corrupted canaries must now pass before the package is audit-ready.

## Layer Impact

Layer 1 client intake lane: creates source-owner-shaped workbooks and source-system-shaped synthetic extracts for audit. Layer 2 adapter lane: documents future adapter expectations but does not execute adapters. Layer 3 canonical lane: records candidate model-fit gaps only. Layer 4 product lane: no product runtime or projection is changed.

## Client Applicability

All clients: no runtime effect.
Specific clients: none active.
Internal only: AbarVa audit workflow for a synthetic healthcare demo package.
Public/demo only: candidate package artifacts are local Downloads outputs, not a released demo tenant.
Feature flag: not applicable.

## Changes Included

- `scripts/source/build-phs-healthcare-demo-package.mjs`
- `scripts/source/validate-phs-healthcare-demo-package.mjs`
- `scripts/source/fixtures/phs-healthcare-demo/canary-defects.json`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_A_PACKAGE.md`
- `docs/source/PHS_HEALTHCARE_DEMO_MODEL_FIT_AUDIT.md`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_B_TEST_LOAD_PLAN.md`
- `docs/source/PHS_HEALTHCARE_DEMO_ONE_CLICK_MIGRATION_SPEC.md`
- `package.json` npm scripts

## QA / Validation

Passed: `node --check scripts/source/build-phs-healthcare-demo-package.mjs && node --check scripts/source/validate-phs-healthcare-demo-package.mjs`.
Passed: `node scripts/source/build-phs-healthcare-demo-package.mjs --out-dir /Users/anand/Downloads`.
Passed: `node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T175025Z`.
Passed: `unzip -t /Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T175025Z.zip`.
Passed: workbook inspection found exactly one `ENTERPRISE_OUTCOMES_AND_KPI_MAP` tab, no separate KPI/value-driver/dependency-tree tabs and 36 total sheets.
Passed: offline validation report records 30 corrupted canaries, 30 passed, 0 validation failures.
Passed: semantic readback found 180/180 questions with aligned planted source records, 180/180 with aligned evidence refs and 180/180 with both source and evidence aligned.
Passed: independent join audit found zero mismatches for BPO supplier quality, BAFO exception, med-surg rebate, purchase substitution, workforce pyramid, payments reconciliation, contract document completeness and workforce transition cost.
Passed: field/source map readback found 608 rows, zero missing generated native fields and one explicit `client_native_field_to_confirm` marker.

## Rollout Plan

No runtime rollout. This PR can merge as reusable audit tooling only. A future Phase B load requires separate approval, tenant bootstrap, additive migrations if approved, isolated lab/test deployment and signed-in proof.

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

Inspect the local proof ZIP, validation report JSON/HTML, file hashes, canary outputs and hard-stop statement produced by the generator. The latest local proof ZIP is `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T175025Z.zip`.
Proof ZIP SHA-256: `af186499c310aff63f21cd036c399cc7adf19f577d32637bcabd8fe8c52c06ce`.
Proof ZIP SHA-256 attestation: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T175025Z.zip.sha256`.
Latest generated counts: 70,485 structured rows; 16,000 evidence spans; 180 hard questions; 30 interview roles; 44 enterprise outcomes/KPI map records; 71 CDAO questions.
Before correction, the package could pass with placeholder canary statements and weaker lineage/substance checks. After correction, the emitted validation report proves resolved question coverage, substantive outcome-map rows across required portfolios, semantic predicate checks, evidence/source joins, planted source join keys, evidence subject relevance and real injected negative canaries.

## Known Gaps

The synthetic healthcare tenant is not active in canonical tenant code. No database load, migration, Cube update, web deployment, Source/Tower/Home/Intelligence/Moves/aVa proof or tenant activation has occurred.
