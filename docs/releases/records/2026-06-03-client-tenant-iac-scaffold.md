# 2026-06-03-client-tenant-iac-scaffold — Client Tenant IaC Scaffold

## Release ID

`2026-06-03-client-tenant-iac-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds a reproducible Azure client-tenant IaC scaffold that composes the existing
foundation, private Postgres, ingestion, search, and app-runtime modules into a
single-client preview/pilot lane.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: internal Azure operations and pilot-readiness infrastructure
  scaffolding.
- Runtime impact: no production app route, database migration, or live Azure
  deployment is performed by this PR.

## Client Applicability

- All clients: no runtime change.
- Specific clients: future pilot clients through copied, uncommitted parameter
  files.
- Internal only: scaffold, verifier, and runbook.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `infra/azure/client-tenant-foundation.bicep`
- `infra/azure/parameters/client-tenant.preview.example.bicepparam`
- `scripts/azure/verify-client-tenant-iac.mjs`
- `package.json`
- `docs/runbooks/client-tenant-iac.md`
- `docs/build/CLIENT_TENANT_IAC_MANIFEST_2026-06-03.md`

## QA / Validation

- Pass: `npm run azure:client-tenant-iac:verify`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Attempted when available: `az bicep build --file infra/azure/client-tenant-foundation.bicep`

## Rollout Plan

Merge to `main`. Operators can copy the example parameter file to an untracked
location, fill customer-specific values, run Azure `what-if`, and only then
deploy after approval.

## Rollback Plan

Revert this documentation/IaC scaffold commit. No live Azure, runtime, data, or
schema rollback is required because this PR does not deploy resources.

## Audit Evidence

- This release record.
- `docs/build/CLIENT_TENANT_IAC_MANIFEST_2026-06-03.md`
- Local verifier output.
- Pull request diff and CI checks.

## Known Gaps

- This does not complete a live Azure `what-if`.
- This does not provision Clerk SAML/OIDC.
- This does not perform live customer data loading.
- This does not mark T029 Done until target-subscription what-if/deploy
  evidence is captured.
