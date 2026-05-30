# 2026-05-30-apex-tenant-overlay-config — Apex Pattern Overlay Config

## Release ID

`2026-05-30-apex-tenant-overlay-config`

## Status

`candidate`

## Plain-English Summary

This release makes Apex Retail's pattern overlays explicit in the canonical
tenant config. Apex is now configured for the shared core pattern layer and the
Retail Overlay v1 industry corpus.

## Layer Impact

- `control-plane-lane`: Adds `patternOverlays` to canonical tenant config.
- `agent-context-lane`: Declares Apex's intended pattern overlay subscription as
  `core + retail-v1`.
- `qa-validation-lane`: Adds tests and Section 7.2 evidence.
- `runtime-app-lane`: No UI behavior change.

## Client Applicability

- All clients: Every canonical tenant now declares at least the `core` overlay.
- Specific clients: Apex Retail declares `core` and `retail-v1`; SkyHarbor Air
  declares `core` and `airline-industry-v1`.
- Internal only: Config and verification evidence.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/config/tenants/CANONICAL_TENANTS.ts`
- `src/config/tenants/__tests__/tenant-compliance.test.ts`
- `verification/apex-foundation-training/APEX_TENANT_OVERLAY_CONFIG_2026-05-30.md`

## QA / Validation

- PASS: `npx jest src/config/tenants/__tests__/tenant-compliance.test.ts`
- PASS: Live DB contains 5,691 Apex `retail-v1` chunks.
- PASS: Section 7.1 Apex Tier-1 production Ask smoke returned 25/25.

## Rollout Plan

Merge to main. Vercel deployment is expected through the normal PR pipeline, but
no separate live data operation is needed.

## Rollback Plan

Revert this config commit. The loaded `retail-v1` chunks remain in
`enterprise_context_chunks` unless a separate data rollback deletes them.

## Audit Evidence

- Evidence report:
  `verification/apex-foundation-training/APEX_TENANT_OVERLAY_CONFIG_2026-05-30.md`
- Config test:
  `src/config/tenants/__tests__/tenant-compliance.test.ts`

## Known Gaps

The live database does not currently have a `tenant_overlay_subscriptions` table.
Section 7.2 therefore records subscription intent in canonical tenant config and
confirms live reachability through `enterprise_context_chunks`.
