# 2026-06-13-client-data-onboarding-process — Client Data Onboarding Process Packet

## Release ID

`2026-06-13-client-data-onboarding-process`

## Status

`candidate`

## Plain-English Summary

Adds the non-mutating client data onboarding process packet for ENV-15. The packet defines how every future client data upload must move from source files to Azure Blob staging, Postgres source registration, parsing, records/facts/chunks, current-view refresh, Azure AI Search, tenant-scoped retrieval, citations, promotion calculation, context-bundle proof, and module readiness.

## Layer Impact

- `client-data-lane`: Defines the governed client data onboarding process for future client preprod/prod private planes.
- `internal-admin`: Adds verifier and CI wiring so uploads cannot be treated as ready without manifest, lineage, idempotency, retrieval, citation, and context-bundle proof.

## Client Applicability

- All clients: Future pilot and production clients follow this upload/onboarding process.
- Specific clients: None loaded or mutated by this PR.
- Internal only: AbarVa platform, release, data, and operations users.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.json`
- `docs/azure/CLIENT_DATA_ONBOARDING_PROCESS_2026-06.md`
- `scripts/azure/verify-client-data-onboarding-process.mjs`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

- Pass: `npm run azure:client-data-onboarding:verify`
- Pass: `npm run azure:client-private-plane-factory:verify`
- Pass: `npx eslint scripts/azure/verify-client-data-onboarding-process.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. No runtime rollout occurs from this PR. Client uploads, parsing, indexing, promotion, and client-prod data actions remain blocked until explicit approval and evidence capture.

## Rollback Plan

Revert the PR to remove the onboarding process packet and CI verifier. No Azure resources, subscriptions, database rows, search indexes, or client data are changed by this PR.

## Audit Evidence

- PR URL
- CI production-readiness gate output
- Local verifier output
- Release record

## Known Gaps

This PR does not run a client upload or prove a live client data load. It only defines the evidence, approval, idempotency, and readiness bar for future approved uploads.
