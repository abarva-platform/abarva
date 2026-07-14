# Scenario 01 - Epic And Integration Baseline

## Uploads

- `17-upload-templates/application-portfolio.csv`
- `17-upload-templates/epic-module-inventory.csv`
- `17-upload-templates/hl7-fhir-integration-topology.json`

## Walkthrough

The operator uploads Meridian's application portfolio, Epic module inventory,
and HL7/FHIR topology. The context layer classifies the files as application
portfolio, EHR platform, and interoperability topology, then maps every row to
system, owner, clinical criticality, data class, and dependency evidence.

## Agent Value

Sentinel can answer which clinical workflows are constrained by Epic module
readiness and which integration edges become blockers for prior authorization,
population health, or revenue-cycle automation.

## Evidence Checks

- Every integration edge references known systems.
- Every Epic module has an owner, workflow risk, and optimization state.
- PHI-bearing interfaces are flagged before agent use.
