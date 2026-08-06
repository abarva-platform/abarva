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
The current Layer 3 continuation adds isolated canonical-promotion tables and operator commands that resolve every Layer 2 candidate into a deterministic promotion decision while separating master entities, observations, relationships, evidence records and event-native sourcing records. It explicitly blocks the defective pattern of treating every row-level candidate as a canonical enterprise master entity.
The latest Layer 3 lab execution applies and independently verifies canonical promotion inside `foundation_v2_phs_demo`: 54,967 promotion decisions resolve into 794 canonical master entities, 47,941 transactional observations, 2,390 relationships, 16,000 evidence records and 4,370 event-native records, with exact match and no defects.
The Layer 4 continuation adds governed typed business-grain projections for product consumption, including vendor portfolio, contract families, contract scope, spend/invoice history, workforce/rate-card economics, SLA/ITSM performance, service credits, applications/services/dependencies, renewal/exit terms, modernization dependencies, enterprise outcomes, BPO baseline, supplier proposals/BAFO, rebadge/transition commitments, AI/automation commitments, retained-organization scenarios, normalized TCO inputs and immutable event-context snapshot. Generic observations remain blocked from direct product exposure.
The Layer 5 continuation builds and proves a private internal Cube canary for the PHS healthcare demo tenant and the existing synthetic airline tenant. It verifies Postgres/Cube reconciliation, dimensions, measures, hierarchy, drill members, missing-tenant rejection, tenant isolation and zero regression for the airline baseline without shifting shared Cube traffic.
The Layer 6 continuation binds Source, Home, Intelligence, Moves, Tower and aVa to the governed projections and Cube proof. It generates only the six governed narrative artifacts after deterministic findings and Cube reconciliation pass, using the same AdvisoryPacket shape as live aVa and preserving human-approval gates for planning-grade recommendations.

## Layer Impact

Layer 1 client intake lane: creates source-owner-shaped workbooks and source-system-shaped synthetic extracts for audit. Layer 2 adapter lane: stages normalized objects and knowledge candidates. Layer 3 canonical lane: promotes verified candidates into the isolated PHS canonical-promotion substrate only. Layer 4 projection lane: publishes typed isolated projections for product consumption. Layer 5 semantic lane: proves a private Cube canary. Layer 6 product-binding lane: binds product modules to typed projections and Cube proof without shared traffic shift.
The latest update adds an executable Layer 1 source-volume loader with `self-test`, `plan`, `preflight`, `apply` and `verify` modes. It remains gated: plan and self-test are local only, while apply requires an approved proof SHA, exact PHS schema/tenant/namespace/release/role contract and an ACA data-build job context. Application, CMDB, vendor and contract rows are tenant enterprise-context candidates; the sourcing event references selected entity IDs and later pins an immutable event-context snapshot through a separate governed action.
The continuous lab execution update adds Layer 2 migration, self-test, preflight, apply and verify commands. Layer 2 writes only isolated normalized-object and knowledge-candidate staging rows in `foundation_v2_phs_demo`; canonical promotion and product projections remain out of scope.
The latest lab execution update moves Layer 2 from expected to verified in the isolated lab schema only. It does not advance candidate rows into canonical objects, data products, Cube, product read models or tenant activation.
The narrative gate affects only future Layer 4/5 artifact generation and signed-in proof. It does not authorize early narrative generation, canonical publication, Cube refresh, product runtime binding or tenant activation.
The current Layer 3 update remains in the isolated PHS schema. It applies and verifies the PHS-only canonical-promotion substrate, but does not publish shared canonical objects or activate a tenant.
The Layer 4/5/6 updates remain private-lab only. They do not shift shared Cube traffic, deploy web traffic, activate a tenant, publish shared canonical objects or promote any recommendation beyond governed planning-grade output.

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
- `scripts/foundation-v2/apply-phs-healthcare-demo-layer3-schema.mjs`
- `scripts/foundation-v2/promote-phs-healthcare-demo-canonical-db.mjs`
- `scripts/foundation-v2/apply-phs-healthcare-demo-layer4-schema.mjs`
- `scripts/foundation-v2/project-phs-healthcare-demo-consumption-db.mjs`
- `scripts/foundation-v2/apply-phs-healthcare-demo-layer5-cube-canary-schema.mjs`
- `scripts/source/verify-phs-healthcare-demo-cube-canary.mjs`
- `scripts/foundation-v2/bind-phs-healthcare-demo-layer6-products.mjs`
- `cube/model/phs_healthcare_demo.yml`
- `cube/cube.py`
- `Dockerfile.cube`
- `scripts/source/fixtures/phs-healthcare-demo/canary-defects.json`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_A_PACKAGE.md`
- `docs/source/PHS_HEALTHCARE_DEMO_MODEL_FIT_AUDIT.md`
- `docs/source/PHS_HEALTHCARE_DEMO_PHASE_B_TEST_LOAD_PLAN.md`
- `docs/source/PHS_HEALTHCARE_DEMO_ONE_CLICK_MIGRATION_SPEC.md`
- `supabase/migrations/20260805230000_foundation_v2_phs_demo_source_volume.sql`
- `supabase/migrations/20260806002000_foundation_v2_phs_demo_adapter_candidates.sql`
- `supabase/migrations/20260806041000_foundation_v2_phs_demo_canonical_promotion.sql`
- `supabase/migrations/20260806125500_foundation_v2_phs_demo_layer3_repair_delete_grants.sql`
- `supabase/migrations/20260806132000_foundation_v2_phs_demo_layer4_projections.sql`
- `supabase/migrations/20260806161000_foundation_v2_phs_demo_layer6_product_bindings.sql`
- `supabase/migrations/20260806162500_foundation_v2_phs_demo_layer6_canary_read_grants.sql`
- `supabase/migrations/20260806165500_foundation_v2_phs_demo_layer6_gate_update_grant.sql`
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
Passed: `node --check scripts/foundation-v2/apply-phs-healthcare-demo-layer3-schema.mjs && node --check scripts/foundation-v2/promote-phs-healthcare-demo-canonical-db.mjs`.
Passed: `npm run source:phs-healthcare-demo:layer3:self-test -- --out-dir /tmp/phs-layer3-self-test`.
Blocked locally, as expected: Layer 3 schema dry-run and preflight require an Azure/Postgres database URL; database proof is expected through the ACA data-build job with the configured database secret.
Passed: ACA Layer 3 schema apply against `foundation_v2_phs_demo`; migration `20260806041000_foundation_v2_phs_demo_canonical_promotion.sql` created the isolated canonical-promotion tables with forced RLS and no Layer 3 rows.
Passed: ACA Layer 3 post-stop preflight with the optimized lab image; source readback and Layer 2 readback matched exactly, and existing Layer 3 row count was zero.
Passed: ACA Layer 3 canonical promotion apply through the approved data-build job path; proof status `PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFIED` recorded 54,967 promotion decisions, 794 canonical entities, 47,941 observations, 2,390 relationships, 16,000 evidence records, 4,370 event-native records, `exact_match=true` and no defects.
Passed: ACA Layer 3 independent reader verify repeated the same counts with `mutation_executed=false`, `exact_match=true` and no defects.
Passed: source-to-Layer 3 reconciliation packet compared verified Layer 1 source-file rows, verified Layer 2 normalized/candidate rows and verified Layer 3 file-resolution rows. All 54 loaded source files reconciled with zero file-level failures and zero defects.
Passed: Layer 3 semantic identity repair for program/initiative dependencies found 24 distinct source program IDs, 360 distinct source initiative IDs, 24 canonical programs, 5 canonical initiative concepts, 360 dependency relationships, 5 duplicate names across IDs and 0 orphan initiatives. The repair eliminated dependency-row inflation while preserving dependency rows.
Passed: ACA Layer 3 repair apply/verify repeated accepted counts: 54,967 promotion decisions, 794 canonical master entities, 47,941 observations, 2,390 relationships, 16,000 evidence records, 4,370 event-native records, zero source-file failures and zero reconciliation defects.
Passed: `node --check scripts/foundation-v2/apply-phs-healthcare-demo-layer4-schema.mjs && node --check scripts/foundation-v2/project-phs-healthcare-demo-consumption-db.mjs`.
Passed: ACA Layer 4 projection apply/verify produced 18 projection authorities, 3,193 typed projection rows, 3,193 projection field-lineage rows, 1 immutable event-context snapshot, `exact_match=true`, 0 generic-observation projection rows, 0 airline projection rows, 0 missing source refs and no defects.
Passed: `node --check scripts/foundation-v2/apply-phs-healthcare-demo-layer5-cube-canary-schema.mjs && node --check scripts/source/verify-phs-healthcare-demo-cube-canary.mjs`.
Passed: `npm run source:phs-healthcare-demo:cube-canary:model`; model proof recorded 18 cubes, 66 measures, 18 hierarchies and no failures.
Passed: private internal Cube canary runtime verification returned health 200, missing-tenant rejection 403, tenant-isolation cross-check counts of 0, 18 typed PHS canary tables reconciled to Postgres, drill-member readback succeeded and the airline regression set matched expected counts and amounts.
Passed: `node --check scripts/foundation-v2/bind-phs-healthcare-demo-layer6-products.mjs`.
Passed: `npm run source:phs-healthcare-demo:layer6:self-test -- --out-dir /tmp/phs-layer6-self-test-scan-fix`.
Passed: ACA Layer 6 migration/grant apply, product-binding apply and independent verify. Final proofs recorded 6 module bindings, 11 hero journey findings, 6 generated governed narrative artifacts, 0 unsupported findings, 0 unsupported claim artifacts, 0 unsupported-claim scan hits, `exact_match=true` and no defects.
Passed: Layer 6 apply proof recorded no production impact, no traffic shift and unchanged airline baseline counts before/after the product binding job.

## Rollout Plan

No shared product/runtime rollout. Continue lab-only execution in the existing branch and release evidence trail. Layers 1 through 6 have been applied through private operator jobs and independently verified inside isolated/private-lab substrates.
Layer 3 remains limited to the isolated PHS canonical-promotion substrate and operator jobs. Layer 4 remains isolated typed projection output. Layer 5 remains a private internal Cube canary with no shared Cube traffic shift. Layer 6 remains product-binding proof and governed planning-grade artifact generation only; no tenant activation is authorized by this record.
The six governed demo artifacts are generated only after deterministic findings and Cube reconciliation pass and are not treated as approved recommendations.
The approved target remains schema `foundation_v2_phs_demo`, tenant `phs_health_demo_global`, namespace `phs-healthcare-demo-source-volume-v1`, writer role `foundation_v2_phs_demo_writer`, reader role `foundation_v2_phs_demo_reader` and source release `phs-health-source-v1-202608:source-volume-v1:447910ac3c16`.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable for shared runtime. Layer 1/2 lab jobs used isolated PHS lab image digest `acrabarvalab001.azurecr.io/abarva/phs-healthcare-demo-lab@sha256:81a2abb534066a3683e8609887842aba0983ed9e3b2bfc4e32b7795b27cc2fdf`. Layer 3 optimized lab jobs used isolated PHS lab image digest `acrabarvalab001.azurecr.io/abarva/phs-healthcare-demo-lab@sha256:977d51d005c650af1550f3ef27cdf2dac7b3b032c2cc458cce452831331bf268`. Later Layer 6 repair/proof jobs used private operator image digest `acrabarvalab001.azurecr.io/abarva/phs-healthcare-demo-lab@sha256:6185fdf0fe5252803364b4852bc6fd9b7706c23704c8c0e235295d51b57c50b3`.
Private Cube canary image: `acrabarvalab001.azurecr.io/abarva/phs-cube-canary@sha256:f0503de6a14a7fe012323acdbb011aee0e6c2d2b016f2f37861cd1515570c103`.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: future product-route proof only, after explicit approval. This record does not shift shared web traffic.

## Rollback Plan

Revert the generator, validator, fixtures, migrations, scripts, Cube canary files, docs and npm scripts. Generated Downloads artifacts are local audit outputs. Private-lab data rollback requires an approved tenant-scoped operator action against only the isolated PHS schemas and canary resources; do not run shared-runtime rollback for this record because no shared runtime traffic was changed.

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
Layer 3 local self-test proof path: `/tmp/phs-layer3-self-test/proof/PHS_CANONICAL_PROMOTION_SELF_TEST.json`.
Layer 3 verified ACA readback counts: 54,967 promotion decisions; 794 canonical master entities; 47,941 transactional observations; 2,390 relationships; 16,000 evidence records; 4,370 event-native records; `exact_match=true`; no defects.
Layer 3 ACA proof paths: `/Users/anand/Downloads/phs-healthcare-demo-layer3-aca-20260806T113500Z/01-layer3-schema-apply/proof/PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_PROOF.json`, `/Users/anand/Downloads/phs-healthcare-demo-layer3-aca-20260806T113500Z/04-layer3-preflight-after-stopped-apply/proof/PHS_CANONICAL_PROMOTION.json`, `/Users/anand/Downloads/phs-healthcare-demo-layer3-aca-20260806T113500Z/05-layer3-apply-optimized/proof/PHS_CANONICAL_PROMOTION.json`, `/Users/anand/Downloads/phs-healthcare-demo-layer3-aca-20260806T113500Z/06-layer3-verify/proof/PHS_CANONICAL_PROMOTION.json`.
Layer 3 ACA proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Layer3_ACA_Proof_20260806T122300Z.zip`.
Layer 3 ACA proof ZIP SHA-256: `83934b64a809b153ccc52e25812d4c0c84d6561c08bc8d801cfd760637bee47f`.
Source-to-Layer 3 reconciliation packet: `/Users/anand/Downloads/PHS_Healthcare_Demo_Source_Reconciliation_20260806T123700Z.zip`.
Source-to-Layer 3 reconciliation packet SHA-256: `67f9fc4df82f56c4cf7affbb3d638e3bb00bda0ddd8f67cb52117e88489c39e0`.
Layer 3 initiative repair proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Layer3_Initiative_Repair_ACA_Proof_20260806T131100Z.zip`.
Layer 3 initiative repair proof ZIP SHA-256: `c06a4443d11fab013c74ec6c81e4b01004f9915f9744f4c93f4e2e3eed34b623`.
Layer 4 verified ACA readback counts: 18 typed projection authorities; 3,193 projection rows; 3,193 field-lineage rows; 1 immutable event-context snapshot; 0 direct generic-observation product rows; `exact_match=true`; no defects.
Layer 4 proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Layer4_ACA_Proof_20260806T141800Z.zip`.
Layer 4 proof ZIP SHA-256: `4b6316cdef719ee8f1d49622b375f4d5d1a0d73e00e752aefa2dafac18b352e9`.
Layer 5 private Cube canary proof: `/Users/anand/Downloads/phs-healthcare-demo-layer5-aca-20260806T144312Z/10-cube-private-canary-short-aliases/PHS_CUBE_CANARY_RUNTIME_VERIFY.json`.
Layer 5 proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Layer5_Private_Cube_Canary_Proof_20260806T155316Z.zip`.
Layer 5 proof ZIP SHA-256: `326ebc97da7ae595d751afb4a68133d84b0f1fcb86f97ef3b086d884c30b592f`.
Layer 6 apply proof: `/Users/anand/Downloads/phs-healthcare-demo-layer6-aca-20260806T1606Z/25-layer6-apply-claim-scan-fixed/proof/proof/PHS_LAYER6_PRODUCT_BINDINGS.json`.
Layer 6 verify proof: `/Users/anand/Downloads/phs-healthcare-demo-layer6-aca-20260806T1606Z/26-layer6-verify-final/proof/proof/PHS_LAYER6_PRODUCT_BINDINGS.json`.
Layer 6 proof ZIP: `/Users/anand/Downloads/PHS_Healthcare_Demo_Layer6_Product_Bindings_Proof_20260806T184500Z.zip`.
Layer 6 proof ZIP SHA-256: `cf493c42313484886b3eae9e9b0e40e659414d7c54ab2f2bbf2485d16ea99c22`.
Governed narrative acceptance now requires side-by-side audit from narrative claim to packet fact/finding to source record to evidence span to Cube measure where applicable; document rendering alone is not acceptable proof.
Before correction, the package could pass with placeholder canary statements and weaker lineage/substance checks. After correction, the emitted validation report proves resolved question coverage, substantive outcome-map rows across required portfolios, semantic predicate checks, evidence/source joins, planted source join keys, evidence subject relevance and real injected negative canaries.

## Known Gaps

The synthetic healthcare tenant is not active in canonical tenant code. Isolated PHS Layers 1 through 6 have been applied and verified in private lab substrates, but no shared canonical publication, shared Cube traffic shift, web deployment, signed-in product-route proof or tenant activation has occurred.
