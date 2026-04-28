# Programs Wave P6 Plan

## Scope

- Catalog entries: interaction overlays, custom actions, transition states, upload/handoff consistency
- Out of scope: route retirement, portfolio index convergence

## File-level diffs

| File | Action | Reason |
|---|---|---|
| overlay components | modify | align interaction language and state framing |
| detail page integration | modify | keep overlay triggers consistent across phases |
| toast and feedback hooks | verify/minor adjust | preserve shipped success/failure feedback pattern |

## Component dependency graph

detail route -> action trigger -> overlay -> toast/return navigation

## Knowledge fabric contract changes

- none expected to route shape
- keep action `href` support intact for cross-surface navigation

## Test plan

- overlay visibility checks
- transition-state assertions
- `P-SMOKE-CDP` follow-through on action C and linked return path

## Risk & mitigation

- Risk: interaction affordances imply unsupported runtime actions
- Mitigation: preserve deterministic placeholders where real mutation is not wired

## Auto-approval claim

- good `Sonnet` wave if kept within current overlay surface only
