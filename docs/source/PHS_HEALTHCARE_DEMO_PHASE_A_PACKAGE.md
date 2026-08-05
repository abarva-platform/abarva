# Synthetic Healthcare Demo Phase A Package

Status: candidate, audit_only, not_released

This document describes the reusable Phase A generator and validator for the synthetic healthcare demo package. The generator produces the full intake workbook, source-system-shaped extracts, evidence corpus, interview packs, sourcing event package, question bank, coverage matrix, model-fit audit, reconciliation expectations, future Phase B test-load plan, future Phase C one-click migration specification and proof bundle into `/Users/anand/Downloads`.

## Layer Posture

- Layer 1 client intake: the generated workbook and source-system-shaped extracts are organized by source owner and native export shape.
- Layer 2 adapters: not executed in Phase A.
- Layer 3 canonical model: represented only as model-fit audit recommendations; no migration is created.
- Layer 4 products: not touched; Source, Tower, Home, Intelligence, Moves and aVa are Phase B proof targets only.

## Commands

```bash
npm run source:phs-healthcare-demo:build
node scripts/source/validate-phs-healthcare-demo-package.mjs --package-dir /Users/anand/Downloads/phs_healthcare_demo_phase_a_<timestamp>
```

The scripts are dependency-free Node modules. ZIPs are created through the local `zip` executable, and `.xlsx` workbooks are emitted as standard Office Open XML.

## Audit Boundary

The generated manifest keeps `activation_state=generated_not_loaded`. The package must not be loaded, migrated, deployed, activated or used as live tenant truth until Phase A audit is explicitly approved.

The offline validator now treats the audit blockers as hard package failures: weak outcome-map substance, unresolved outcome dependencies, placeholder hard questions, broken question-to-source coverage, missing semantic predicates, wrong-but-existing evidence, incomplete workbook usability metadata, inappropriate field/source guidance and fake canary evidence all fail validation.

## Enterprise Outcomes And KPI Map

The master collection workbook contains exactly one `ENTERPRISE_OUTCOMES_AND_KPI_MAP` tab for four-week lightweight discovery. The generator does not create separate enterprise value-driver, business-unit KPI catalog or KPI dependency-tree workbooks in this phase. Values, targets, formulas and detailed source lineage are optional; each row still declares purpose, owner roles, desired direction, decision use, connected systems/vendors/initiatives, evidence source and confidence state.

## Generated Counts From Latest Local Run

- Structured rows: 70,485
- Evidence spans: 16,000
- Vendors: 10
- Existing contract families: 6
- Legal instruments: 24
- Applications/services/platforms/CIs: 400
- Contract-scope relationships: 720
- Hard questions: 180
- Interview roles: 30
- Enterprise outcomes/KPI map records: 44
- CDAO questions: 71

Latest corrected proof bundle: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T170559Z.zip`
Latest corrected proof SHA-256: `e0d92407792070d0162cd6668bd9d73041302803c324dda2b1ed3d8f6446d475`
Latest proof SHA-256 attestation: `/Users/anand/Downloads/PHS_Healthcare_Demo_Audit_Proof_20260805T170559Z.zip.sha256`

Latest semantic readback: 180/180 questions have aligned planted source records, 180/180 have aligned evidence refs and 180/180 have both source and evidence aligned. The field/source map contains 608 rows, with zero missing generated native fields and one explicit `client_native_field_to_confirm` marker.

## Public Repository Discipline

The bulk generated package is not committed. Public release prose should describe this as a synthetic healthcare demo package and avoid client-confidential narrative detail. The generated package itself remains an audit artifact in Downloads.
