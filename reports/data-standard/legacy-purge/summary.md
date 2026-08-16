# Legacy Tenant Input Purge

Status: enforced purge of loader-visible legacy tenant templates and source packs.

- Approved standard: `standard-2026-07-v3`
- Deleted legacy files in this diff: 183
- Blocked loader-visible legacy paths remaining: 0
- Blocked guarded-content legacy references remaining: 0
- Allowed historical references remaining: 616

## Purged Roots

- `datasets/tenant-inputs/archive`
- `datasets/enterprise-intelligence-template-pack-v6`
- `datasets/client-load-staging`
- `datasets/lakeshore-kyriba-synthetic-v1`
- `datasets/tenant-inputs/templates/universal/standard-2026-07`
- `public/setup-templates`
- `public/templates top-level client workbooks`
- `scripts/tenant-v6`
- `scripts/v7`
- `scripts/lib/v6-v7`

## Truth Split

- This purge removes old tracked templates/source packs/loader commands from the repository.
- It does not mutate production tenant data.
- It does not update the Active Tenant Access Layer.
- It does not promote candidates.
- It does not change module runtime behavior.

## Guardrail

`npm run audit:no-legacy-tenant-inputs` fails if legacy V-named source/template packs or stale active lineage reappear in guarded loader-visible paths.
