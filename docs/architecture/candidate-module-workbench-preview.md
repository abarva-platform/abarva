# Candidate Module Workbench Preview

Status: implementation baseline for read-only module workbench packets.

Candidate module workbench preview extends the inactive candidate proof runway
from Home/Intelligence preview packets into read-only packets for:

- Moves
- Source
- Tower

It answers a narrow operator question: before a candidate tenant data version is
eligible for active promotion, what would each workbench see, what evidence
supports that preview, and what still blocks runtime consumption?

## Boundary

The workbench preview reads:

- candidate tenant data version metadata
- module-readiness proof
- module-readiness preview
- module-targeted derived-plan stage
- canonical candidate source records

It does not:

- write production tenant data
- update the Active Tenant Access Layer
- promote a candidate
- change module runtime routes
- let modules read candidate data by default
- claim Tower realized value or ROI

## Output Contract

`npm run audit:candidate-module-workbench-preview` writes:

- `reports/candidate-module-workbench-previews/skyharbor/moves-workbench-preview.json`
- `reports/candidate-module-workbench-previews/skyharbor/source-workbench-preview.json`
- `reports/candidate-module-workbench-previews/skyharbor/tower-workbench-preview.json`
- `reports/candidate-module-workbench-previews/skyharbor/candidate-module-workbench-preview-proof.json`
- `reports/candidate-module-workbench-previews/skyharbor/preview-summary.json`
- `reports/candidate-module-workbench-previews/skyharbor/README.md`

## Module Meaning

Moves preview shows candidate phase-workspace inputs, Move findings, operational
systems, and required phase/gate proof.

Source preview shows candidate sourcing inputs, vendor/system candidates,
Source artifacts, commercial evidence, and derived-plan blockers.

Tower preview shows candidate value-signal inputs, outcome-ledger readiness
needs, and the blockers that prevent any realized-value or ROI claim.

## Truth Split

This is a report/proof capability. It is not active module consumption, not
candidate promotion, not a production data write path, and not a replacement for
signed-in module proof after promotion.
