# 2026-08-31-source-intelligence-home-page-packets — Source Intelligence Home Page Packets

## Release ID

`2026-08-31-source-intelligence-home-page-packets`

## Status

`candidate`

## Plain-English Summary

Adds a builder that turns accepted source-intelligence artifacts into page-specific Home context
packets and prompt envelopes. Each Home page receives the relevant source-family summaries, evidence
hashes, row counts, and a writer lens suited to that page, so executive pages can be business-led
while architecture and data pages can be written from a technologist's perspective.
The packets also carry candidate canvases, tables, charts/diagrams, drilldowns, and a full source
index so a page can become a professional multi-canvas experience rather than a single scroll of
prose.

## Layer Impact

Affected lane: `global-control-lane`.

- `Layer 1 - Client Intake`: no direct source-file mutation.
- `Layer 2 - Source Adapters`: assembles accepted source-intelligence artifacts into Home page
  packets.
- `Layer 3 - Canonical Enterprise Model`: no canonical table mutation.
- `Layer 4 - Products`: no product runtime mutation; this produces build artifacts for future Home
  narrative generation.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: applies to internal build tooling for Home context preparation.
- Public/demo only: supports synthetic demo Home page context preparation.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_source_intelligence_home_packets.mjs`
- `scripts/ecl/__tests__/run-source-intelligence-home-packets-tests.mjs`
- `docs/architecture/SOURCE_DERIVED_INTELLIGENCE_LAYER_2026_08_31.md`
- `package.json` scripts:
  - `ecl:source-intelligence:home-packets`
  - `test:ecl-source-intelligence-home-packets`

## QA / Validation

- Pass: `npm run test:ecl-source-intelligence-home-packets`
- Pass: Home page-packet mock run over the current synthetic source-intelligence proof package.

## Rollout Plan

Merge to main only. There is no Azure Container Apps rollout, migration apply, traffic shift,
feature flag, or data-plane mutation in this slice.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this does not affect runtime routes.

## Rollback Plan

Revert the commit. No data-plane or product-runtime state is changed.

## Audit Evidence

- Unit proof: `npm run test:ecl-source-intelligence-home-packets`
- Packet proof: `/tmp/source-intelligence-home-packets-20260831/manifest.json`
- Download artifact: generated locally for operator inspection; not committed to the public repo.

## Known Gaps

This slice does not call Claude, write accepted Home narrative rows, update ECL, redesign the Home
renderer, deploy runtime code, or mutate Azure data. It prepares page-specific prompt context for
that later generation step.
