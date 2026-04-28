# Intelligence Wave I5 Plan

## Scope

- Catalog entries: `INT-IDX-SOLUTIONS`, `INT-DTL-SOLUTION`, `INT-DTL-CONTRADICTION`
- Out of scope: graph browser, synthesis, quality lens

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `src/components/intelligence/SolutionsIndexPage.tsx` | modify | canonical solutions entry point already exists |
| solution fixture/read-model files | modify | support detail-state expansion |
| contradiction detail surface files | add | contradiction is not first-class yet |

## Component dependency graph

solutions index -> solution detail -> linked patterns and programs
contradiction detail -> evidence comparison -> linked patterns/programs

## Knowledge fabric contract changes

- formalize Solution and Contradiction as first-class routed primitives

## Test plan

- solutions index render
- solution detail render
- contradiction detail render
- linkage from contradiction back to affected pattern/program

## Risk & mitigation

- Risk: contradiction detail borrows too much from generic modal patterns outside Intelligence
- Mitigation: design contradiction as a primitive, not a reused alert box

## Auto-approval claim

- eligible if scoped cleanly; likely split if contradiction detail grows larger than the solutions work
