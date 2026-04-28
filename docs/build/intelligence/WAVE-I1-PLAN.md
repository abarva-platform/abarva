# Intelligence Wave I1 Plan

## Scope

- Catalog entries: `INT-IDX-DEFAULT`, `INT-IDX-FILTERED-M`, `INT-IDX-FILTERED-T1`, `INT-IDX-FILTERED-T3`, `INT-IDX-FILTERED-INREVIEW`
- Out of scope: pattern detail, signals, graph browser, solutions, synthesis

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `src/components/intelligence/IntelligenceIndexPage.tsx` | modify | converge default and filtered states |
| `src/components/intelligence/SentinelActivePatterns.tsx` | modify | align active detections with library framing |
| `src/lib/intelligence/shell-intelligence-fixture.ts` | modify | stabilize filter and row copy |
| `src/app/intelligence/page.tsx` | verify/minor adjust | ensure canonical library route owns index state |

## Component dependency graph

`/intelligence` route -> `IntelligenceIndexPage` -> fixture/read model -> row/filter components

## Knowledge fabric contract changes

- none to graph schema
- no new query surface
- library state stays deterministic for I1

## Test plan

- route render smoke for `/intelligence`
- filter-state assertions for the five index variants
- no provenance ribbon expectation yet

## Risk & mitigation

- Risk: duplicate ownership between `IntelligenceIndexPage` and `SentinelActivePatterns`
- Mitigation: pick one canonical index surface and demote the other to support role

## Auto-approval claim

- eligible after I0 if PR size stays under tier cap and no new route family is introduced
