# 2026-06-13-client-private-plane-factory — Client Private Plane Factory Packet

## Release ID

`2026-06-13-client-private-plane-factory`

## Status

`candidate`

## Plain-English Summary

Adds the non-mutating client private-plane factory packet for ENV-14. The packet defines the repeatable pattern that each pilot or production client gets two isolated subscriptions: client preprod and client prod. It also defines required approvals, evidence, baseline resource families, hard stops, and no-PHI/no-PII policy posture.

## Layer Impact

- `client-data-lane`: Defines the approval and evidence factory for future client private data-plane subscriptions.
- `internal-admin`: Adds verifier and CI wiring so client preprod/prod creation cannot be treated as an informal portal task.

## Client Applicability

- All clients: Future pilot and production clients follow this factory.
- Specific clients: None created by this PR.
- Internal only: AbarVa platform, release, and operations users.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.json`
- `docs/azure/CLIENT_PRIVATE_PLANE_FACTORY_2026-06.md`
- `scripts/azure/verify-client-private-plane-factory.mjs`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

- Pass: `npm run azure:client-private-plane-factory:verify`
- Pass: `npm run azure:client-tenant-iac:verify`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `npx eslint scripts/azure/verify-client-private-plane-factory.mjs`

## Rollout Plan

Merge to `main`. No runtime rollout occurs from this PR. Client subscription creation, RBAC, budgets, resources, private endpoints, ingestion, data loads, migrations, and client-prod data actions remain blocked until explicit approval.

## Rollback Plan

Revert the PR to remove the factory packet and CI verifier. No Azure resources, subscriptions, or data are changed by this PR.

## Audit Evidence

- PR URL
- CI production-readiness gate output
- Local verifier output
- Release record

## Known Gaps

This PR does not create any client private-plane subscriptions or run a sample client deployment. It only defines the evidence and approval bar.
