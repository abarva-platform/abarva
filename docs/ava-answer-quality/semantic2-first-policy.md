# Semantic2-First Policy

Question routing must prefer governed semantic data before narrative chunks.

Order:

1. Semantic2 entities, facts, metrics, relationships, and read models.
2. Module read models.
3. Deterministic production views while Semantic2 rollout is in shadow mode.
4. Chunks only for narrative support or excerpts.
5. Corpus and expert packs only for Intelligence and Source.

Home must not use corpus or experts for tenant factual answers. Unsupported answers return specific gaps.

## Runtime tenant rule

Runtime answer paths may only use canonical product tenants:

- `apex-retail`
- `first-capital`
- `lakeshore-holdings`
- `meridian-health`
- `skyharbor-air`

Aliases may resolve to one of those keys, but runtime code must not persist or
answer from UUID buckets, `unknown`, archived tenants, or lab-only tenants such
as `lakefront-capital`, `northstar-clinical`, or `roosevelt-holdings`.

## Dossier rule

The current runtime dossier prompt version is
`semantic2-l3-enriched-buildtime-claude-v2`. If a matching active dossier is
missing or invalidated, the surface must not silently fall back to an older
semantic layer. It should return an honest refresh/block message or trigger the
dossier refresh path.

## Legacy semantic-layer rule

The old seed semantic tables (`semantic_metrics`, `semantic_dimensions`,
`tenant_question_readiness`, and related `semantic_*` tables) are not the
runtime answer source. They may remain only as migration/audit references until
the semantic2 migration is complete.
