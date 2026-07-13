# Admin Data Control Center

## Purpose

Admin is the control surface for tenant data-state transitions. It must show
where files are in the enterprise data runway and prevent upload activity from
being confused with promoted module-ready truth.

## ADMIN-PR1 Boundary

ADMIN-PR1 adds a read-only setup-control contract and labels legacy direct import
paths. It does not redesign the full Admin UI and it does not promote tenant
data.

The setup-control runway is:

1. Tenant packet
2. Manifest validation
3. Source adapter parsing
4. Canonical ingestion
5. Target writer dry-run
6. Candidate tenant data version
7. Proof bundle
8. Module readiness
9. Candidate preview
10. Promotion gate
11. Explicit operator promotion
12. Active Tenant Access Layer

## State Separation

- Uploaded file is not loaded context.
- Parsed rows are not canonical facts.
- Candidate facts are not active facts.
- Indexed chunks are not cite-render proof.
- Module readiness is not global readiness.
- Files must not make Home, Intelligence, Moves, Source, or Tower green by
  themselves.

## Setup-Control API

`GET /api/admin/setup-control` returns the current tenant setup-control view:

- tenant identity
- active tenant access status
- candidate tenant data version status
- upload state
- evidence registry counts
- canonical fact counts
- relationship graph counts
- derived intelligence counts
- module readiness
- promotion control
- guardrails
- legacy import path labels
- source-of-truth caveats

The route is read-only. It may read current setup inventory and source document
inventory, but it must not mutate tenant records, promote candidates, or change
module runtime behavior.

## Legacy Controlled Imports

The following paths can still touch current context or activation state and
therefore must be labeled until the candidate-version runway replaces them:

- `/api/admin/context-layer/csv-upload`
- `/api/admin/context-layer/bulk-upload?mode=stage_and_process`
- `/api/admin/context-layer/loader/commit?mode=stage_and_process`
- `/api/admin/context-layer/triage/[id]`

They return:

```json
{
  "legacyControlledImport": true,
  "directActiveMutationPossible": true,
  "candidateRunwayBypassed": true,
  "warning": "Legacy controlled import - not candidate-version promoted."
}
```

Review-only or validation-only paths may keep the label while setting
`directActiveMutationPossible` and `candidateRunwayBypassed` to `false`.

## Required Guardrails

The setup-control contract defaults to safe values:

- `productionTenantDataWritten: false`
- `activeTenantAccessLayerUpdated: false`
- `candidatePromoted: false`
- `moduleRuntimeConsumptionChanged: false`
- `candidateReadByDefault: false`
- `directActivePromotionBlocked: true`

These values describe the setup-control read mode. They must not be used to
claim live DB proof unless a signed-in proof run and data-layer verification
actually prove it.

## ADMIN-PR2 Overview

ADMIN-PR2 redesigns the Admin overview using setup-control as the read source.
The first screen is now the Tenant Setup and Data Control Center:

- evidence files are visible but not treated as active facts
- candidate version state is visible but not created by the overview
- Active Tenant Access Layer state is shown separately
- module readiness is shown separately for Home, Intelligence, Moves, Source,
  and Tower
- blockers and guardrails are visible before any operator proceeds

ADMIN-PR2 remains read-only. Candidate creation, promotion, and module cutover
belong to later PRs.
