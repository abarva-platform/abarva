# Programs Wave P2 Plan

## Scope

- Catalog entries: `PRG-IDX-DEFAULT`, `PRG-IDX-LINKED`, index empty/filtered states
- Out of scope: detail route logic, gate modals, origination

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `/programs` route and index page files | modify | align portfolio to canonical shell spec |
| portfolio row/filter helpers | modify | normalize linked-state and empty-state behavior |
| supporting fixtures/read-model files | narrow updates | ensure index reflects current APX-CDP-2026 truth |

## Component dependency graph

`/programs` -> index page -> filter/read-model helpers -> portfolio rows and empty states

## Knowledge fabric contract changes

- no new query surface
- linked Source/Tower hints remain read-only and deterministic

## Test plan

- index render and filtered-state assertions
- `P-SMOKE-CDP` starts from `/programs` and must keep flagship row integrity

## Risk & mitigation

- Risk: stale fixture language reintroduces P2-era copy
- Mitigation: keep APX-CDP-2026 at P3 Design and verify every linked label from one fixture source

## Auto-approval claim

- good `Sonnet` wave if PR stays under line cap and route family remains untouched
