# Product Release Operational Audit

Date: 2026-07-04
Azure account boundary: `admin@abarva.ai`
Audit command: `node scripts/azure/audit-product-release-operational-readiness.mjs --health-timeout-ms 8000`

## Summary

Status: `not_release_operational`

| Environment | Subscription | Runtime status | Health | Image finding |
| --- | --- | --- | --- | --- |
| Product Dev | `sub-abarva-product-dev-eus-001` | `provisioned_needs_approval` | Pass | Tag image, 17 days old |
| Product Preview | `sub-abarva-product-preview-eus-001` | `provisioned_needs_approval` | Pass | Tag image, 17 days old |
| Product Prod | `sub-abarva-product-prod-eus-001` | `provisioned_needs_approval` | Pass | Tag image, 17 days old |

The three product environments are provisioned and currently answer `/api/health`, including Postgres and direct Postgres checks. They should still not be called release-operational because the active web apps use mutable tag references rather than digest-pinned images, and the image tags are from 2026-06-16.

## Environment Findings

### Product Dev

- Subscription ID: `fbea9ee2-ccdd-49fc-808b-22897f2db56b`
- Web app: `ca-abarva-pdev-web-eus2-001`
- Resource group: `rg-abarva-product-development-controlplane-eus2-001`
- Image: `acrabvpdev001.azurecr.io/abarva/web:product-dev-20260616T170210Z-2fe7eab4bf05`
- Health: Pass
- Open issues:
  - Image is not digest-pinned.
  - Image timestamp is 17 days old and requires refresh or explicit stale-baseline approval.

### Product Preview

- Subscription ID: `0cd743d3-ea51-43e3-97e2-723b9f34fb21`
- Web app: `ca-abarva-pprev-web-eus2-001`
- Resource group: `rg-abarva-product-preview-controlplane-eus2-001`
- Image: `acrabvpprev001.azurecr.io/abarva/web:product-preview-20260616T170210Z-2fe7eab4bf05`
- Health: Pass
- Open issues:
  - Image is not digest-pinned.
  - Image timestamp is 17 days old and requires refresh or explicit stale-baseline approval.

### Product Prod

- Subscription ID: `1c67651b-4c57-49e8-9934-7dd660cdbd3b`
- Web app: `ca-abarva-pprod-web-eus2-001`
- Resource group: `rg-abarva-product-prod-controlplane-eastus2`
- Image: `acrabvpprod001.azurecr.io/abarva/web:product-prod-20260616T170210Z-2fe7eab4bf05`
- Health: Pass
- Open issues:
  - Image is not digest-pinned.
  - Image timestamp is 17 days old and requires refresh or explicit stale-baseline approval.

## Decision

Call the current state: `provisioned_needs_approval`.

Do not call it `release_operational` until Dev, Preview, and Prod run an approved current release image by digest, and the release evidence pack confirms health, app boot, secrets, Postgres, storage, search, observability, auth, and a basic tenant journey.

## Next Actions

1. Refresh Product Dev with the next approved image digest and rerun the audit in strict mode.
2. Promote the same release candidate to Product Preview after Dev passes.
3. Promote to Product Prod only after Preview proof is green.
4. Use Product Prod as the certified baseline for the first stamped client Preprod.
