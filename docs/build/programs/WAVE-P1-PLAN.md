# Programs Wave P1 Plan

## Scope

- Catalog entries: canonical Programs route family plus legacy wrapper/deprecation layer
- Out of scope: portfolio redesign, detail content changes, new governance UI

## File-level diffs

| File | Action | Reason |
|---|---|---|
| canonical `/programs/**` route files | verify/modify | ensure they are sole source of truth |
| legacy tenant route files | wrap, redirect, or freeze | remove ambiguity without breaking access suddenly |
| route helpers / link utilities | modify | point all internal navigation at canonical routes |

## Component dependency graph

legacy tenant routes -> wrapper/deprecation decision -> canonical `/programs/**` pages -> shared Programs components

## Knowledge fabric contract changes

- none expected to provenance or graph schema
- route ownership only

## Test plan

- `P-SMOKE-CDP` must run on canonical `/programs/**` only
- legacy routes either wrap or clearly signal deprecation

## Risk & mitigation

- Risk: accidental dual-maintenance of two route families
- Mitigation: freeze new feature work in legacy paths and document every wrapper explicitly

## Auto-approval claim

- likely not auto-merge if deletions or redirects are broad; route convergence is an escalation-sensitive wave
