# 2026-06-03-immutable-audit-log — Immutable Audit Log Foundation

## Release ID

`2026-06-03-immutable-audit-log`

## Status

`candidate`

## Plain-English Summary

Adds the Azure foundation for a client-scoped immutable audit ledger. Each
client tenant can now deploy an `audit-ledger` Blob container with public access
disabled, version-level immutability, protected append writes, and 12-24 month
retention defaults.

## Layer Impact

- `client-data-lane`: adds storage controls inside the single-client private
  data plane.
- `internal-admin`: adds runbook and verifier coverage for AbarVa operators
  preparing pilot environments.

## Client Applicability

- All clients: applies when their private data plane is deployed from the
  client tenant wrapper.
- Specific clients: none.
- Internal only: verifier and runbook are for AbarVa operators.
- Public/demo only: no.
- Feature flag: no runtime flag; activation requires Azure deployment.

## Changes Included

- `infra/azure/immutable-audit-log.bicep`
- `infra/azure/client-tenant-foundation.bicep`
- `infra/azure/parameters/client-tenant.preview.example.bicepparam`
- `scripts/azure/verify-immutable-audit-log.mjs`
- `package.json`
- `docs/runbooks/immutable-audit-log.md`
- `docs/build/IMMUTABLE_AUDIT_LOG_2026-06-03.md`

## QA / Validation

- Pass: `npm run azure:immutable-audit-log:verify`
- Pass: `npm run azure:client-tenant-iac:verify`
- Pass: `az bicep build --file infra/azure/client-tenant-foundation.bicep`
- Pass: `git diff --check`
- Pass after release-record wording fix: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The change has no runtime effect until an operator runs the
client-tenant Azure deployment or what-if using a client parameter file.

## Rollback Plan

Before Azure deployment, revert the PR. After deployment, do not attempt to
shorten or remove an approved immutability policy without customer/legal
approval; instead deploy a new ledger container and leave the retained ledger in
place until its retention period expires.

## Audit Evidence

- PR URL and CI run after opening.
- Local verifier output.
- Bicep build output.
- Future Azure what-if/deploy output for the target client tenant.

## Known Gaps

Live Azure what-if/deploy evidence, sample append proof, denied
delete/overwrite proof, and app-wide audit-writer routing to Blob are not part
of this repository-only slice.
