# 2026-08-16-retired-tenant-purge-scope-guard - Retired Tenant Purge Scope Guard

## Release ID

`2026-08-16-retired-tenant-purge-scope-guard`

## Status

`candidate`

## Plain-English Summary

The tenant sunset branch leaves two canonical tenants active. This release fixes
the read-only inventory and purge-planning scripts so they no longer treat the
surviving tenant keys as retired. It also adds a plan-only data-plane purge
runbook that requires a reviewed dry-run and explicit approval before any
database deletion.

The broader sunset branch deletes legacy seed/setup-data entrypoints for sunset
tenants. This release adds no pilot data, performs no side-load, and does not
bypass the Admin Data Loader. No `data_ingestion_runs` or `pilot_ingestion`
ledger entry is created by this plan-only change because no ingestion or
database mutation is performed; any future replacement load must use the Admin
Data Loader or a loader-backed path that records that ledger evidence.

The focused residue purge now fails closed for protected tenants: truncate mode
requires every resolved table to have a `tenant_key` column and zero protected
keep-key rows, and chunked delete mode rolls back the table if protected
keep-key counts change.

## Layer Impact

- `client-data-lane`: corrects operator tooling that would be used to audit or
  purge retired tenant rows in Azure/Postgres.
- `internal-admin`: adds an operator plan artifact.
- No product runtime path changes.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: applies only to sunset synthetic/demo tenants during a
  future approved operator run.
- Internal only: AbarVa data-plane operators.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/governance/retired-tenant-inventory.mjs`
- `scripts/ops/audit-retired-tenant-residue.mjs`
- `scripts/ops/purge-retired-tenant-residue.mjs`
- `scripts/ops/purge-retired-tenant-rows.mjs`
- `scripts/verify-retired-tenant-references.mjs`
- `docs/ops/retired-tenant-data-plane-purge-plan-2026-08-16.md`

## QA / Validation

- Pass: `node --check` for all updated scripts.
- Pass: `node scripts/ops/purge-retired-tenant-residue.mjs --validate-only`.
- Pass: `node scripts/ops/purge-retired-tenant-rows.mjs --validate-only`.
- Pass: `node scripts/verify-retired-tenant-references.mjs`.
- Pass: `npx tsc --noEmit`.
- Pass: `npm run db:verify:canonical-tenants` with no `DATABASE_URL`; static
  allowlist clean.
- Pass: `npm run db:verify:retired-tenants`.
- Pass: `npm run audit:no-legacy-tenant-inputs`.
- Blocked as expected without credentials:
  `npm run audit:retired-tenant-inventory` requires `DATABASE_URL`,
  `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or `--database-url`.

## Rollout Plan

Merge through PR. No ACA deployment is required for the plan-only artifact and
script-scope correction unless operators intend to run the scripts from a
deployed image. Any future data-plane purge must first run the read-only
inventory, review `export-plan.sql` and `delete-plan.sql`, and receive explicit
human approval for the exact apply command.

## Deployment Authority

- Repo-owned deploy workflow: not required for this plan-only/script-scope
  change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the script and plan changes. No database rollback is required because this
release performs no data-plane mutation.

## Audit Evidence

- `docs/ops/retired-tenant-data-plane-purge-plan-2026-08-16.md`
- Validation command output listed above.

## Known Gaps

Live data-plane row counts are not available in this local environment because
no approved database URL is present. The purge plan is intentionally plan-only
until an operator dry-run produces evidence from the actual target database.
