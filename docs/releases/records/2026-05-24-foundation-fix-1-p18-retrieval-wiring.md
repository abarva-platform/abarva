# 2026-05-24-foundation-fix-1-p18-retrieval-wiring — Apex P18 Retrieval Wiring

## Release ID

`2026-05-24-foundation-fix-1-p18-retrieval-wiring`

## Status

`candidate`

## Plain-English Summary

Sentinel and the Apex Source agent now retrieve the Packet 18 Apex data pack from tenant context chunks instead of falling back to the pre-P18 legacy table shape. Apex answers can cite concrete `APX-` application ids, `INIT-` initiative ids, and `EDGE-` integration dependencies instead of saying current-state records are unavailable.

## Layer Impact

`client-data-lane`: Extends tenant data retrieval to include Apex Packet 18 context chunk segments and the Apex tenant-key alias.

`agent-reasoning-lane`: Updates Sentinel and Source context assembly so the existing reasoning layer receives the richer Apex portfolio, initiative, vendor, and topology evidence.

## Client Applicability

- All clients: no.
- Specific clients: Apex Retail Group.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Diagnosis: `audit-artifacts/foundation-fix-1/DIAGNOSIS.md`
- Retrieval broker: `src/lib/knowledge/agent-context-broker.ts`
- Tenant data adapter/types: `src/lib/knowledge/tenant-data/*`
- Sentinel retrieval and routing: `src/lib/agents/sentinel-reasoning/*`
- Source Apex adapter: `src/lib/source/adapters/apex-retail-adapter.ts`
- Smoke: `scripts/smoke/foundation-fix-1-retrieval-wiring.spec.ts`

## QA / Validation

- `npm run smoke:foundation-fix-1-retrieval-wiring` — passed.
- `npx jest src/lib/source/__tests__/apex-retail-adapter.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/knowledge/__tests__/agent-context-broker-tenant-data-integration.test.ts --runInBand` — passed.
- Focused `npx eslint` across the changed retrieval, Sentinel, Source, and smoke files — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to main and deploy to production. No migration is required; the change reads existing Packet 18 context chunk data and invalidates the old retrieval blind spot through code paths.

## Rollback Plan

Revert this PR to restore the prior retrieval behavior. No database rollback is required.

## Audit Evidence

Inspect the diagnosis artifact, smoke output, and PR CI. The smoke verifies the old unavailable-data phrases are absent and that Apex `APX-`, `INIT-`, and `EDGE-` fingerprints appear in broker, Source, and Sentinel outputs.

## Known Gaps

The normalized runtime tables still do not contain every Packet 18 row under the `apexretail` literal key; this fix intentionally reads the existing P18 context chunk source of truth rather than modifying data.
