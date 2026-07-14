# Home Summary Snapshot Proof

Generated: `2026-07-14T03:42:25.039Z`

This proof is read-only. It does not upload files, validate files, create candidates, promote candidates, update Active Tenant Access, write production tenant data, or change module runtime behavior.

## Active Snapshots

| Tenant | Status | Loaded records | Manifest posture | Next data action |
| --- | --- | ---: | --- | --- |
| SkyHarbor Air | ready_with_caveats | 1,970 | Good | Let the Home module decide how to render or use this packet. |
| Lakeshore Holdings | blocked | 0 | Blocked | Promote a reviewed candidate before relying on active module context. |
| Meridian Health System | blocked | 0 | Blocked | Promote a reviewed candidate before relying on active module context. |
| First Capital | blocked | 0 | Blocked | Promote a reviewed candidate before relying on active module context. |
| Apex Retail | blocked | 0 | Blocked | Promote a reviewed candidate before relying on active module context. |

## Candidate Preview

Candidate preview snapshots are generated as explicit inactive preview mode only. They are not active tenant truth and are not read by modules by default.

## Module Context Serving Snapshots

These snapshots are built from `getModuleContext(...)` and `explainModuleContext(...)`.

| Tenant | Source mode | Status | Loaded records | Completeness |
| --- | --- | --- | ---: | --- |
| SkyHarbor Air | active_tenant_access | ready_with_caveats | 1,970 | Good |
| Lakeshore Holdings | active_not_available | blocked | 0 | Blocked |
| Meridian Health System | active_not_available | blocked | 0 | Blocked |
| First Capital | active_not_available | blocked | 0 | Blocked |
| Apex Retail | active_not_available | blocked | 0 | Blocked |

## Excluded

- None

## Guardrails

- deterministicBuilder: true
- callsClaude: false
- productionTenantDataWritten: false
- activeTenantAccessLayerUpdated: false
- candidatePromoted: false
- moduleRuntimeConsumptionChanged: false
- candidateReadByDefault: false
- Northstar processed as active: false
