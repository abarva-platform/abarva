# 2026-05-30-retail-overlay-consolidated — Retail Overlay v1 Consolidation

## Release ID

`2026-05-30-retail-overlay-consolidated`

## Status

`candidate`

## Plain-English Summary

This release consolidates the five Retail Overlay v1 authoring waves into one canonical corpus artifact. In practical terms, Apex Retail now has a complete retail source corpus ready for the next stage: loading, embedding, and tenant subscription.

## Layer Impact

- `industry-corpus-lane`: Adds the consolidated `retail-v1` source corpus built from Waves 1-5.
- `qa-validation-lane`: Adds a consolidated count report and manifest proving the overlay clears the backlog target.
- `data-plane-lane`: No database load, embedding, or tenant subscription change in this PR.
- `runtime-app-lane`: No runtime behavior changes until Section 6 loads and subscribes the overlay.

## Client Applicability

- All clients: No runtime impact yet.
- Specific clients: Apex Retail is the future subscriber for the retail overlay.
- Internal only: Source corpus artifact and verification report.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_CONSOLIDATED.md`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_CONSOLIDATED_COUNT_REPORT.md`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_CONSOLIDATED_MANIFEST.json`
- `scripts/corpus-generation/consolidate-retail-overlay.mjs`

## QA / Validation

- PASS: Consolidation script counted 5,390 pattern entries across Waves 1-5.
- PASS: Consolidation script counted 301 packs across the five manifests.
- PASS: Consolidation script counted 60 super-categories across the five manifests.
- PASS: `npx eslint scripts/corpus-generation/consolidate-retail-overlay.mjs`.
- PASS: `git diff --check`.
- PENDING: PR CI.

## Rollout Plan

Merge after CI passes. This is a corpus source artifact only. Runtime loading, embedding, and Apex subscription occur in Section 6.

## Rollback Plan

Revert this PR. No runtime or data migration rollback is required.

## Audit Evidence

- Count report: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_CONSOLIDATED_COUNT_REPORT.md`
- Manifest: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_CONSOLIDATED_MANIFEST.json`
- Consolidated overlay: `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_CONSOLIDATED.md`
- Generator: `scripts/corpus-generation/consolidate-retail-overlay.mjs`

## Known Gaps

The consolidated overlay is not yet loaded into Azure, embedded, or subscribed by Apex. That is the next Section 6 milestone.
