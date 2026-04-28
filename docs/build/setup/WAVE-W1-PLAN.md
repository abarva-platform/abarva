# Setup Wave W1 Plan

## Scope

- Catalog entries: `SET-IDX-CONN`
- Out of scope: live connector ingestion, users, policies, audit persistence

## File-level diffs

| File | Action | Reason |
|---|---|---|
| `/admin/connectors` route and page files | modify | make canonical ownership explicit |
| any duplicated connector entry points | freeze or wrap | avoid dual-maintenance with platform-admin family |
| connector fixture/read-model helpers | narrow updates | align connector card language to target taxonomy |

## Component dependency graph

`/admin/connectors` -> connectors index page -> connector seed/read-model -> detail route links

## Knowledge fabric contract changes

- no live connector health yet
- route ownership only

## Test plan

- connectors index render check
- canonical route ownership assertions

## Risk & mitigation

- Risk: connector work spills into `/platform/admin/**`
- Mitigation: declare `/admin/**` as canonical in the plan and freeze feature work elsewhere

## Auto-approval claim

- suitable low-risk wave if kept strictly to canonical connector entry points
