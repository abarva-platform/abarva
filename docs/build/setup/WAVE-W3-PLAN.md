# Setup Wave W3 Plan

## Scope

- Catalog entries: first live Microsoft Graph connector path
- Out of scope: GitHub, Anthropic, users, policies

## File-level diffs

| File | Action | Reason |
|---|---|---|
| MS Graph connector integration files | add/modify | first real connector class |
| connector health plumbing | modify | make last-auth and last-pull data visible |
| Tower integration touchpoints | verify/minor adjust | ensure downstream M365 storyline has data to consume |

## Component dependency graph

MS Graph connector -> connector health -> Setup detail surface -> Tower M365 program storyline

## Knowledge fabric contract changes

- `ConnectorHealth` becomes operational, not just schematic
- downstream consumers can trust MS Graph readiness fields

## Test plan

- `S-SMOKE-MS-GRAPH`
- connector auth and last-pull assertions
- downstream Tower sanity on the target program

## Risk & mitigation

- Risk: founder-owned secrets or tenant provisioning block the wave
- Mitigation: halt and escalate rather than faking live state

## Auto-approval claim

- depends on platform prerequisites; likely not a blind auto-merge wave without green smoke
