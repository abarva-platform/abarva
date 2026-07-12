# Candidate Preview Mode

Status: implementation baseline for the explicit candidate preview-mode
contract.

Candidate preview mode defines how a future operator may inspect candidate
context without promoting the candidate or changing active runtime truth.

## Boundary

This PR defines the contract and proof artifacts only. It does not add a product
route, alter module reads, update active access, promote a candidate, or write
production tenant data.

## Contract

Preview mode requires all of the following:

- explicit flag: `ABARVA_CANDIDATE_PREVIEW_MODE`
- default value: `disabled`
- explicit candidate version selection
- explicit module selection
- operator acknowledgement that candidate context is not active runtime truth
- read-only packet inspection only

The default runtime source remains the Active Tenant Access Layer. Candidate
context can be inspected only through explicit preview selection in a future
runtime implementation.

## Outputs

`npm run audit:candidate-preview-mode` writes:

- `reports/candidate-preview-mode/skyharbor/candidate-preview-mode.json`
- `reports/candidate-preview-mode/skyharbor/candidate-preview-mode.md`
- `reports/candidate-preview-mode/skyharbor/candidate-preview-mode.html`
- `reports/candidate-preview-mode/skyharbor/module-preview-selection-matrix.csv`

## Guardrails

The proof must preserve:

- `defaultEnabled: false`
- `explicitFlagRequired: true`
- `explicitCandidateSelectionRequired: true`
- `productionTenantDataWritten: false`
- `writesPhysicalTables: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `moduleDefaultReadsCandidateData: false`
- `runtimeRoutesChanged: false`
- `promotionEnabled: false`
- `realizedValueClaimed: false`

## Blocked Actions

Preview mode must not allow:

- default module reads from candidate context
- Active Tenant Access Layer pointer update
- candidate promotion
- runtime Module Memory writes
- runtime Outcome Ledger writes
- realized value or ROI claims

## Next Runtime Proof

A future runtime implementation must prove:

- signed-in preview reads require the explicit flag
- every preview surface is clearly labeled as candidate preview
- disabling the flag returns every module to active-only reads
- promotion remains a separate operator workflow
