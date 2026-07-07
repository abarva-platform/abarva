# 2026-07-04-product-release-audit-digest-freshness - Product Audit Digest Freshness

## Release ID

`2026-07-04-product-release-audit-digest-freshness`

## Status

`candidate`

## Plain-English Summary

The Product release-operational audit correctly requires digest-pinned images, but its freshness check only understood old timestamped tags. After Product Dev, Preview, and Prod were moved to digest-pinned images, the audit could prove health and pinning but still required manual approval for freshness. This release lets the audit read ACR manifest metadata for digest images so the gate can prove freshness without weakening the digest rule.

## Layer Impact

- `internal-admin`: improves the Azure Product environment readiness audit.
- `global-control-lane`: affects release evidence only; no runtime behavior changes.

## Client Applicability

- All clients: No direct client behavior change.
- Specific clients: None.
- Internal only: AbarVa release operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/azure/audit-product-release-operational-readiness.mjs`: parses digest-pinned ACR images and resolves manifest `createdTime`/`lastUpdateTime` for freshness.

## QA / Validation

- Pass: `npm run azure:product-release-operational:audit:strict -- --health-timeout-ms 30000` returned `status=release_operational`, `release_operational=3`, `pass=57`, `attention=0`, `fail=0`.
- Pending: `npm run release:check`.

## Rollout Plan

Merge to `main`; no runtime deploy required. Operators use the updated audit to prove Product Dev, Product Preview, and Product Prod readiness after digest-pinned deployment.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Approved image digest: Not applicable for this script-only release.
- ACA runtime invariant: The audit now supports digest-pinned runtime evidence.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not applicable for this audit-script-only release.
- ACR build policy: Not changed by this script-only release; the Product deployment evidence captured separately used Product ACR Premium registries, a `main-<sha>` tag, ACR manifest metadata, and digest-pinned ACA updates.

## Rollback Plan

Revert the script change. Digest-pinned environments will continue to show freshness as manual-approval attention items until the harness is fixed again.

## Audit Evidence

- PR URL: To be added after PR creation.
- Strict Product release-operational audit output after the fix.
- `docs/azure/run-status/2026-07-04-product-release-operational-deployment.md`

## Known Gaps

This release fixes the readiness audit only. Product Dev, Product Preview, and Product Prod still need a repo-owned product deployment workflow with Buildx cache, permanent ACR import trust/RBAC between product registries, signed-in browser QA evidence, and SSO hardening before client migration or public cutover decisions.
