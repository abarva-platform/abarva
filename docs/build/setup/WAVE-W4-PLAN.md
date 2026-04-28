# Setup Wave W4 Plan

## Scope

- Catalog entries: `T-GITHUB` and `T-ANTHROPIC` connector classes
- Out of scope: policy system, users/audit, route-family cleanup outside connectors

## File-level diffs

| File | Action | Reason |
|---|---|---|
| connector registry/fixtures | modify | add GitHub and Anthropic classes |
| connector detail surfaces | modify | reflect class-specific scopes and auth states |
| any downstream usage summaries | verify/minor adjust | ensure Tower/Programs references align to new telemetry |

## Component dependency graph

connectors index -> connector detail -> health/scope -> downstream telemetry consumers

## Knowledge fabric contract changes

- extend `ConnectorHealth` usage across additional classes
- no route-family change

## Test plan

- render checks for GitHub and Anthropic connectors
- health-field assertions for each class

## Risk & mitigation

- Risk: class-specific auth copy diverges from real capabilities
- Mitigation: keep scope labels typed and factual, not promotional

## Auto-approval claim

- good merge candidate if each connector class is isolated and seeded/live distinctions are explicit
