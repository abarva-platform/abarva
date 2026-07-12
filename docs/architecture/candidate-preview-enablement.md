# Candidate Preview Enablement

Status: implementation baseline for one-tenant explicit preview enablement.

PR22 exercises the SkyHarbor candidate preview path for an explicit
operator/session request. It is a controlled preview, not active promotion.

## Boundary

This release adds a read-only preview enablement layer for the existing
SkyHarbor candidate package. The default runtime source remains the Active
Tenant Access Layer. Modules do not read candidate data by default.

## Explicit Request

Preview inspection requires:

- operator id
- tenant key: `skyharbor-air`
- candidate version id:
  `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
- module: `home`, `intelligence`, `moves`, `source`, or `tower`
- preview flag: `enabled`
- preview reason
- acknowledgement that the candidate is not active runtime truth

Missing flag or missing acknowledgement must reject the request.

## Required Banner

Every accepted preview response must show:

> Candidate Preview Mode - inactive candidate data. Not active tenant truth.

## Outputs

`npm run audit:candidate-preview-enablement` writes:

- `reports/candidate-preview-enablement/skyharbor/candidate-preview-enablement.json`
- `reports/candidate-preview-enablement/skyharbor/candidate-preview-enablement.md`
- `reports/candidate-preview-enablement/skyharbor/candidate-preview-enablement.html`
- `reports/candidate-preview-enablement/skyharbor/module-inspection-matrix.csv`
- `reports/candidate-preview-enablement/skyharbor/api-request-example.json`

## Guardrails

The proof must preserve:

- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `productionTenantDataWritten: false`
- `moduleRuntimeConsumptionChanged: false`
- `moduleReadsCandidateByDefault: false`
- `previewModeRequiresExplicitFlag: true`
- `previewBannerRequired: true`
- `rollbackRequired: true`
- `promotionEnabled: false`
- `realizedValueClaimed: false`

## Truth Split

This release proves candidate preview can be explicitly exercised. It does not
prove active promotion, active runtime module consumption, production tenant data
mutation, rollback execution, or realized value.
