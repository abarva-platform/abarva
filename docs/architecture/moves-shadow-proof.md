# Moves Shadow Proof

Status: implementation baseline for the first end-to-end Moves module shadow
proof.

Moves is the second module pressure test for the candidate data runway. It
exercises phase readiness, gate criteria, generated deliverable previews,
Module Memory previews, and Tower handoff preview without advancing a live Move.

## Flow

The Moves shadow proof reads inactive SkyHarbor candidate context:

- candidate tenant data version metadata
- canonical ingestion records
- module readiness proof
- Moves workbench preview packet
- candidate promotion gate result
- SkyHarbor Moves current-state findings
- SkyHarbor Moves golden-question scorecard

It produces report-only artifacts:

- `reports/moves-shadow-proof/skyharbor/moves-shadow-proof.json`
- `reports/moves-shadow-proof/skyharbor/moves-shadow-proof-summary.md`
- `reports/moves-shadow-proof/skyharbor/moves-execution-brief.html`
- `reports/moves-shadow-proof/skyharbor/phase-readiness-matrix.csv`
- `reports/moves-shadow-proof/skyharbor/module-memory-preview.json`
- `reports/moves-shadow-proof/skyharbor/tower-handoff-preview.json`
- `reports/moves-shadow-proof/skyharbor/evidence-trace.json`

## What It Proves

The proof answers whether inactive candidate evidence can support a governed
Moves P0 through P5 simulation. It classifies phase readiness, creates gate
assessment drafts, lists automatically generated phase artifacts, previews
Module Memory records, and prepares a Tower handoff preview.

Every generated claim must trace to one of:

- canonical record
- evidence reference
- Moves workbench preview fact
- graph relationship
- derived insight
- current-state finding
- golden-question guardrail

Claims without support must stay out of the generated artifacts or be treated as
assumptions.

## Guardrails

The proof must preserve:

- `shadowProofOnly: true`
- `dryRunOnly: true`
- `productionTenantDataWritten: false`
- `physicalMovesTablesWritten: false`
- `physicalOutcomeLedgerTablesWritten: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `movesRuntimeRoutesChanged: false`
- `liveMoveAdvanced: false`
- `gateApprovalAutoExecuted: false`
- `candidateReadByDefault: false`
- `realizedValueClaimed: false`
- `operatorApprovalRequired: true`

## Gate Generation Boundary

The proof may auto-generate gate inputs for each phase:

- readiness packet
- evidence trace
- gate criteria draft
- next-proof checklist

It must not auto-approve a gate. Human approval, active candidate promotion, and
signed-in runtime proof remain separate future requirements.

## Module Memory Preview

The proof previews Module Memory records only. Records remain `proposed`,
`promotionEligible: false`, human-approval required, and evidence-linked.
Nothing is written to runtime memory or module stores.

## Tower Handoff Preview

The Tower handoff is limited to preview-only themes and required proof before
commitment. It must not claim measured value, realized value, ROI, disruption
savings, or operational lift.

## Before Live Moves Consumption

Live Moves runtime consumption requires a future approved path that:

- explicitly promotes a candidate through an operator gate
- updates active access through a reversible promotion mechanism
- proves Moves reads the promoted active slice in signed-in runtime
- keeps each phase gate human-approved
- writes Module Memory and Outcome Ledger records only after approval
