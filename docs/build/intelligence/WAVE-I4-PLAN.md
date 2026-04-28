# Intelligence Wave I4 Plan

## Scope

- Catalog entry: `INT-IDX-GRAPH`
- Out of scope: library, detail, solutions, synthesis

## File-level diffs

| File | Action | Reason |
|---|---|---|
| graph browser page/component files | add | render graph navigation UI |
| `src/lib/intelligence/pattern-graph-validation.ts` | verify/minor support | expose browser-safe summary data if needed |
| `src/lib/intelligence/pattern-deliverable-query.ts` | verify/minor support | preserve link resolution between nodes and routes |

## Component dependency graph

graph route -> graph read model -> canvas -> selected node panel -> route hops

## Knowledge fabric contract changes

- no new primitive type
- read access to existing pattern/program/deliverable graph edges

## Test plan

- graph page render
- node selection
- route hops from node panel into canonical detail pages
- graph summary matches current edge-count baseline

## Risk & mitigation

- Risk: graph UI ships before there is enough navigable density
- Mitigation: use current validated counts as explicit readiness threshold and hold if data quality regresses

## Auto-approval claim

- likely human-reviewed if graph browser introduces large net-new UI surface or heavy client interaction
