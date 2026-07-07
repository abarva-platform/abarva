# 2026-06-13-client-preprod-rehearsal-packet — Client Preprod Rehearsal Packet

## Release ID

`2026-06-13-client-preprod-rehearsal-packet`

## Status

`candidate`

## Plain-English Summary

Adds the non-mutating ENV-16 client preprod rehearsal packet. The packet defines the evidence required before the first pilot client preprod rehearsal can be called complete, including approval, private-plane proof, identity/RBAC, private connectivity, governed upload, context health, retrieval/citations, context-bundle trace, signed-in UAT, and rollback or abandon proof.

## Layer Impact

- `client-data-lane`: Defines the client preprod rehearsal evidence bar before any pilot client private data plane can be accepted.
- `internal-admin`: Adds verifier and CI wiring so client preprod rehearsal cannot be treated as informal or complete without evidence.

## Client Applicability

- All clients: Future pilot clients use this rehearsal model before client prod.
- Specific clients: None created, loaded, or mutated by this PR.
- Internal only: AbarVa platform, release, data, and operations users.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.json`
- `docs/azure/CLIENT_PREPROD_REHEARSAL_PACKET_2026-06.md`
- `scripts/azure/verify-client-preprod-rehearsal-packet.mjs`
- `package.json`
- `.github/workflows/production-readiness-gate.yml`

## QA / Validation

- Pass: `npm run azure:client-preprod-rehearsal:verify`
- Pass: `npm run azure:client-data-onboarding:verify`
- Pass: `npx eslint scripts/azure/verify-client-preprod-rehearsal-packet.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. No runtime rollout occurs from this PR. Real client preprod subscription/resource creation, upload windows, ingestion, search refreshes, signed-in UAT, and acceptance remain blocked until explicit approval.

## Rollback Plan

Revert the PR to remove the rehearsal packet and CI verifier. No Azure resources, subscriptions, database rows, search indexes, or client data are changed by this PR.

## Audit Evidence

- PR URL
- CI production-readiness gate output
- Local verifier output
- Release record

## Known Gaps

This PR does not run a client preprod rehearsal. It only defines the evidence, approval, and hard-stop model for a future approved rehearsal.
