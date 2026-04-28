# Intelligence Wave I3 Plan

## Scope

- Catalog entries: `INT-IDX-SIGNALS`, `INT-DTL-SIGNAL`
- Out of scope: graph browser, synthesis, quality lens

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `src/components/intelligence/IntelligenceWorkflowCanvas.tsx` | refactor or replace | current signal-adjacent canvas is not a full signal stream |
| `src/components/intelligence/SentinelInteractionRail.tsx` | modify | reuse for recent-signal rail content |
| `src/lib/intelligence/*retrieval*` | wire/read-only adjust | consume first live ingestion source |
| new canonical signal pages/components | add | first-class signal index and detail |

## Component dependency graph

signal route(s) -> signal read model -> rail + stream/detail cards -> linked patterns

## Knowledge fabric contract changes

- first meaningful signal primitive surface
- depends on Setup W3 or equivalent first live connector

## Test plan

- signal stream route render
- signal detail route render
- linked downstream pattern visibility
- freshness and source metadata assertions

## Risk & mitigation

- Risk: building signal UI on seeded-only data makes the wave feel fake
- Mitigation: gate merge on at least one live ingestion-backed storyline or clearly mark seeded-only mode

## Auto-approval claim

- not auto-eligible if live connector availability is missing; escalate instead of faking signal freshness
