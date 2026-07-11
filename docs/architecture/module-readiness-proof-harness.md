# Module Readiness Proof Harness

Status: dry-run proof harness.

This harness composes the dry-run data-layer artifacts into one executable proof path:

1. file to canonical object,
2. canonical object to fact plan,
3. fact plan to graph plan,
4. fact plan to derived intelligence plan,
5. derived plan to module-readiness blockers.

## Inputs

- Tenant Packet dry-run proof bundle.
- Target Writer dry-run proof bundle.

## What It Proves

The harness proves that a candidate tenant packet can move through the planned data-layer stages without losing traceability:

- source files are parsed into canonical objects,
- canonical objects are mapped into fact and evidence write plans,
- relationship data is inspected for graph planning,
- domains are grouped into derived intelligence plans,
- modules receive explicit readiness blockers instead of being silently treated as live.

## What It Does Not Prove

It does not prove:

- production database writes,
- active tenant promotion,
- graph materialization,
- derived intelligence materialization,
- module runtime consumption,
- live answer quality.

## Command

```bash
npm run audit:module-readiness-proof
```

The command writes a proof bundle under `reports/module-readiness-proof/minimal`.
