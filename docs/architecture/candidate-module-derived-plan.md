# Candidate Module Derived Plan

Status: implementation baseline for read-only candidate module derived plans.

Candidate module derived plan fills the gap between generic candidate proof and
module workbench previews. It creates module-targeted derived-plan objects for:

- Moves
- Source
- Tower

The plan answers a narrow operator question: does this inactive candidate tenant
data version have enough evidence-backed candidate context to prepare module
preview packets before any active promotion or runtime consumption?

## Boundary

The derived-plan command reads:

- candidate tenant data version metadata
- module-readiness proof
- canonical candidate source records

It does not:

- write production tenant data
- update the Active Tenant Access Layer
- promote a candidate
- change module runtime routes
- let modules read candidate data by default
- claim Tower realized value or ROI

## Output Contract

`npm run audit:candidate-module-derived-plan` writes:

- `reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json`
- `reports/candidate-module-derived-plans/skyharbor/candidate-module-derived-plan-proof.json`
- `reports/candidate-module-derived-plans/skyharbor/summary.json`
- `reports/candidate-module-derived-plans/skyharbor/README.md`

## Module Meaning

Moves derived plan identifies candidate inputs for phase workspace planning,
gate proof, evidence carry-forward, and deliverable generation proof.

Source derived plan identifies candidate inputs for vendors, contracts,
sourcing artifacts, commercial evidence, and award/workflow proof.

Tower derived plan identifies candidate inputs for value signals, cost evidence,
outcome-ledger planning, leakage controls, and future realized-value proof.

## Truth Split

This is a report/proof capability. It is not active module consumption, not
candidate promotion, not production data persistence, and not a replacement for
signed-in module proof after a future approved promotion.
