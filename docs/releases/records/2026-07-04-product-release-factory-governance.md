# 2026-07-04-product-release-factory-governance - Product Release Factory Governance

## Release ID

`2026-07-04-product-release-factory-governance`

## Status

`candidate`

## Plain-English Summary

This release turns the product Dev, Preview, and Prod environment discussion into a durable release-factory contract and a repeatable live audit. It makes the distinction explicit: product environments are the factory, while client environments are stamped private deployments that receive certified product releases plus client data and configuration.

## Layer Impact

`internal-admin` lane: adds operator-facing Azure governance documentation and a live audit script for product environment readiness.

`global-control-lane` lane: adds no runtime behavior, but it defines the release promotion contract that future shared app and Azure deployment work must follow.

## Client Applicability

Internal only: this is an AbarVa platform governance and audit change.

All clients: no direct runtime change reaches clients from this release.

Feature flag: not applicable.

## Changes Included

- Added `docs/azure/PRODUCT_RELEASE_FACTORY_CONTRACT_2026-07-04.md`.
- Added `docs/azure/PRODUCT_RELEASE_FACTORY_CONTRACT_2026-07-04.json`.
- Added `scripts/azure/audit-product-release-operational-readiness.mjs`.
- Added npm scripts for advisory and strict product release operational audits.
- Added the first run-status artifact at `docs/azure/run-status/2026-07-04-product-release-operational-audit.md`.

## QA / Validation

Pass: ran `node scripts/azure/audit-product-release-operational-readiness.mjs --health-timeout-ms 8000` against the `admin@abarva.ai` Dev, Preview, and Prod subscriptions.

Pass: the audit confirmed all three product ACA apps are provisioned and `/api/health` currently returns `ok=true`.

Attention: the audit also confirmed all three active product images are mutable tags rather than digest-pinned references, and the image timestamps are from 2026-06-16.

Not run: no Azure mutation, image deploy, DNS change, data migration, or client environment promotion was performed.

## Rollout Plan

Merge this governance and audit change to main. No ACA deployment is required for the docs/script itself. Operators can run `npm run azure:product-release-operational:audit` for advisory evidence and `npm run azure:product-release-operational:audit:strict` when a release must prove Dev, Preview, and Prod are fully release-operational.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; no runtime deploy.
- Shared runtime mutators: none.
- Approved image digest: not changed by this release.
- ACA runtime invariant: not changed by this release.
- ACR build policy: not changed by this release; future Product Dev, Preview, Prod, and client promotions must use the approved build path and record the image digest.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not applicable for this non-runtime governance slice.

## Rollback Plan

Revert the documentation, package script entries, and audit script if the release factory contract needs to be replaced. No data or Azure resource rollback is required because this release is non-mutating.

## Audit Evidence

- Live audit summary captured in `docs/azure/run-status/2026-07-04-product-release-operational-audit.md`.
- Full command output can be regenerated with `node scripts/azure/audit-product-release-operational-readiness.mjs --health-timeout-ms 8000`.
- Release record: this file.

## Known Gaps

The product environments remain `provisioned_needs_approval`, not `release_operational`, until a current approved image digest is deployed and strict evidence proves image freshness, digest pinning, health, secrets, Postgres, storage, search, observability, auth, and a basic tenant journey.
