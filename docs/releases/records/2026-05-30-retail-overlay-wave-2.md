# 2026-05-30-retail-overlay-wave-2 — Retail Overlay v1 Wave 2

## Release ID

`2026-05-30-retail-overlay-wave-2`

## Status

`candidate`

## Plain-English Summary

This release adds the second retail industry corpus wave: omnichannel through marketing. It expands the retail overlay beyond strategy and stores into order orchestration, supply chain, inventory, fulfillment, returns, customer identity, loyalty, and retail media.

## Layer Impact

- `industry-corpus-lane`: Adds Wave 2 of the `retail-v1` overlay as markdown corpus source material.
- `qa-validation-lane`: Adds a count report and manifest proving Wave 2 has the expected packs and pattern count.
- `data-plane-lane`: No database load, embedding, or tenant subscription change in this PR.
- `runtime-app-lane`: No runtime behavior changes until Section 6 loads and subscribes the overlay.

## Client Applicability

- All clients: No runtime impact yet.
- Specific clients: Apex Retail is the future subscriber for the retail overlay.
- Internal only: Source corpus artifact and verification report.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_WAVE_2_OMNI_TO_MARKETING.md`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_WAVE_2_COUNT_REPORT.md`
- `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_WAVE_2_MANIFEST.json`
- `scripts/corpus-generation/generate-retail-wave.mjs`

## QA / Validation

- PASS: Generator produced 1,265 patterns across 65 packs and 8 super-categories.
- PASS: Structural validator confirmed every pattern has Summary, Mechanism, Decision relevance, Pitfalls, Industry exemplars, and Cross-references.
- PASS: `npx eslint scripts/corpus-generation/generate-retail-wave.mjs`.
- PASS: `git diff --check`.
- PENDING: PR CI.

## Rollout Plan

Merge after CI passes. This is a corpus authoring artifact only. Runtime loading, embedding, and Apex subscription occur later in Section 6.

## Rollback Plan

Revert this PR. No runtime or data migration rollback is required.

## Audit Evidence

- Count report: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_WAVE_2_COUNT_REPORT.md`
- Manifest: `verification/retail-overlay-v1/RETAIL_OVERLAY_v1_WAVE_2_MANIFEST.json`
- Overlay file: `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_WAVE_2_OMNI_TO_MARKETING.md`

## Known Gaps

Waves 3-5 are still pending. This wave is not loaded into Azure or subscribed by Apex yet.
