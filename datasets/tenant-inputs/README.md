# Canonical Tenant Inputs

This directory is the only governed filesystem root for tenant input files used
by data-layer loaders, dry runs, candidate generation, Home/aVa context
projection, and future onboarding proofs.

## Rule

- Active tenant inputs live under `datasets/tenant-inputs/active/<tenant-key>/`.
- Retired, duplicate, historical, or staging inputs live under `datasets/tenant-inputs/archive/`.
- New tenant pilots use the universal template set under
  `datasets/tenant-inputs/templates/universal/standard-2026-07`.
- Loader contracts must point at this root before a tenant input can become
  active product truth.
- Legacy dataset folders outside this root are compatibility history only until
  they are removed in a mechanical cleanup.

Northstar is retired/excluded and must not be processed as an active tenant.

## Azure Landing Convention

The environment-specific storage account is bound by deployment configuration,
but the logical convention is fixed:

```text
container: tenant-inputs
raw:       tenant-inputs/{tenant_key}/{intake_id}/raw/
validated: tenant-inputs/{tenant_key}/{intake_id}/validated/
archive:   tenant-inputs/archive/{tenant_key}/{intake_id}/
```

Files use this naming pattern:

```text
{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv
```

Raw uploads are not active product truth. The data build consumes validated
files after quality/depth checks, placeholder rejection, source lineage checks,
and operator approval.

## Current Active Tenants

The source of truth is `tenant-input-registry.json`.

## Quality Gate

Run:

```bash
npm run audit:canonical-tenant-inputs
npm run audit:tenant-input-quality
```

The first command proves files are in the right governed root. The second
command checks universal template coverage and publishes a tenant-by-tenant
depth matrix so thin source packets cannot masquerade as rich enterprise data.
