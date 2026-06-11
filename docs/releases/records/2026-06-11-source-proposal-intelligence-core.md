# 2026-06-11-source-proposal-intelligence-core — Proposal Intelligence strategy + core models

## Release ID

`2026-06-11-source-proposal-intelligence-core`

## Status

`candidate`

## Plain-English Summary

First two steps of the Vendor Proposal Intelligence capability (post-RFP: intake → health
→ normalization → scoring → levers → BAFO). Ships (1) the thought-leadership strategy —
AbarVa is the intelligence layer, not a procurement portal; client/procurement upload
first; build-vs-reuse grounded in an audit of the existing machinery (pricing-submissions,
proposal-normalization, trap-log, BAFO pack, scorecard) — and (2) the core engine library:
governed evaluator scoring (AI suggests, human decides, overrides reasoned, locks named),
an honest negotiation-levers engine (quantified ranges only with evidence; otherwise
"opportunity to test"), a deterministic proposal-health scaffold (completeness, gaps,
red flags, drafted clarification questions), and structural vendor isolation with a
provable per-output trace.

## Layer Impact

- `global-control-lane`: docs + pure library `src/lib/source/proposal-intelligence/`
  (types, scoring, levers, health, isolation). No schema change; no runtime caller yet.

## Client Applicability

- All clients when wired (Steps 3–5: engines via the governed orchestrator, workbooks +
  UI tabs, SkyHarbor live proof).

## Changes Included

- `docs/source/SOURCE_VENDOR_RESPONSE_AND_PROPOSAL_INTELLIGENCE_STRATEGY.md`
- `src/lib/source/proposal-intelligence/{types,scoring,levers,health,isolation,index}.ts`
- 12 unit tests.

## QA / Validation

- `jest proposal-intelligence` 12/12 (AI-never-final, override-reason, lock/unlock rules,
  weighted totals over locked finals only; evidenced-vs-opportunity-to-test levers; health
  completeness/readiness; isolation detection + trace assertions).
- `tsc` clean (scoped) · `eslint` clean · `release:check` pass · `architecture-rules` 0.

## Rollout Plan

Squash-merge; ships with next image roll (inert until Step 3 wires engines).

## Rollback Plan

Revert; pure library + docs.

## Known Gaps

- Engines (governed narrative health/normalization via the orchestrator), workbooks/UI,
  intake route, and the SkyHarbor 3-vendor live proof are Steps 3–5 of this program.

## Audit Evidence

Tests above; the strategy doc records the existing-asset audit with paths.
