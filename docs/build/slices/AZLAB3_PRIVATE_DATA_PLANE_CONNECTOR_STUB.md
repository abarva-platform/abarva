# AZLAB3 — Private Data Plane Connector Stub

## Slice Contract

| Field | Value |
|-------|-------|
| **ID** | AZLAB3 |
| **Name** | Private Data Plane Connector Stub |
| **Category** | architecture |
| **Status** | code_complete |
| **Risk** | low |
| **Created** | 2026-04-26 |

## Goal

Establish the typed stub surface for a customer-owned (private) Azure data plane connector. The stub names the request/response contract that future live Azure Private Endpoint / VNET integration slices must honor, while providing structural guarantees that no real connection is opened, no real credentials are read, and raw client data is blocked at every operation.

## Structural Guarantees

- `config.isRealConnection` is typed as the literal `false` — cannot be overridden to `true`.
- `config.noRealCredentials` is typed as the literal `true` — the stub never reads `process.env`.
- All response types carry `simulatedOnly: true`, `rawContentBlocked: true`, `rawDataBlocked: true`, or `containsRawData: false` so callers cannot present stub responses as live data.
- All responses are deterministic fixture values — no `Math.random`, no `Date.now`, no network I/O.

## Operations Stubbed

| Method | Raw-data guarantee | Simulated field |
|--------|--------------------|-----------------|
| `getPrivateDataPlaneStatus()` | n/a | `isSimulated: true` |
| `requestEvidenceManifest(datasetIds)` | `containsRawData: false` | `simulatedOnly: true` |
| `requestArtifactMetadata(artifactId)` | `rawContentBlocked: true` | `simulatedOnly: true` |
| `requestDatasetSummary(datasetId)` | `rawDataBlocked: true` | `simulatedOnly: true` |
| `requestModelGatewayPolicy()` | n/a | `simulatedOnly: true` |
| `recordBoundaryAuditEvent(eventType)` | n/a — records surface event | `simulatedOnly: true` |

## Files

### Source
- `src/lib/architecture/private-data-plane-connector-stub.ts`

### Tests
- `src/__tests__/integration/architecture/private-data-plane-connector-stub.test.ts`

## Acceptance Criteria

- [x] `config.isRealConnection === false` (structural literal type)
- [x] `config.noRealCredentials === true` (structural literal type)
- [x] `getPrivateDataPlaneStatus()` returns `isSimulated: true`
- [x] `requestEvidenceManifest()` returns `containsRawData: false`
- [x] `requestArtifactMetadata()` returns `rawContentBlocked: true`
- [x] `requestDatasetSummary()` returns `rawDataBlocked: true`
- [x] All methods return `simulatedOnly: true` or structural equivalent
- [x] `recordBoundaryAuditEvent()` returns `recorded: true`
- [x] No network imports in source (pure deterministic)
- [x] Connector created in `dry_run` mode works
- [x] TypeScript compiles without errors (`tsc --noEmit`)
- [x] Jest integration tests pass

## Notes

- Live Azure Private Endpoint wiring is deferred to a future AZLAB slice.
- The `endpointPlaceholder` field documents the future endpoint shape but is never read as a live value.
- This slice does not promote `data_evidence_knowledge_fabric` production-readiness status.
- All stub operations are synchronous and return deterministic fixture responses.
