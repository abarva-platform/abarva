# Module Context Pack Contract

Status: design baseline.

The Enterprise Knowledge Layer has one shared context-pack contract with
module-specific rules layered on top.

Every module pack carries a Claude-ready context payload. In this PR the
payload is only a design artifact. It shows the governed subset that Claude
would see later, while excluding audit-only diagnostics, inactive candidate
context unless requested, unsupported claims as facts, and source-adapter-only
facts unless requested.

## HomeKnowledgePack

Home supports executive orientation and double-click exploration.

It must answer:

- what AbarVa knows,
- why it matters,
- how it connects,
- what can be safely answered,
- what evidence supports it,
- what gaps remain,
- what evidence should be collected next.

Home must support profiles for enterprise, functions, systems, data domains,
infrastructure, vendors/contracts, programs, risks, metrics, use cases,
processes, and evidence.

## IntelligenceContextPack

Intelligence must retrieve board-quality enterprise context before Claude
synthesis. It must not answer strategy questions from generic model knowledge
alone when tenant context exists.

The pack must include relevant profiles, facts, evidence, relationship
candidates, confidence, caveats, and unsupported claims.

## MovesContextPack

Moves is phase-aware:

- P0 Intake & Decision Framing
- P1 Charter & Baseline
- P2 Diagnose & Evidence Pressure-Test
- P3 Options & Business Case
- P4 Executive Decision & Commit
- P5 Execution Handoff

For Agent Assist / Member Service, Moves must retrieve:

- member/contact center process,
- roles,
- CRM/contact center systems,
- claims/eligibility/benefits systems,
- knowledge base and transcript context,
- data platform dependencies,
- integrations,
- owners,
- metrics,
- PHI, human-in-the-loop, and audit risks,
- gaps and required evidence.

Moves decides later what becomes attached evidence. The data layer only supplies
context.

## SourceContextPack

Source must retrieve:

- vendor,
- contract,
- spend,
- supported systems,
- supported functions,
- renewal dates,
- SLA/obligations,
- sourcing levers,
- risks,
- evidence refs.

Source must not treat a vendor or savings hypothesis as validated without
evidence.

## TowerContextPack

Tower must retrieve:

- IT budget,
- run/change/transform spend,
- vendor spend,
- program budget,
- actual/forecast/budget,
- value baseline,
- metric definitions,
- measurement status,
- evidence confidence.

Hard rule: no realized value claim unless measured evidence exists. Tower values
remain deterministic and must not be calculated by Claude from graph context.
