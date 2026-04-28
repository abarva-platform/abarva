# Programs Wave P5 Plan

## Scope

- Catalog entries: gate ribbon, gate approval modal, evidence drawer, contradiction/evidence linkage surfaces
- Out of scope: route convergence, origination, cross-surface retirement

## File-level diffs

| File | Action | Reason |
|---|---|---|
| gate ribbon and modal components | modify | normalize governance posture and copy |
| evidence-linked components | modify | align provenance-ready behavior |
| detail page integration points | modify | ensure the P3 Build gate story stays coherent |

## Component dependency graph

Program detail -> gate state -> modal/evidence surfaces -> toast and linked follow-up actions

## Knowledge fabric contract changes

- provenance props should be explicit where evidence is visible
- no hidden mutation beyond current deterministic/runtime split

## Test plan

- gate-pending render checks
- approval modal deterministic path
- `P-SMOKE-CDP` must keep the visible `2 of 5` Build gate state

## Risk & mitigation

- Risk: governance UI copy drifts from the real seeded state
- Mitigation: anchor all gate text to fixture/read-model values, not hardcoded prose

## Auto-approval claim

- likely merge-safe if evidence work does not broaden into route cleanup
