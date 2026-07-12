# Candidate Module Readiness Preview

Status: implementation baseline for module readiness inspection.

Candidate module readiness preview extends candidate module preview from Home
and Intelligence into a five-module readiness matrix for:

- Home
- Intelligence
- Moves
- Source
- Tower

It answers a simple operator question: if this inactive candidate tenant data
version were reviewed today, which modules have enough candidate context to
preview, which have module-specific preview packets, and what still blocks
active runtime consumption?

## Boundary

The readiness preview reads:

- candidate tenant data version metadata
- module-readiness proof
- Home/Intelligence candidate preview summary
- module-targeted derived-plan stage, when generated
- module-targeted graph-plan stage, when generated
- Moves/Source/Tower workbench preview summary, when generated
- candidate promotion-gate result
- all-tenant eligibility matrix

It does not:

- write production tenant data
- update the Active Tenant Access Layer
- promote a candidate
- change module runtime routes
- let modules read candidate data by default

## Output Contract

`npm run audit:candidate-module-readiness-preview` writes:

- `reports/candidate-module-readiness-previews/skyharbor/module-readiness-preview.json`
- `reports/candidate-module-readiness-previews/skyharbor/module-readiness-preview-matrix.csv`
- `reports/candidate-module-readiness-previews/skyharbor/readiness-summary.json`
- `reports/candidate-module-readiness-previews/skyharbor/readiness-summary.md`

## Readiness States

| State                               | Meaning                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `preview_packet_available`          | A module-specific preview packet exists. In PR12 this applies to Home and Intelligence through PR11 artifacts. |
| `candidate_context_available`       | Candidate evidence/fact/derived context exists, but no module-specific preview packet exists yet.              |
| `blocked_missing_derived_plan`      | Evidence and facts exist, but the module lacks a derived intelligence plan.                                    |
| `blocked_missing_candidate_context` | Candidate context is insufficient for a module preview.                                                        |

Runtime readiness remains false for every module until a future promotion path
explicitly updates active tenant access and signed-in module consumption is
proven.

## Truth Split

This is a report/proof capability. It is not active module consumption, not
candidate promotion, and not a production data write path.
