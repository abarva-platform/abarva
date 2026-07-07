# 2026-06-03-modernization-pattern-pack-docs — Data-platform modernization pattern pack (docs)

## Release ID

`2026-06-03-modernization-pattern-pack-docs`

## Status

`candidate`

## Plain-English Summary

Documentation-only change. Adds the design for a corpus **Data-Platform Modernization Pattern Pack**
that lets AbarVa give a CDAO modernizing a legacy analytics estate to the Databricks Lakehouse the
"rules of the game" for an SI selection: a principled reference architecture, a standards framework
(Databricks Well-Architected 7 pillars + 7 R's dispositions) the SIs must adhere to, an independent
baseline estimate (the comparator, feeding the Moves rate-card kernel), and a weighted RFP
evaluation scorecard. Three docs: the spec (v2, healthcare/PHS anchor), industry estate profiles
(retail/Apex + airline/SkyHarbor alongside healthcare), and a Codex research+build brief. AbarVa
sits above Databricks' own conversion tooling (BladeBridge/Lakebridge) — it consumes the Analyzer
inventory, never re-scans or converts code. No runtime code, schema, or data change.

## Layer Impact

- `global-control-lane` (documentation only): engineering/design documents describing a future
  shared-platform capability. No shipped behavior, no feature gate, no runtime path touched.
- The capability these docs commission would land later as `experimental` (feature-gated /
  non-default) until built and validated.

## Client Applicability

- All clients: not yet — planning docs for a future build. Anchored on PHS (healthcare) with
  reusable retail (Apex) and airline (SkyHarbor) estate profiles. Internal engineering handoff.
  Public/demo: no. Feature flag: none.

## Changes Included

- `docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md` — framework spec (v2): archetypes +
  dispositions, Well-Architected standards, baseline estimate, weighted scorecard.
- `docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md` — healthcare/retail/airline
  estate profiles (same engine, industry-specific source systems, dispositions, compliance).
- `docs/build/CODEX-MODERNIZATION-PATTERN-PACK-BRIEF-2026-06-03.md` — research + build handoff.

## QA / Validation

- Status: **not-run** — docs only, no code changed, so unit/integration/e2e suites were not run
  (none affected). `npm run release:check`: **pass** (satisfied by this record).
- Methodology calibrated to cited Databricks sources (BladeBridge/Lakebridge, Well-Architected 7
  pillars, SAS-migration blueprint, Brickbuilder), the 7 R's taxonomy, and industry references
  (easyJet/JetBlue airline; Lakehouse-for-Retail). Codex to confirm currency at build time.

## Rollout Plan

Merge to `main`. No deploy impact (documentation).

## Rollback Plan

Revert the doc commit; no runtime or data dependency.

## Audit Evidence

- Builds on the preceding corpus-capability audit + the merged rate-card docs (PR #2917) — the
  modernization estimate feeds the rate-card kernel; the two are one program.
- All heuristics/standards carry cited sources (spec §8, profiles §D); planning-range labelling and
  honest-empty-state discipline mandated for the eventual build.

## Known Gaps

- Planning docs; the capability itself (archetype library, Analyzer-inventory intake, estimator
  binding, standards/scorecard, per-industry profiles) is the subsequent build the brief commissions.
