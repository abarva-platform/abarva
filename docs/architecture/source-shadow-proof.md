# Source Shadow Proof

Status: implementation baseline for the first end-to-end module shadow proof.

Source is the first module pressure test for the candidate data runway because
it exercises vendor evidence, commercial terms, pricing, SLA obligations,
change-order leakage, proposed value commitments, Module Memory, and Tower
handoff without requiring active promotion.

## Flow

The Source shadow proof reads inactive SkyHarbor candidate context:

- candidate tenant data version metadata
- canonical ingestion records
- target writer dry-run plan
- module readiness proof
- Source workbench preview packet
- module derived plan
- module graph plan
- candidate promotion gate result
- Source event artifacts referenced by candidate evidence

It produces report-only artifacts:

- `reports/source-shadow-proof/skyharbor/source-shadow-proof.json`
- `reports/source-shadow-proof/skyharbor/source-shadow-proof-summary.md`
- `reports/source-shadow-proof/skyharbor/source-decision-brief.html`
- `reports/source-shadow-proof/skyharbor/tower-handoff-preview.json`
- `reports/source-shadow-proof/skyharbor/module-memory-preview.json`
- `reports/source-shadow-proof/skyharbor/evidence-trace.json`

## What It Proves

The proof answers whether inactive candidate evidence is strong enough to run a
Source workflow simulation. It classifies evidence readiness, extracts
vendor/commercial facts, identifies leverage findings, proposes Source actions,
previews Module Memory records, and creates a Tower handoff preview.

Every claim must trace to one of:

- canonical record
- evidence reference
- module workbench preview fact
- derived insight
- graph relationship
- explicit assumption

Claims without evidence must be omitted from the executive brief or labeled as
assumptions.

## Guardrails

The proof must preserve:

- `sourceRuntimeChanged: false`
- `productionTenantDataWritten: false`
- `physicalSourceTablesWritten: false`
- `physicalOutcomeLedgerTablesWritten: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `candidateReadByDefault: false`
- `realizedValueClaimed: false`
- `shadowProofOnly: true`

## Module Memory Preview

The proof previews Module Memory records only. Records remain `proposed`,
`promotionEligible: false`, human-approval required, and evidence-linked where
possible. Nothing is written to runtime memory or module stores.

## Outcome Ledger / Tower Handoff Preview

The Tower handoff is limited to potential value and proposed commitment. It may
name candidate evidence such as invoice variance, recurring change-order
exposure, SLA remedy review, and staffing underfill. It must not claim measured
value, realized value, or attested realized value.

## Before Live Source Consumption

Live Source runtime consumption requires a future approved path that:

- explicitly selects or promotes a candidate through an operator gate
- updates active access only through a reversible promotion mechanism
- proves Source reads the promoted active slice in signed-in runtime
- writes Module Memory and Outcome Ledger records only after approval
- preserves evidence trace and value-state labels in the live UI
