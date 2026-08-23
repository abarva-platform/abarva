# AI Opportunity Expert Pack Corpus

## Purpose

The AI Opportunity Expert Pack Corpus is AbarVa's reusable consulting knowledge
layer for Process Intelligence and AI Opportunity Discovery. Tenant evidence
shows what is happening for a client. Expert packs explain how to interpret that
evidence, what automation archetypes are plausible, what controls are required,
how to estimate value, and how to frame a pilot roadmap.

## Boundary

Expert packs are AbarVa knowledge assets, not client evidence. They may guide
interpretation, recommendations, architecture, roadmap, and business-case
structure only when the answer clearly separates:

- tenant facts and source citations
- expert-pattern interpretation
- assumptions and caveats
- missing evidence or client-to-complete fields

## Required Domains

The first corpus slice includes structured packs for:

- ITSM / ServiceNow process intelligence
- Jira / delivery intelligence
- Observability / app operations
- Process mining / process reengineering
- AI automation opportunity archetypes
- Human-agent operating model
- AI governance / risk / control
- AI opportunity architecture
- Value / ROM estimation
- 90-day pilot roadmap

## Retrieval Model

The runtime selector binds packs using:

- move archetype
- loaded source systems
- tenant evidence availability
- user question
- artifact type
- opportunity category
- detected patterns

Examples:

- ServiceNow or ticket evidence binds the ITSM pack.
- Jira evidence binds the delivery intelligence pack.
- Logs or observability evidence binds the observability pack.
- Process observations bind the process mining pack.
- AI Opportunity Discovery binds the archetype, human-agent, governance,
  architecture, value, and roadmap core packs.
- P3 Architecture binds the architecture pack.
- P4 Business Case binds the value / ROM pack.

## Data Plane

The additive migration creates:

- `ai_opportunity_expert_packs`
- `ai_opportunity_expert_pack_patterns`
- `ai_opportunity_expert_pack_archetypes`
- `ai_opportunity_expert_pack_metrics`
- `ai_opportunity_expert_pack_controls`
- `ai_opportunity_expert_pack_architecture_patterns`
- `ai_opportunity_expert_pack_roadmap_patterns`
- `ai_opportunity_expert_pack_estimate_models`
- `ai_opportunity_expert_pack_usage_refs`

Authored source remains in git. Postgres is the retrievable read model.

## Next Runtime Step

The next implementation slice should load these packs through the private VNet
data-plane path, then bind `buildOpportunityExpertContext(...)` into:

- Moves AI Opportunity Discovery artifacts
- Intelligence/aVa advisor answers
- semantic-layer opportunity scoring
- process-intelligence reports

No front-end surface should treat expert pack content as tenant evidence.
