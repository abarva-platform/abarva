# 2026-08-16-sunset-migration-surface-purge - Sunset Migration Surface Purge

## Release ID

`2026-08-16-sunset-migration-surface-purge`

## Status

`candidate`

## Plain-English Summary

This release removes the highest-risk sunset-tenant surfaces before the AbarVa
Azure migration: provisioning parameters, dispatchable loaders, runtime
configuration values, package scripts, and tracked historical proof output that
could be copied into a new environment by accident.

The target migration posture is allowlist-only. The remaining active tenant set
for shared product-development environment migration is `meridian-health` and
`skyharbor-air`. Sunset tenants are not valid provisioning, loading, scheduling,
or migration targets.

## Layer Impact

- `client-data-lane`: removes old tenant load/projection commands and
  migration-facing proof payloads.
- `internal-admin`: removes old operator workflows and parameters that could
  provision or load retired tenants.
- No data-plane rows are changed by this release.

## Client Applicability

- All future clients: reduces migration residue risk by preventing retired
  synthetic/demo tenants from being carried forward.
- Specific clients: active shared environment tenants remain Meridian and
  SkyHarbor only.
- Public/demo only: no public-route behavior is intentionally changed.
- Feature flag: none.

## Changes Included

- Removes dispatchable old-tenant refresh/load workflow and seed Dockerfile.
- Removes old tenant private foundation parameter file.
- Removes obsolete lab Bicep/YAML deploy artifacts that carried old tenant
  values or mutable image references.
- Narrows shared Azure workflows to active tenant keys.
- Removes package scripts that target old tenant seed, setup, verify, smoke,
  projection, and QA paths.
- Removes tracked `reports/`, `proof/`, and `audit-artifacts/` payloads from the
  repository migration path.

## QA / Validation

- Pass: `package.json` parses as JSON.
- Pass: `validate:no-sunset-tenant-residue` config category is zero.
- Pass: `npx tsc --noEmit`.
- Pass: `npm run db:verify:canonical-tenants`.
- Pass: `npm run db:verify:retired-tenants`.
- Pass: `npm run release:check`.
- Not complete: full `validate:no-sunset-tenant-residue` still reports live
  code, docs, templates, archives, and PDFs that require follow-up cleanup.
- Blocked as expected until full residue cleanup:
  `npm run validate:migration-allowlist`.

## Rollout Plan

Merge through PR. Do not mutate ACA directly from this feature branch. Production
or shared Product/Lab traffic may move only through the repo-owned main ACA
deployment workflow after merge.

Before creating or migrating the new Azure subscription environment, run the
migration allowlist gate against the target manifest and confirm only active
tenant keys plus shared platform resources are present.

## Deployment Authority

- Repo-owned deploy workflow: required for any shared web runtime update.
- Shared runtime mutators: none in this release.
- ACR build policy: unchanged; shared web images remain owned by the repo main
  ACA deploy workflow and must be digest-pinned when used by runtime updates.
- Approved image digest: not applicable until main workflow deploys.
- ACA runtime invariant: required after any future main deploy.
- Worker image invariant: required after any future worker deploy.
- Live signed-in proof required: only after a deployed runtime change.

## Rollback Plan

Revert this release candidate if the migration-surface purge blocks required
active-tenant tooling. Do not restore retired tenant provisioning or loader
entrypoints without a new release record and explicit migration approval.

## Audit Evidence

- `npm run validate:no-sunset-tenant-residue` reports zero `config` findings
  after this cut.
- Git diff lists the removed workflow, parameter, package-script, and tracked
  proof-output surfaces.

## Known Gaps

This is not the final no-residue state. The full detector still reports old
tenant references in non-config live artifacts. Those must be cleaned or
reclassified before claiming the branch is migration-clean.
