# Candidate Module Graph Plan

Status: implementation baseline for read-only candidate module graph plans.

Candidate module graph plan fills the gap between module-targeted derived plans
and module workbench previews. It creates report-only graph objects for:

- Moves
- Source
- Tower

The graph plan answers a narrow operator question: can this inactive candidate
tenant data version explain which candidate facts, evidence, and derived objects
would support each workbench before any active promotion?

## Boundary

The graph-plan command reads:

- candidate tenant data version metadata
- module-readiness proof
- module-targeted derived-plan stage
- canonical candidate source records

It does not:

- write production tenant data
- write graph tables
- update the Active Tenant Access Layer
- promote a candidate
- change module runtime routes
- let modules read candidate data by default

## Output Contract

`npm run audit:candidate-module-graph-plan` writes:

- `reports/candidate-module-graph-plans/skyharbor/module-graph-plan-stage.json`
- `reports/candidate-module-graph-plans/skyharbor/candidate-module-graph-plan-proof.json`
- `reports/candidate-module-graph-plans/skyharbor/summary.json`
- `reports/candidate-module-graph-plans/skyharbor/README.md`

## Module Meaning

Moves graph plan links the Moves workbench to candidate phase/execution facts,
evidence, and the module-derived plan.

Source graph plan links the Source workbench to candidate vendor, contract,
artifact, commercial evidence, and the module-derived plan.

Tower graph plan links the Tower workbench to candidate value signals, evidence,
and the module-derived outcome plan. It does not claim realized value or ROI.

## Truth Split

This is a report/proof capability. It is not active module consumption, not
candidate promotion, not graph table persistence, and not a replacement for
signed-in module proof after a future approved promotion.
