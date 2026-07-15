# Canonical Tenant Inputs

Tenant source files must not be scattered across generated folders, staging
folders, old demo packs, and local reports. The governed filesystem contract is:

```text
datasets/tenant-inputs/
  templates/universal/standard-2026-07-v3/
  active/<tenant-key>/<version-or-lane>/
  tenant-input-registry.json
```

## Product Rule

Only files under `datasets/tenant-inputs/active/<tenant-key>/` may be used as
authoritative tenant input for loaders, candidate generation, Home/aVa
projection, or module context.

Everything else under `datasets/` is not an approved tenant input unless it is
part of the universal template standard, a generated v3 candidate proof, or an
explicitly declared active packet in `tenant-input-registry.json`.

All new tenant pilots use one universal template set:

```text
datasets/tenant-inputs/templates/universal/standard-2026-07-v3
```

Industry differences are captured in rows, categories, descriptors, evidence,
relationships, and domain-specific values. They do not create tenant-specific
schemas.

## Universal Template Domains

The universal template set captures:

- enterprise profile, mission, vision, revenue, employees, leadership,
  headquarters, regions, business model, and strategic priorities
- business functions, ownership, roles, and managed-service scope
- applications, systems, infrastructure, platforms, data centers, cloud regions,
  and lifecycle state
- data assets, integrations, marts, warehouses, lakehouses, semantic layers, and
  analytics products
- vendors, contracts, spend, value, programs, AI/automation use cases, risks,
  controls, metrics, outcomes, relationships, evidence, industry patterns, and
  expert lenses

This is intentionally broad enough for healthcare, airlines, financial services,
retail, legal operations, sourcing, and future tenants without creating separate
schemas per industry.

## Azure Landing Convention

The canonical Azure logical landing is:

```text
container: tenant-inputs
raw:       tenant-inputs/{tenant_key}/{intake_id}/raw/
validated: tenant-inputs/{tenant_key}/{intake_id}/validated/
archive:   tenant-inputs/archive/{tenant_key}/{intake_id}/
```

Files use:

```text
{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv
```

The admin upload page must land files into this convention. A raw upload is not
loadable truth until validation produces a validated packet.

## Why This Exists

The old layout allowed this failure mode:

```text
rich source pack exists
but loader or Home reads a thin generated subset
```

The canonical root closes that gap by forcing every active tenant to declare the
actual input packets the platform is allowed to process.

The quality/depth audit adds a second control: every tenant packet is checked
for domain coverage and enterprise-scale row depth before regeneration. This is
how a 15B or 80B enterprise avoids being represented by a handful of system
rows when richer source evidence exists upstream.

## Retired Tenants

Northstar is retired/excluded. It must not appear as an active tenant input.

## Legacy Purge Rule

Legacy V-named tenant packs, staging packs, current-state packs, rich packs,
upgrade-candidate packs, and public client workbooks must not remain in
loader-visible repository paths. If historical recovery is required, use git
history or a controlled external archive. Runtime loaders and module context
builders must consume only the v3 universal template standard and declared
active tenant inputs.

## Validation

Use:

```bash
npm run audit:canonical-tenant-inputs
npm run audit:tenant-input-quality
```

The canonical audit enforces root placement and retired-tenant policy. The
quality audit checks universal template presence, Azure naming conventions, and
tenant/domain depth. It reports blockers separately from command failures so
today's source standardization can merge before the next regeneration/load job.
