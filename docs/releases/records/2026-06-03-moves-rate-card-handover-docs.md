# 2026-06-03-moves-rate-card-handover-docs — Moves rate-card spec + Codex brief (docs only)

## Release ID

`2026-06-03-moves-rate-card-handover-docs`

## Status

`candidate`

## Plain-English Summary

Documentation-only change. Adds two planning artifacts for the Moves cost/sourcing rate-card
capability: (1) a canonical **ingestion spec** defining the corpus objects (internal loaded-cost
rate card, vendor/SI rate card, geo-modifier reference), the server-side compute rules, validation,
and the role-constant sourcing-comparison contract; and (2) a **Codex research + build brief** that
hands off the work (research real rates + build the corpus segment, geo extension, estimator
binding, and Data Loads ingestion). No runtime code, schema, or data changes. The companion
workbook template is a separate non-repo handoff artifact.

## Layer Impact

- `global-control-lane` (documentation only): engineering handoff / design documents describing a
  future shared-platform capability. No shipped behavior, no feature gate, no runtime path touched.
- The capability these docs commission would land later as `experimental` (feature-gated /
  non-default) until built and validated.

## Client Applicability

- All clients: not yet — these are planning docs for a future build. Internal only (engineering
  handoff). Public/demo: no. Feature flag: none.

## Changes Included

- `docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md` — authoritative ingestion contract.
- `docs/build/CODEX-MOVES-RATE-CARD-RESEARCH-BUILD-BRIEF-2026-06-03.md` — research + build handoff.

## QA / Validation

- Status: **not-run** — docs only, no code changed, so unit/integration/e2e suites were not run
  (none affected). `npm run release:check`: **pass** (satisfied by this record).
- Spec/brief reference verified-existing file anchors (rate-card kernel, effort estimator, setup
  data broker, Data Loads surface) confirmed during the preceding capability audit.

## Rollout Plan

Merge to `main`. No deploy impact (documentation).

## Rollback Plan

Revert the doc commit; no runtime or data dependency.

## Audit Evidence

- Preceding corpus-capability audit (this session) established the as-is state the spec/brief build
  on: estimator has a researched benchmark rate card + client-override hooks; corpus lacks internal
  rate-card intake + state/city geo; those are the gaps the brief closes.
- Companion template workbook (`Moves_Sourcing_Pricing_RateCards_v2.xlsx`) is a non-repo handoff
  artifact (binary; not committed).

## Known Gaps

- These are planning docs; the capability itself (corpus segments, geo extension, estimator
  binding, ingestion) is the subsequent build the brief commissions.
