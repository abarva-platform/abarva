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
This update supersedes the interim 39-file and 50-file Layer 1 plans. The plan-only Layer 1 release is now exactly 54 named CSV files: 38 enterprise-context files, 1 optional-domain context file, 11 existing BPO sourcing-event files and 4 BPO transition/transformation files. It also adds machine-readable document archetype content contracts, a contract-family audit view and a future event-context snapshot contract without creating a snapshot or mutating runtime data.
The current correction keeps the frozen package unchanged and fixes the blocked Layer 1 execution substrate: the PHS loader now targets only `foundation_v2_phs_demo`, uses PHS-specific writer/reader roles, requires the frozen source release ID, writes 54 source-file routing metadata rows and rejects local/non-ACA apply even if the old bypass env is present.
The latest operator-readiness patch adds an exact PHS schema/RLS migration runner and lets the source-volume loader consume the approved proof ZIP by URL inside ACA, with SHA-256 verification before extraction.
The continuous lab execution update adds isolated Layer 2 adapter/candidate staging for the loaded PHS source volume. It stages normalized source-record objects and review candidates only; it does not publish canonical objects, activate baselines, refresh Cube or bind product runtime surfaces.
The latest lab execution pass applies and independently verifies Layer 2 inside `foundation_v2_phs_demo`: 54,967 normalized objects, 54,967 knowledge candidates, three adapter gates and 1,640,131 field dispositions now reconcile exactly to the verified Layer 1 source volume.
This update also adds the governed expert narrative and architecture quality gate to the PHS Phase B execution plan. Home, architecture, Source, Intelligence, Moves and aVa prose must wait until the data, relationships, findings, evidence and reconciliations pass; accepted artifacts must come from the shared advisory-packet path with deterministic lint, independent critique, revision and validation.

## Layer Impact

Layer 1 client intake lane: creates source-owner-shaped workbooks and source-system-shaped synthetic extracts for audit. Layer 2 adapter lane: documents future adapter expectations but does not execute adapters. Layer 3 canonical lane: records candidate model-fit gaps only. Layer 4 product lane: no product runtime or projection is changed.
The latest update adds an executable Layer 1 source-volume loader with `self-test`, `plan`, `preflight`, `apply` and `verify` modes. It remains gated: plan and self-test are local only, while apply requires an approved proof SHA, exact PHS schema/tenant/namespace/release/role contract and an ACA data-build job context. Application, CMDB, vendor and contract rows are tenant enterprise-context candidates; the sourcing event references selected entity IDs and later pins an immutable event-context snapshot through a separate governed action.
The continuous lab execution update adds Layer 2 migration, self-test, preflight, apply and verify commands. Layer 2 writes only isolated normalized-object and knowledge-candidate staging rows in `foundation_v2_phs_demo`; canonical promotion and product projections remain out of scope.
The latest lab execution update moves Layer 2 from expected to verified in the isolated lab schema only. It does not advance candidate rows into canonical objects, data products, Cube, product read models or tenant activation.
The narrative gate affects only future Layer 4/5 artifact generation and signed-in proof. It does not authorize early narrative generation, canonical publication, Cube refresh, product runtime binding or tenant activation.

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
- `scripts/foundation-v2/apply-phs-healthcare-demo-schema.mjs`
- `scripts/foundation-v2/apply-phs-healthcare-demo-layer2-schema.mjs`
- `scripts/foundation-v2/normalize-phs-healthcare-demo-source-volume-db.mjs`
- `scripts/source/fixtures/phs-healthcare-demo/canary-defects.json`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_A_PACKAGE.md`
- `docs/source/PHS_HEALTHCARE_DEMO_MODEL_FIT_AUDIT.md`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_B_TEST_LOAD_PLAN.md`
- `docs/source/PHS_HEALTHCARE_DEMO_ONE_CLICK_MIGRATION_SPEC.md`
- `supabase/migrations/20260805230000_foundation_v2_phs_demo_source_volume.sql`
- `supabase/migrations/20260806002000_foundation_v2_phs_demo_adapter_candidates.sql`
- `package.json` npm scripts

## QA / Validation

Passed: `node --check scripts/source/build-phs-healthcare-demo-package.mjs && node --check scripts/source/validate-phs-healthcare-demo-package.mjs`.
Passed: `node scripts/source/build-phs-healthcare-demo-package.mjs --out-dir /Users/anand/Downloads`.
Passed: `node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z`.
Passed: `unzip -t /Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip`.
Passed: source-system extract readback found all required core enterprise extracts plus optional `HEALTH_PLAN_OUTCOME_SNAPSHOT.csv`; detailed payer claims/enrollment and detailed Stars/HEDIS extracts are absent.
Passed: SHA-256 attestation matches `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip`.
Passed: workbook inspection found exactly one `ENTERPRISE_OUTCOMES_AND_KPI_MAP` tab and no separate KPI/value-driver/dependency-tree tabs.
Passed: offline validation report records 45 corrupted canaries, 45 passed, 0 validation failures.
Passed: semantic readback found 180/180 questions with aligned planted source records, 180/180 with aligned evidence refs and 180/180 with both source and evidence aligned.
Passed: independent join audit found zero mismatches for BPO supplier quality, BAFO exception, med-surg rebate, purchase substitution, workforce pyramid, payments reconciliation, contract document completeness and workforce transition cost.
Passed: field/source map readback found zero missing generated native fields and one explicit `client_native_field_to_confirm` marker.
Passed: `node --check scripts/source/plan-phs-healthcare-demo-data-layers.mjs`.
Passed: `npm run source:phs-healthcare-demo:data-layer-plan -- --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z --out-dir /Users/anand/Downloads`.
Passed: data-layer plan ZIP SHA-256 attestation matches `/Users/anand/Downloads/PHS_Healthcare_Demo_Data_Layer_Plan_20260805T230818Z.zip`.
Passed: `node --check scripts/foundation-v2/load-phs-healthcare-demo-source-volume-db.mjs`.
Passed: `node --check scripts/foundation-v2/apply-phs-healthcare-demo-schema.mjs`.
Passed: `npm run source:phs-healthcare-demo:layer1:self-test -- --out-dir /tmp/phs-layer1-self-test`.
Passed: `npm run source:phs-healthcare-demo:layer1:plan -- --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T223224Z --out-dir /tmp/phs-layer1-plan`.
Passed: `npm run source:phs-healthcare-demo:layer1:plan -- --package-zip /Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip --package-zip-sha256 a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553 --out-dir /tmp/phs-layer1-plan-zip`.
Passed: negative apply-gate check stopped before mutation authority because `PHS_HEALTHCARE_DEMO_LAYER1_APPLY_APPROVED=true` was not present.
Passed: negative schema-target check rejected `PHS_HEALTHCARE_DEMO_DB_SCHEMA=foundation_v2_healthcare_gs` before database mutation path.
Passed: negative local apply check rejected execution without `ACA_JOB_NAME` even with approval env and the exact proof SHA present.
Passed: negative local apply check still rejected execution without `ACA_JOB_NAME` when the removed `PHS_HEALTHCARE_DEMO_ALLOW_NON_ACA_APPLY=true` bypass env was present.
Passed: ACA Layer 1 schema apply, source-volume preflight, apply and independent reader verify against `foundation_v2_phs_demo`; final readback matched 54 source files, 54 source-file context rows, 54,967 source records and 1,640,131 source field values.
Passed: `node --check scripts/foundation-v2/apply-phs-healthcare-demo-layer2-schema.mjs && node --check scripts/foundation-v2/normalize-phs-healthcare-demo-source-volume-db.mjs`.
Passed: `npm run source:phs-healthcare-demo:layer2:self-test -- --out-dir /tmp/phs-layer2-self-test`.
Passed: ACA Layer 2 schema apply against `foundation_v2_phs_demo`; migration `20260806002000_foundation_v2_phs_demo_adapter_candidates.sql` created the isolated candidate-staging tables with forced RLS and no data rows.
Passed: ACA Layer 2 preflight after lock diagnostic; source readback matched 54 files, 54,967 source records and 1,640,131 field values, with zero existing Layer 2 rows.
Passed: ACA Layer 2 apply through the approved data-build job path; proof status `PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED` recorded 54,967 normalized objects, 54,967 knowledge candidates, three adapter gates, `exact_match=true` and no broken transition.
Passed: ACA Layer 2 independent reader verify; proof status `PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED` repeated the same counts with `mutation_executed=false`.
Passed: PHS Phase B plan updated to require the shared governed advisory packet, module-boundary rules, role-specific lenses, generic-language control, critique/revision loop and side-by-side claim-to-evidence artifact audit before any Home, architecture, Source, Intelligence, Moves or aVa narrative is accepted.

## Rollout Plan

No product/runtime rollout. Continue lab-only execution in the existing branch and release evidence trail. Layer 1 and Layer 2 have both been applied through the approved ACA data-build job path and independently verified inside the isolated lab schema.
Narrative artifacts remain blocked until the later data layers, relationships, findings, evidence, read models and Cube reconciliation pass. The only approved pre-generated artifacts are the six governed demo artifacts named in the Phase B plan, and only after the shared packet assembler and quality gates exist.
The approved target remains schema `foundation_v2_phs_demo`, tenant `phs_health_demo_global`, namespace `phs-healthcare-demo-source-volume-v1`, writer role `foundation_v2_phs_demo_writer`, reader role `foundation_v2_phs_demo_reader` and source release `phs-health-source-v1-202608:source-volume-v1:447910ac3c16`.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable for shared runtime. The lab ACA data-build job used the isolated PHS lab image digest `acrabarvalab001.azurecr.io/abarva/phs-healthcare-demo-lab@sha256:81a2abb534066a3683e8609887842aba0983ed9e3b2bfc4e32b7795b27cc2fdf`.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: Phase B only, after explicit approval.

## Rollback Plan

Revert the generator, validator, fixtures, docs and npm scripts. Generated Downloads artifacts are local audit outputs and are not deployed or loaded.

## Audit Evidence

Inspect the local proof ZIP, validation report JSON/HTML, file hashes, canary outputs and hard-stop statement produced by the generator. The latest local proof ZIP is `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip`.
Proof ZIP SHA-256: `a800303a62b2a2a88badcfdb25d83790f236a53416dd267ae18c40ab312ba553`.
Proof ZIP SHA-256 attestation: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T223224Z.zip.sha256`.
Latest generated counts: 70,967 structured rows; 54 Layer 1 release CSVs; 38 enterprise-context files; 1 optional-domain context file; 11 existing BPO sourcing-event files; 4 BPO transition/transformation files; 16,000 evidence spans; 180 hard questions; 30 interview roles; 44 enterprise outcomes/KPI map records; 71 CDAO questions; 21 document archetype content contracts; 30 contract-family audit documents.
Latest non-mutating data-layer plan ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Data_Layer_Plan_20260805T230818Z.zip`.
Data-layer plan ZIP SHA-256: `5f525057fec4202c173a4a65f0a5d522cb8635927bddd79e1a2083ce2544d783`.
Layer 1 verified ACA readback counts: 54 source files; 54 source-file context rows; 54,967 source records; 1,640,131 source field slots; 1 parser execution; 2 source-volume gates.
Layer 2 verified ACA readback counts: 54,967 normalized objects; 54,967 knowledge candidates; 3 adapter gates; 1,640,131 field dispositions; `exact_match=true`; no broken transition.
Layer 2 ACA proof paths: `/Users/anand/Downloads/phs-healthcare-demo-layer2-aca-20260806T003650Z/20-layer2-preflight-after-lock-cleanup/proof/PHS_NORMALIZATION_CANDIDATES.json`, `/Users/anand/Downloads/phs-healthcare-demo-layer2-aca-20260806T003650Z/21-layer2-apply-after-lock-cleanup/proof/PHS_NORMALIZATION_CANDIDATES.json`, `/Users/anand/Downloads/phs-healthcare-demo-layer2-aca-20260806T003650Z/22-layer2-verify-after-lock-cleanup/proof/PHS_NORMALIZATION_CANDIDATES.json`.
Governed narrative acceptance now requires side-by-side audit from narrative claim to packet fact/finding to source record to evidence span to Cube measure where applicable; document rendering alone is not acceptable proof.
Before correction, the package could pass with placeholder canary statements and weaker lineage/substance checks. After correction, the emitted validation report proves resolved question coverage, substantive outcome-map rows across required portfolios, semantic predicate checks, evidence/source joins, planted source join keys, evidence subject relevance and real injected negative canaries.

## Known Gaps

The synthetic healthcare tenant is not active in canonical tenant code. No canonical promotion, Cube update, web deployment, Source/Tower/Home/Intelligence/Moves/aVa proof or tenant activation has occurred.
