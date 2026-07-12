# Operator Promotion Workflow

Status: implementation baseline for the disabled operator promotion workflow.

The operator promotion workflow defines the future human-controlled path from a
candidate preview to active tenant data version promotion. This release defines
the workflow only. It does not execute promotion.

## Inputs

The workflow reads:

- candidate preview-mode proof
- candidate promotion gate result

## Outputs

`npm run audit:operator-promotion-workflow` writes:

- `reports/operator-promotion-workflow/skyharbor/operator-promotion-workflow.json`
- `reports/operator-promotion-workflow/skyharbor/operator-promotion-workflow.md`
- `reports/operator-promotion-workflow/skyharbor/operator-promotion-workflow.html`
- `reports/operator-promotion-workflow/skyharbor/approval-checklist.csv`
- `reports/operator-promotion-workflow/skyharbor/rollback-plan.json`

## Guardrails

The proof must preserve:

- `workflowDefinedOnly: true`
- `promotionExecutionEnabled: false`
- `operatorApprovalCaptured: false`
- `productionTenantDataWritten: false`
- `writesPhysicalTables: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `moduleDefaultReadsCandidateData: false`
- `runtimeRoutesChanged: false`
- `rollbackExecuted: false`
- `realizedValueClaimed: false`

## Required Operator Controls

A future promotion execution path must include:

- named operator approval
- candidate scope acknowledgement
- acknowledgement that candidate context is not active runtime truth until
  promotion executes
- rollback plan acceptance
- prior active version capture
- signed-in post-promotion proof
- rollback evidence bundle

## Boundary

This workflow does not write production data, promote the candidate, update the
Active Tenant Access Layer, change module runtime behavior, execute rollback, or
claim realized value.
