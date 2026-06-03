# 2026-06-03-cmk-byok-readiness — CMK/BYOK Readiness Plan

## Release ID

`2026-06-03-cmk-byok-readiness`

## Status

`candidate`

## Plain-English Summary

AbarVa now has a concrete architecture path for customer-managed keys and bring-your-own-key requests. The docs distinguish what is available today through a customer-owned Private Data Plane from what is still planned for managed SaaS BYOK, and they list the Azure services, readiness gates, and implementation backlog required before AbarVa can claim managed SaaS BYOK support.

## Layer Impact

- `global-control-lane`: Updates shared security and architecture guidance used for enterprise review, sales diligence, and future implementation.
- No runtime, data schema, migration, or Azure deployment changes.

## Client Applicability

- All clients: The security posture and architecture docs apply to all future enterprise reviews.
- Specific clients: None.
- Internal only: Used by AbarVa operators and implementation teams for truthful BYOK planning.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0012-cmk-byok-readiness.md`
- `docs/architecture/azure/CMK_BYOK_READINESS_PLAN.md`
- `docs/architecture/adr/README.md`
- `docs/security/INFOSEC-ACCELERATOR.md`

## QA / Validation

- PASS: Documentation references were grounded in existing repo paths before authoring.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge through the protected main merge queue. No deployment or migration is required.

## Rollback Plan

Revert the PR to remove the ADR, readiness plan, and security posture references. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2946
- CI: pending.
- Local QA: docs path audit, whitespace check, and release control pass before PR.

## Known Gaps

This is a readiness plan only. It does not implement managed SaaS BYOK, bind Azure services to customer-managed keys, or run a live key lifecycle drill.
