# Tenant Candidate Version Generator

Status: PR10 implementation contract.

The tenant candidate version generator is the first executable bridge from an
existing tenant inventory into inactive candidate tenant data version metadata.
It is tenant-parameterized: SkyHarbor is the first full proof target, but the
same command also inventories other tenants and reports their readiness blockers.

## Purpose

The generator proves this non-destructive path:

Tenant source packs
-> compatibility adapter
-> Tenant Packet projection
-> Canonical Ingestion Records
-> Target Writer dry-run plan
-> graph plan
-> derived intelligence plan
-> module readiness proof
-> candidate tenant data version metadata
-> candidate promotion gate result

The output is proof metadata only. It is not active tenant truth.

## Guardrails

Every PR10 output must keep these controls:

- `dryRunOnly: true`
- `writesPhysicalTables: false`
- `activeTenantAccessLayerUpdated: false`
- `moduleRuntimeConsumptionChanged: false`
- `candidatePromoted: false`
- modules do not read candidate data by default
- all-tenant execution produces inventory only, not active promotion

## Commands

```bash
npm run audit:tenant-candidate-version -- --tenant skyharbor-air
npm run audit:skyharbor-candidate-version
npm run audit:tenant-candidate-version -- --tenant all
```

`audit:skyharbor-candidate-version` runs the full SkyHarbor candidate proof.
`--tenant all` writes the all-tenant eligibility matrix and does not create or
promote candidates.

## Output

SkyHarbor full proof:

- `reports/tenant-candidate-generation/skyharbor/skyharbor-candidate-summary.json`
- `reports/tenant-candidate-generation/skyharbor/module-readiness-summary.json`
- `reports/tenant-candidate-generation/skyharbor/stranded-intelligence-delta.json`
- `reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json`
- `reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json`

All-tenant inventory:

- `reports/tenant-candidate-generation/all-tenant-eligibility-matrix.json`
- `reports/tenant-candidate-generation/all-tenant-eligibility-matrix.csv`
- `reports/tenant-candidate-generation/all-tenant-eligibility-matrix.md`

The eligibility matrix records tenant, source packs found, Source data found,
Moves data found, Tower data found, required mappings available, candidate
generation status, and blockers.

## Truth Split

PR10 proves candidate metadata persistence for SkyHarbor only. It does not:

- write production tenant data,
- update the Active Tenant Access Layer,
- promote a candidate,
- change module runtime reads,
- migrate all tenants.

Other tenants are inventoried so the next compatibility adapters can be scoped
from real readiness gaps rather than assumptions.
