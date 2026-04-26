# AZLAB2 — Control Plane / Data Plane Boundary Contract

## ID
AZLAB2

## Goal
Define the formal boundary contract between the AbarVa control plane and the data plane. The boundary governs what data types may cross in either direction, under what crossing policy, and what audit obligations apply. This contract enforces that raw data never leaves the data plane, evidence travels only as metadata/summaries, and every boundary crossing with audit obligations produces a durable audit event.

## Status
code_complete

## Date
2026-04-26

## Category
architecture

## Files

### Source
- `src/lib/architecture/control-data-plane-boundary.ts`

### Tests
- `src/__tests__/integration/architecture/control-data-plane-boundary.test.ts`

## Key Contracts

### BoundaryRule
Governs one category of data crossing in one direction. At least 6 rules cover:
1. **raw_dataset_content** (data_to_control) — `blocked`; rawDataBlocked: true
2. **evidence_manifest** (data_to_control) — `allowed_with_audit`; rawDataBlocked: true
3. **artifact_metadata** (data_to_control) — `allowed_metadata_only`; rawDataBlocked: true
4. **audit_event_stream** (data_to_control) — `allowed_with_audit`; rawDataBlocked: true
5. **model_routing_policy** (control_to_data) — `allowed_with_audit`
6. **user_pii** (data_to_control) — `blocked`; rawDataBlocked: true

### EvidenceRequest
- `includesRawData: false` — structural literal type, never overridable
- `includesMetadataOnly: true` — structural literal type
- `auditEventRequired: true` — structural literal type

### EvidenceResponse
- `containsRawData: false` — structural literal type, boundary enforcement

### ModelGatewayPolicyExchange
- `containsModelWeights: false` — structural literal type
- `containsApiKeys: false` — structural literal type

### FailureModes (at least 3)
1. `degrade_gracefully` — data plane unreachable: use cached evidence summaries
2. `block_request` — crossing policy is blocked: reject immediately, no partial leak
3. `use_cached` — stale manifest: use last-known-good, queue refresh
4. `surface_error` — audit write fails: block the crossing, never silently permit

### ControlDataPlaneBoundaryContract
- `deterministicOnly: true` — no runtime calls
- `noNetworkCalls: true` — no fetch/http/axios
- `generatedAt: '2026-04-26'`

## Constraints
- No provider SDK imports
- No fetch, http, axios
- No Date.now, Math.random, new Date(
- No agent / source / sentinel / atlas / nexus / auth / supabase imports
- No UI components
- No 'use client'
- Pure TypeScript types and deterministic factory functions only
