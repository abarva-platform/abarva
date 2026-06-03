# Immutable Audit Log Readiness

Date: 2026-06-03

Backlog item: T041

## Summary

The client-tenant Azure wrapper now includes an immutable audit-log foundation
for each single-client private data plane. The module provisions an
`audit-ledger` Blob container with object-level immutability, versioning,
protected append writes, and 12-24 month retention defaults.

## Files

- `infra/azure/immutable-audit-log.bicep`
- `infra/azure/client-tenant-foundation.bicep`
- `infra/azure/parameters/client-tenant.preview.example.bicepparam`
- `scripts/azure/verify-immutable-audit-log.mjs`
- `docs/runbooks/immutable-audit-log.md`

## Controls

- Single-client metadata is applied to the immutable container.
- Public container access is disabled.
- Version-level immutability is enabled at container creation.
- The immutability policy uses the deployment retention parameter.
- Protected append writes are enabled for append-only audit streams.
- Blob change feed aligns to the audit retention period; soft-delete retention
  is capped at Azure's 365-day maximum while immutability carries the longer
  WORM retention.
- Lifecycle management moves retained ledger records to cool tier after 30
  days.

## Verification

Run locally:

```bash
npm run azure:immutable-audit-log:verify
npm run azure:client-tenant-iac:verify
az bicep build --file infra/azure/client-tenant-foundation.bicep
```

## Completion Boundary

Repository-side readiness is complete when this PR merges. T041 remains `In
progress` until Azure what-if/deploy evidence proves the policy on a client
tenant and a delete/overwrite attempt is denied during retention.
