# Intelligence Wave I6 Plan

## Scope

- Catalog entries: `INT-FLW-SYNTHESIZE`, `INT-FLW-AUTHOR`, `INT-MOD-SUBMIT`
- Out of scope: graph browser, quality lens

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `src/components/intelligence/NexusTurn.tsx` and `formats/*` | refactor | legacy ask stack becomes canonical synthesis substrate or gets retired |
| `src/components/intelligence/IntelligenceIndexPage.tsx` | modify | submission entry point already exists |
| authoring/synthesis route files | add | first-class canonical flow pages |
| relevant lib synthesis helpers | add/modify | formalize view models and word-cap handling |

## Component dependency graph

synthesize page -> auth/query/retrieval -> response formats
author page -> submission flow -> candidate pattern detail

## Knowledge fabric contract changes

- explicit authoring intake
- explicit synthesis output guardrails
- Atlas word-cap enforcement becomes mandatory

## Test plan

- authoring route render
- synthesis route render
- submission flow state assertions
- boundary/uncertainty format behavior

## Risk & mitigation

- Risk: legacy ask stack keeps generic format sprawl alive
- Mitigation: converge on a smaller canonical synthesis surface and quarantine unused formats

## Auto-approval claim

- likely Opus-class and possibly held if model/runtime behavior changes exceed routine wave bounds
