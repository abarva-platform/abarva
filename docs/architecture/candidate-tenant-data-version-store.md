# Candidate Tenant Data Version Store

Status: non-destructive candidate persistence boundary.

The Candidate Tenant Data Version Store persists proof metadata for a tenant packet that has completed the dry-run path. It is the first controlled persistence boundary after dry-run proof, but it does not write active tenant facts, graph records, derived intelligence, module memory, or outcome records.

## Purpose

PR8 answers where a candidate tenant data version lives before active promotion:

- a candidate record is written under `reports/candidate-tenant-data-versions/<fixture>/`,
- it is tied to packet version, adapter version, mapping version, target-writer version, and proof bundle fingerprints,
- it records the planned persistence footprint without writing physical tables,
- it records promotion blockers and rollback policy,
- it preserves the rule that modules do not read candidates unless a later preview path explicitly asks for them.

## Input Chain

The candidate record is generated from the existing proof runway:

1. Tenant Packet dry-run proof bundle,
2. Canonical Ingestion Records,
3. Target Writer dry-run plan,
4. Graph plan,
5. Derived intelligence plan,
6. Module-readiness proof.

## Status Model

Allowed candidate statuses:

- `created`
- `validated`
- `blocked`
- `promotion-ready`
- `rejected`

PR8 can create a `validated` or `blocked` record. It cannot create an active tenant version and cannot mark a candidate as promoted.

## Promotion Boundary

Promotion remains blocked until a later explicit gate proves:

- candidate promotion is enabled by operator action,
- quality gates pass,
- the prior active tenant data version is preserved for rollback,
- signed-in module preview proof succeeds,
- module consumption proof is complete where tenant policy requires it.

The Candidate Tenant Data Version Store sets:

- `dryRunOnly: true`
- `writesPhysicalTables: false`
- `activeTenantAccessLayerUpdated: false`
- `moduleRuntimeConsumptionChanged: false`
- `promotionEnabled: false`
- `noModuleReadsCandidateByDefault: true`

## Command

```bash
npm run audit:candidate-tenant-version
```

The command writes a proof record under `reports/candidate-tenant-data-versions/minimal`.
