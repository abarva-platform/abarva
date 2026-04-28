# Intelligence Wave I7 Plan

## Scope

- Catalog entry: `INT-LNS-QUALITY`
- cross-surface auto-surfacing hooks into Programs, Source, and Tower
- Out of scope: new connector classes, non-Intelligence module rewrites

## File-level diffs

| File | Action | Reason |
|---|---|---|
| quality-lens page/component files | add | first-class module health surface |
| provenance/coverage summary helpers | add | quality metrics source of truth |
| cross-surface link hooks | modify | expose quality state where relevant |

## Component dependency graph

quality lens -> coverage/freshness/contradiction summaries -> cross-surface hooks

## Knowledge fabric contract changes

- formal quality metrics for freshness, coverage, contradiction density, provenance completeness

## Test plan

- quality lens render
- coverage metric assertions
- contradiction density and freshness indicators
- at least one cross-surface visibility assertion

## Risk & mitigation

- Risk: quality lens becomes a vague dashboard disconnected from real contracts
- Mitigation: tie every metric to an explicit source object or graph summary

## Auto-approval claim

- likely eligible only after I1-I6 stabilize; this is the capstone wave, not an early bootstrap candidate
