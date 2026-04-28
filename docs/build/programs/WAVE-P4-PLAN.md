# Programs Wave P4 Plan

## Scope

- Catalog entries: `PRG-FLW-ORIGINATE`, `PRG-DTL-P5`, `PRG-DTL-P6`
- Out of scope: route convergence, evidence/gate internals, legacy cleanup

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `ProgramOriginationPage` | modify | formalize already-shipped wizard behavior |
| future-phase builders | modify/new | make P5/P6 routes feel intentional rather than fallback-only |
| supporting fixtures | narrow updates | keep phase language consistent |

## Component dependency graph

origination route -> wizard -> canonical detail handoff -> future-phase builders

## Knowledge fabric contract changes

- no schema expansion expected
- origination continues to seed deterministic summary state only

## Test plan

- origination route render
- flagship plus one non-flagship future-phase detail check

## Risk & mitigation

- Risk: future-phase placeholders over-promise runtime capability
- Mitigation: keep deterministic disclaimers explicit and honest

## Auto-approval claim

- good `Sonnet` wave if scoped to canonical routes and current wizard only
