# 2026-05-30-c13-defender-baseline

## Release ID

`2026-05-30-c13-defender-baseline`

## Status

`candidate`

## Plain-English Summary

This release records the Azure Defender for Cloud baseline for the AbarVa subscription and documents the service plans enabled for security scanning and recommendations.

## Layer Impact

Security/control lane: Defender for Cloud Standard plans are active for the Azure services that support the control plane and data plane.

Runtime lane: no app runtime code changes.

Data/schema lane: no database schema changes and no production data mutation.

Audit lane: a durable evidence report was added under `verification/azure-defender/`.

## Client Applicability

- All clients: yes. The security posture applies to the shared AbarVa Azure platform that serves all five canonical tenants.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, and SkyHarbor Air inherit this platform protection.
- Internal only: Defender portal operations and weekly recommendation exports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `verification/azure-defender/DEFENDER_BASELINE_2026-05-30.md`

## QA / Validation

- PASS: `az account show --output json`.
- PASS: `az security pricing list` showed Standard tier for AppServices, StorageAccounts, ContainerRegistry, KeyVaults, OpenSourceRelationalDatabases, Containers, Discovery, and FoundationalCspm.
- PASS: `git diff --check`.
- PENDING: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

No application rollout is required. The Azure Defender settings are already applied at the subscription level; merge this evidence record after docs validation and CI are green.

## Rollback Plan

If the paid Defender plan set needs to be reduced, use `az security pricing create -n <plan> --tier Free` for the specific plan and update this evidence record with the reason. No app rollback is required.

## Audit Evidence

The baseline report lists the exact subscription, enabled Defender plans, command evidence, and the deprecated Log Analytics auto-provisioning result.

## Known Gaps

Azure rejected the legacy Log Analytics auto-provisioning setting because it is deprecated. Weekly vulnerability reporting still needs scheduled export automation from the current Defender recommendations path.
