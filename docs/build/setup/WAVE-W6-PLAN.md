# Setup Wave W6 Plan

## Scope

- Catalog entries: policies, tenant, governance architecture
- Out of scope: live connector integrations outside previously shipped classes

## File-level diffs

| File | Action | Reason |
|---|---|---|
| policies page and review modal | modify | formalize governance review posture |
| tenant and architecture surfaces | modify | align control-plane narrative |
| supporting fixtures | narrow updates | keep governance states consistent |

## Component dependency graph

policies route -> review modal; tenant/architecture routes -> governance detail surfaces

## Knowledge fabric contract changes

- no new connector classes expected
- governance metadata may be refined, but should stay deterministic until backed

## Test plan

- policies page and modal render checks
- tenant/governance route sanity

## Risk & mitigation

- Risk: governance surfaces drift into generic platform admin work
- Mitigation: keep Setup scoped to data trust, connector control, and operator governance

## Auto-approval claim

- merge-safe if route scope stays inside canonical Setup surfaces
