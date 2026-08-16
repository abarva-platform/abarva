# 2026-08-16-sunset-residue-report-guard — Sunset Residue Report Guard

## Release ID

`2026-08-16-sunset-residue-report-guard`

## Status

`candidate`

## Plain-English Summary

Adds a validator that finds references to registry-retired tenants across
tracked repository artifacts. The validator derives retired tenant terms from
`datasets/tenant-inputs/tenant-input-registry.json` and scans file paths,
regular text files, Office/ZIP containers, and PDF text when `pdftotext` is
available.

This change also removes migration-facing retired tenant config residue:
dispatchable workflow defaults, lab parameter values, Docker runtime copy paths,
and package scripts that could launch old tenant load/projection jobs. It does
not delete tenant data files, purge database rows, activate a registry, refresh
projections, or make a live-client truth claim.

## Layer Impact

- `client-data-lane`: reports retired tenant residue in tracked intake,
  archive, adapter, loader, and migration artifacts. No intake data, adapter
  output, canonical objects, relationships, facts, or product projections are
  changed by this release.
- `internal-admin`: adds an operator/auditor validation script and removes
  dispatchable retired tenant migration/provisioning config.

## Client Applicability

- All clients: no direct runtime behavior change.
- Specific clients: scoped to synthetic/demo retired tenant references declared
  in the tenant input registry.
- Internal only: AbarVa operators and release reviewers.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/audit/validate-no-sunset-tenant-residue.mjs`.
- Adds `npm run validate:no-sunset-tenant-residue`.
- Narrows migration/provisioning config to the active shared demo tenants.
- Removes one retired tenant pilot parameter file from the migration path.
- Removes package script aliases that dispatch retired tenant data jobs.
- Pins edited ACA web/job parameter images to the latest repo-owned deployed
  digest from run `31964552241`.

## QA / Validation

- Pass: `node --check scripts/audit/validate-no-sunset-tenant-residue.mjs`.
- Pass: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`.
- Pass: `npm run validate:no-sunset-tenant-residue -- --fail-on=config --out /tmp/nexus-sunset-residue-config-final.json`.
  - Scanned 21,990 tracked files: 20,493 text, 507 archives, 69 PDF.
  - Config findings: 0.
- Report-only inventory: `npm run validate:no-sunset-tenant-residue -- --pass-on-findings --out /tmp/nexus-sunset-residue-report-final.json`.
  - Non-config live findings remain: 829 paths, 3,840 text, 121 archives, 40 PDF.
  - History findings: 673, classified as audit evidence rather than failed live residue.
- Pass: `npm run db:verify:retired-tenants`.
  - Result: `verify-retired-tenant-references: clean`.
- Pass: `npm run db:verify:canonical-tenants`.
  - Result: static allowlist passed; live drift check skipped because
    `DATABASE_URL` was absent locally.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow may rebuild the shared
web image after merge; it is the only approved path that may shift shared web
traffic. This change does not require any manual Azure or data-plane operation.

## Deployment Authority

- Repo-owned deploy workflow: permitted after merge and is the only deployment
  authority for shared Product/Lab web traffic.
- Shared runtime mutators: none.
- ACR build policy: unchanged; shared web images remain built by the repo-owned
  ACA main deploy workflow and must use the Premium ACR/cache policy enforced by
  release gates.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:8a3533af71b5fd4a81f919245fc9026b946023c34b6a479a12d113d0e7afaa74`
  for edited static ACA/job parameter files; any post-merge runtime image is
  resolved by the repo-owned main ACA deploy workflow.
- ACA runtime invariant: required if the repo-owned main ACA deploy runs.
- Worker image invariant: required if the repo-owned main ACA deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no; no product surface behavior changes.

## Rollback Plan

Revert the script, npm script entry, and this release record. No data rollback is
required because this release performs no data-plane mutation.

## Audit Evidence

- JSON report path from the validation run.
- PR checks and merge commit.
- ACA deploy proof if the repo-owned main deploy workflow runs after merge.

## Known Gaps

The guard now proves migration/provisioning config is clean, but the repository
still carries non-config retired tenant residue in paths, text files, archives,
and PDFs. Those findings need follow-up classification into historical evidence,
archive-only material, or safe deletion. Tenant data deletion and Azure/Postgres
cleanup remain separate gated operations.
