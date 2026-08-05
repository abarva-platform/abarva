# 2026-08-05-synthetic-healthcare-demo-phase-a — Synthetic Healthcare Demo Phase A Package

## Release ID

`2026-08-05-synthetic-healthcare-demo-phase-a`

## Status

`candidate`

## Plain-English Summary

Adds a dependency-free audit-only generator and validator for a synthetic healthcare demo package. The reusable repo code emits the large package into Downloads and keeps generated data out of git.
It also uses one lightweight enterprise outcomes/KPI map tab instead of separate value-driver or KPI catalog workbooks.

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
Passed: `node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_20260805T152332Z`.
Passed: `unzip -t /Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T152332Z.zip`.

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

Inspect the local proof ZIP, validation report JSON/HTML, file hashes, canary outputs and hard-stop statement produced by the generator. The latest local proof ZIP is `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T152332Z.zip`.
Proof ZIP SHA-256: `22dfdbd8ab4b6ce1e211a20d191c753d297dc4134df45b6e7db79ea65259fb8e`.
Latest generated counts: 70,485 structured rows; 16,000 evidence spans; 180 hard questions; 30 interview roles; 52 enterprise outcomes/KPI map records; 71 CDAO questions.

## Known Gaps

The synthetic healthcare tenant is not active in canonical tenant code. No database load, migration, Cube update, web deployment, Source/Tower/Home/Intelligence/Moves/aVa proof or tenant activation has occurred.
