# Programs Wave P7 Plan

## Scope

- Catalog entries: cross-surface integration, linked chips, route-hint cleanup, explicit legacy retirement
- Out of scope: new flagship workflows or unrelated shell changes

## File-level diffs

| File | Action | Reason |
|---|---|---|
| shared linked-surface components | modify | normalize Programs <-> Source/Tower/Intelligence links |
| route hints / redirects | modify | complete canonical family ownership |
| legacy tenant route files | delete or redirect | retire deprecated family explicitly |

## Component dependency graph

canonical Programs routes -> linked surface chips -> cross-module destinations; legacy family -> redirect/deprecation layer

## Knowledge fabric contract changes

- no new schemas expected
- cross-surface route hints must all point at canonical live destinations

## Test plan

- full `P-SMOKE-CDP`
- legacy-route behavior verification
- linked navigation checks across Source, Tower, and Intelligence

## Risk & mitigation

- Risk: deletion-heavy route retirement breaks hidden internal entry points
- Mitigation: hold for careful review if legacy files are removed rather than wrapped

## Auto-approval claim

- likely human-review wave because route retirement is architecture-sensitive by definition
