# 2026-06-13-airline-irops-function-pack — airline IROPS-recovery Domain Function Pack

## Release ID

`2026-06-13-airline-irops-function-pack`

## Status

`candidate`

## Plain-English Summary

The Moves E2E audit (PR #3459) found Source green but Moves blocked: a SkyHarbor
`GLOBAL_NETWORK_AIRLINE` Move had zero generate candidates because no airline
Function Pack existed and the industry code mapped to no `industryKey`. This adds
the missing honest pack — the 37th Domain Function Pack — for airline irregular-
operations (IROPS) recovery & customer care, grounded in the IROPS domain (no
fabricated client facts; every benchmark a labelled planning range with a basis).

It maps the `global_network_airline` industry code to a new `airline` industryKey
so origination's classifier can resolve and persist the function key. A freshly
originated airline IROPS Move now classifies → binds the pack → produces generate
candidates. The audit's blocked Move predated the pack; a rerun originates fresh
and auto-binds (no fabricated manual binding).

## Layer Impact

- `global-control-lane`: new curated Function Pack + the airline industry key and
  industry-code mappings. No schema, no API, no runtime model change.

## Client Applicability

- All clients: additive. Specific: unblocks airline/IROPS Moves (e.g. SkyHarbor).
  Feature flag: none.

## Changes Included

- `expert-kernel/domain/function-pack-types.ts`: add `airline` industryKey + `AirlineFunctionKey`.
- `expert-kernel/domain/airline/irops-recovery.ts` (NEW): the 8-layer pack — 11 operating metrics, 6 pain themes, 5 AI archetypes, 4 reference patterns, value model, vocabulary, 4 deliverable outlines, 4 evidence anchors.
- `expert-kernel/domain/function-pack-registry.ts`: register the pack.
- `function-identity.ts`: map `global_network_airline` / `airline` / `air_transport` / `aviation` → `airline`.
- Total `Record<FunctionPackIndustryKey,…>` maps that are intentionally production-spine-only made `Partial` (decision route + its test, corpus battery) since airline is a catalogued pack but not a seeded decision-home / grounding-harness industry yet; the registry "known verticals" test now includes `airline`.
- Tests: `airline-irops-recovery.test.ts` (resolution, depth minimums, planning-range benchmarks, industry-code mapping, IROPS classification, end-to-end identity).

## QA / Validation

- `tsc --noEmit` clean; eslint clean. New + affected suites pass (airline, function-pack-registry incl. verticals, function-identity, corpus-grounding, route-spine).
- Two origination suites (`origination-submit-contract`, `ProgramOriginationWorkspace`) fail **identically on clean `main`** (stash-verified, 6 failed/7 passed) — pre-existing (stale source-contract substrings + a `useRouter`-not-mounted harness artifact), unrelated to this change.

## Rollout Plan

Merge and deploy. Additive; no migration. A freshly originated airline IROPS Move auto-classifies + binds; the rerun crawl proves Moves P0→P5 generate/approve/lineage.

## Rollback Plan

Remove the pack from the registry + the industry mappings; additive and inert otherwise.

## Audit Evidence

- Branch: `feat/airline-irops-function-pack`. Follows the Moves block in the E2E audit (PR #3459).

## Known Gaps

- The airline pack is not yet in the corpus grounding battery or the decision-home spine (no seeded tenant substrate/metrics for airline); it is covered by its own dedicated pack test. Adding airline to those harnesses is a follow-up once an airline tenant has audited substrate.
