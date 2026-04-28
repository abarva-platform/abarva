# Setup Wave W2 Plan

## Scope

- Catalog entries: connector detail + reconnect/auth flow
- Out of scope: Microsoft Graph live ingestion, users/audit, policy system

## File-level diffs

| File | Action | Reason |
|---|---|---|
| connector detail page files | modify | align healthy/degraded/reconnect states |
| reconnect flow files | modify | normalize auth refresh posture |
| setup fixtures/read-model helpers | modify | add clearer connector health semantics |

## Component dependency graph

connectors index -> connector detail -> reconnect flow -> back to connector detail

## Knowledge fabric contract changes

- introduce or formalize `ConnectorHealth` shape in the module contract

## Test plan

- detail page render checks for healthy and degraded states
- reconnect state assertions

## Risk & mitigation

- Risk: UI claims live auth behavior that is not yet wired
- Mitigation: keep deterministic disclaimers explicit until W3

## Auto-approval claim

- good merge candidate if connector health remains declarative and route scope stays narrow
