# Candidate Readiness Control

Status: implementation baseline for the candidate readiness executive control
panel.

The candidate readiness control panel consolidates the non-destructive candidate
runway into one operator artifact. It answers a single question:

Is this candidate preview-ready, and what exactly still blocks active runtime
promotion?

## Flow

The control panel reads existing proof artifacts:

- candidate tenant data version metadata
- candidate promotion gate result
- module readiness preview
- module workbench preview packets
- module derived plan
- module graph plan
- Source shadow proof
- Moves shadow proof
- all-tenant candidate batch context

It writes report-only artifacts:

- `reports/candidate-readiness-control/skyharbor/candidate-readiness-control.json`
- `reports/candidate-readiness-control/skyharbor/candidate-readiness-control.md`
- `reports/candidate-readiness-control/skyharbor/candidate-readiness-control.html`
- `reports/candidate-readiness-control/skyharbor/module-control-matrix.csv`

## Truth Split

The control panel may mark a candidate as preview-ready. It must not mark the
candidate as active-runtime-ready.

The required state is:

- candidate version exists
- promotion gate exists
- module preview packets exist
- module readiness matrix exists
- module derived plans exist
- module graph plans exist
- Source shadow proof exists
- Moves shadow proof exists
- runtime-ready remains `false`
- active access remains unchanged
- promotion remains disabled
- exact criteria before active promotion are listed

## Guardrails

The proof must preserve:

- `dryRunOnly: true`
- `readOnlyControlPanel: true`
- `productionTenantDataWritten: false`
- `writesPhysicalTables: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `candidateReadByDefault: false`
- `runtimeReady: false`
- `promotionEnabled: false`
- `operatorApprovalRequired: true`
- `realizedValueClaimed: false`

## Before Active Promotion

The panel lists criteria that a future operator promotion workflow must satisfy,
including operator approval, rollback acceptance, explicit promotion enablement,
active access update proof, signed-in module proof, and separate approval for
any Module Memory or Outcome Ledger writes.

## Boundary

This is an audit/report control surface. It does not create an application
preview mode, change runtime routes, mutate tenant data, promote a candidate, or
make modules read candidate data by default.
