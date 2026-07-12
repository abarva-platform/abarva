# All-Tenant Candidate Batch

## Purpose

The all-tenant candidate batch audit tests whether the enterprise data-layer
candidate runway generalizes beyond the SkyHarbor reference tenant. It produces
a tenant-by-tenant eligibility and remediation report without changing active
runtime truth.

The audit answers four questions:

- Which tenants can run through the candidate runway today?
- Which tenants are partially eligible because source evidence exists but
  mappings or packet projection are missing?
- Which tenants are blocked?
- What is the minimum remediation needed before another candidate dry-run?

## Runway Evaluated

The batch report evaluates the same non-destructive path introduced in the
candidate runway:

Tenant Packet -> Source Adapter dry-run -> Canonical Ingestion Records ->
Target Writer dry-run plan -> Candidate Tenant Data Version metadata ->
Promotion Gate -> Module Readiness Preview -> Module Derived Plan -> Module
Graph Plan -> Source Shadow Proof where eligible.

SkyHarbor reuses the existing successful proof bundle. Other tenants are run in
compatibility inventory mode until a Tenant Packet manifest and mapping profile
are available.

## Outputs

The audit command writes:

- `reports/all-tenant-candidate-batch/all-tenant-candidate-batch.json`
- `reports/all-tenant-candidate-batch/all-tenant-candidate-batch-summary.md`
- `reports/all-tenant-candidate-batch/all-tenant-candidate-batch.html`
- `reports/all-tenant-candidate-batch/tenant-remediation-matrix.csv`

Each tenant row includes source pack discovery, stage eligibility, blockers,
missing source classes, missing mappings, unmapped fields, quarantined record
count, stranded intelligence count, recommended remediation, minimum evidence
needed, estimated effort, and next action.

## Non-Destructive Boundary

The batch audit is proof/report work only. It must always preserve:

- `dryRunOnly: true`
- `productionTenantDataWritten: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `writesPhysicalTables: false`
- `moduleRuntimeConsumptionChanged: false`
- `candidateReadByDefault: false`
- `realizedValueClaimed: false`

It does not write production tenant data, update the Active Tenant Access Layer,
promote candidates, write physical tables, change module runtime behavior, make
modules read candidate data by default, or claim realized value.

## Interpretation

`eligible` means candidate/shadow proof-ready, not active-runtime-ready.

`partially_eligible` means source evidence exists and the tenant may be a good
next candidate after packet and mapping remediation.

`blocked` means the tenant cannot safely enter candidate generation until the
listed blockers are remediated.

`not_enough_evidence` means the repository does not currently contain enough
tenant-specific evidence to make a useful candidate dry-run.

## Before Active Promotion

This report is not a promotion signal. Before active promotion, a tenant still
needs explicit operator approval, a promotion gate result, a rollback target, a
signed-in module preview proof, and a separate release decision.
