# Programs Wave P3 Plan

## Scope

- Catalog entries: `PRG-DTL-P1`, `PRG-DTL-P2`, `PRG-DTL-P3`, `PRG-DTL-P4`
- Out of scope: future-phase P5/P6, route retirement, governance modal redesign

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `/programs/[id]` page | verify/minor adjust | keep canonical detail path stable |
| `ProgramDetailPage` and phase builders | modify | align phase-specific content to spec |
| `programs-detail-view.ts` and supporting builders | modify | preserve override behavior and flagship workbench truth |

## Component dependency graph

`/programs/[id]` -> `ProgramDetailPage` -> phase builders/read model -> overlays and linked surfaces

## Knowledge fabric contract changes

- preserve `overrideCurrentPhase`
- preserve workbench `href` actions for cross-surface links

## Test plan

- `P-SMOKE-CDP` core run: index -> flagship detail -> Build gate ribbon -> T3-H03 -> Source event link

## Risk & mitigation

- Risk: generic and flagship workbench logic diverge
- Mitigation: keep `APX_CDP_2026_P3_WORKBENCH` explicit and avoid leaking it into generic program IDs

## Auto-approval claim

- merge-safe if canonical route only and no legacy family edits are mixed in
