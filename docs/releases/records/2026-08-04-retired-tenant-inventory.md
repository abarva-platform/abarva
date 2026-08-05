# 2026-08-04-retired-tenant-inventory — Retired Tenant Inventory Gate

## Release ID

`2026-08-04-retired-tenant-inventory`

## Status

`candidate`

## Plain-English Summary

Adds a read-only governance inventory for retired synthetic/demo tenant keys before any data removal. The tool discovers tenant-scoped PostgreSQL tables, resolves retired client IDs when the `clients` table is present, counts rows matching the retired key set, and emits export/delete plans for review.

## Layer Impact

- Layer 3 canonical/data plane: read-only inventory of tenant-scoped rows before cleanup.
- Layer 4 products: no direct runtime behavior change.
- Operations/governance: adds an auditable manifest step before destructive tenant retirement.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes, governance/operator cleanup tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/governance/retired-tenant-inventory.mjs`
- `package.json` script `audit:retired-tenant-inventory`

## QA / Validation

- Pass: `node --check scripts/governance/retired-tenant-inventory.mjs`.
- Pass: `npm run audit:retired-tenant-inventory -- --help`.
- Pass: `npx eslint scripts/governance/retired-tenant-inventory.mjs`.
- Blocked locally for full DB export: local `DATABASE_URL` is not exported and direct Key Vault lookup timed out; read-only ACA runtime inventory was run separately from the live container environment.

## Rollout Plan

Merge to main. Use the tool from a secure environment that has the approved PostgreSQL URL or through the governed operator lane. The default mode is read-only and emits `inventory.json`, `row-counts.csv`, `export-plan.sql`, `delete-plan.sql`, and `summary.md`.

## Deployment Authority

- Repo-owned deploy workflow: not required for local/operator script use.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the script and package command. No database rows are changed by this release.

## Audit Evidence

- Retired tenant inventory output directory or ZIP from the operator run.
- `inventory.json`
- `summary.md`
- `export-plan.sql`
- `delete-plan.sql`

## Known Gaps

This release does not execute deletion, remove runtime V6/V7 fallbacks, purge Azure AI Search, or remove old tenant fixture files. Those are follow-on cleanup phases after the inventory/export evidence is reviewed.
