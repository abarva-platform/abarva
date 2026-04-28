# Setup Wave W5 Plan

## Scope

- Catalog entries: users, invite, audit
- Out of scope: connectors live ingestion, policy architecture decisions

## File-level diffs

| File | Action | Reason |
|---|---|---|
| users page and invite flow | modify | align access-control language and role states |
| audit page files | modify | make governance trail clearer and more canonical |
| supporting fixtures | narrow updates | keep operator narrative consistent |

## Component dependency graph

users route -> invite flow; audit route -> seeded governance timeline

## Knowledge fabric contract changes

- no connector schema changes
- audit trail semantics should be clearer even if still seeded

## Test plan

- render checks for users and invite states
- audit list assertions

## Risk & mitigation

- Risk: seeded audit data gets mistaken for runtime persistence
- Mitigation: keep deterministic posture explicit in copy

## Auto-approval claim

- strong low-risk wave if limited to current Setup component family
