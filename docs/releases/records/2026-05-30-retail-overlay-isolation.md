# 2026-05-30 Retail Overlay Isolation

## Release ID

`2026-05-30-retail-overlay-isolation`

## Status

`released`

## Plain-English Summary

This release records the cross-tenant isolation check for the new retail overlay. It proves that SkyHarbor cannot retrieve Apex `retail-v1` retail chunks and Apex cannot retrieve SkyHarbor `AIR-*` airline chunks through the live Ask API.

## Layer Impact

- QA / audit layer: Adds a repeatable Section 6.5 isolation smoke and committed evidence.
- Application control lane: No runtime code change.
- Context layer: No database writes; production Ask responses are read and inspected for forbidden source IDs.

## Client Applicability

- All clients: The invariant is universal.
- Specific clients: The evidence probes Apex Retail and SkyHarbor Air.
- Internal only: Yes, validation/audit artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Script: `scripts/smoke/retail-overlay-isolation-smoke.mjs`.
- Evidence report: `verification/retail-overlay-v1/RETAIL_OVERLAY_ISOLATION_SMOKE_2026-05-30.md`.
- Evidence JSON: `verification/retail-overlay-v1/retail-overlay-isolation-smoke-2026-05-30.json`.

## QA / Validation

- Production Section 6.5 isolation smoke passed 2/2 probes against `https://app.abarva.ai`.
- SkyHarbor returned zero `retail-v1` sources.
- Apex returned zero `AIR-*` airline sources.

## Rollout Plan

Merge the evidence and script. No production deploy is required for the verification artifact.

## Rollback Plan

Revert this documentation/script PR. No application or data rollback is required.

## Audit Evidence

- Production deployment under test: `dpl_DK5mp2Yf2DFu4AVYCv2ynUfg7CBB`.
- Evidence report: `verification/retail-overlay-v1/RETAIL_OVERLAY_ISOLATION_SMOKE_2026-05-30.md`.
- Evidence JSON: `verification/retail-overlay-v1/retail-overlay-isolation-smoke-2026-05-30.json`.

## Known Gaps

This proof covers the two explicit Section 6.5 overlay directions: SkyHarbor-to-retail and Apex-to-airline. Broader 5-tenant isolation remains covered by Packet 30 Phase 6 and I9 industry-isolation regression, not by this retail-specific smoke alone.
