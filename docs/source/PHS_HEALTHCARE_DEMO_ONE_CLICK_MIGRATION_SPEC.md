# Synthetic Healthcare Demo One-Click Migration Specification

Status: specification_only, not_executed

The future operator command must run as a governed ACA job after Phase B approval. It must be tenant-scoped, dataset-versioned, dry-run capable, idempotent where appropriate, hash-verified, fail-closed, fully logged and rollback-capable.

Future command shape:

```bash
ops:aca-job --script source:healthcare-demo:activate \
  --tenant-key phs_health_demo_global \
  --dataset-id phs-health-source-v1-202608 \
  --package-sha <approved-sha> \
  --dry-run
```

The command must validate package SHA-256, tenant identity, dataset identity, approved additive migrations, tenant bootstrap, grain counts, relationship integrity, document evidence, Source projections, Tower projections, consumption views, Cube runtime, cross-tenant isolation and exact reconciliation before atomically moving an active dataset pointer.

It must never truncate shared tables, alter SkyHarbor data, create a default healthcare tenant fallback, overwrite a prior dataset without versioned activation, or bypass CI/source control for migrations.
