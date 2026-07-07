# 2026-06-03-azure-blob-upload-pattern — Azure Blob Direct Upload Pattern

## Release ID

`2026-06-03-azure-blob-upload-pattern`

## Status

`candidate`

## Plain-English Summary

Defines the T036 architecture pattern for Azure Blob direct upload into a
client-scoped data plane. The pattern requires one-client-only upload sessions,
short-lived SAS tokens, mandatory metadata, Defender malware scan gating,
sensitive-data quarantine, Event Grid/Service Bus handoff, and approval
evidence before commit.

## Layer Impact

- `internal-admin`: adds an operations and architecture runbook plus a verifier
  script for the upload pattern.
- `client-data-lane`: defines the required client-scoped upload controls for
  future data-plane implementation, but does not provision resources or load
  tenant data.

## Client Applicability

- All clients: the pattern applies to future client/private data-plane upload
  sessions.
- Specific clients: none implemented by this release.
- Internal only: the runbook and verifier are internal architecture controls.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/runbooks/azure-blob-upload-pattern.md`
- `scripts/azure/verify-blob-upload-pattern.mjs`
- `package.json` script: `azure:blob-upload-pattern:verify`

## QA / Validation

- Pass: `npm run azure:blob-upload-pattern:verify`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main. No runtime deployment, migration, tenant provisioning, or live
data load is required. Future private-data-plane and FakeClient implementation
work should treat this runbook as the T036 architecture contract.

## Rollback Plan

Revert the PR to remove the runbook, verifier, release record, and package
script. No customer data or Azure resources are affected.

## Audit Evidence

- PR URL and merge commit after merge.
- Local verifier output from `npm run azure:blob-upload-pattern:verify`.
- Release-check output.

## Known Gaps

This does not provision live Azure resources, issue live SAS tokens, configure a
customer network path, or run an end-to-end upload. Those remain tracked by the
FakeClient rehearsal, private data-plane, and live load rows.
