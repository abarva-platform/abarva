# ADR-0010 - Software Delivery and AI-Led Dev Corpus Wave

## Status

Accepted

## Date

2026-06-03

## Context

AbarVa already treats the knowledge corpus as governed product infrastructure,
not as ad hoc prompt text. The current repository includes a canonical pattern
storage decision, corpus release manifest tooling, agent-quality training
material, and an AI-led product-development source pack.

Verified repo facts:

- `docs/architecture/adr/0001-canonical-pattern-storage.md` defines
  `corpus_patterns` as the canonical destination for shared pattern storage.
- `docs/knowledge-corpus/releases/README.md` and
  `scripts/corpus/release-manifest.mjs` define a release-manifest process for
  versioning committed corpus inputs with checksums.
- `docs/source-material/intelligence-pack/02-ai-led-pdlc.md` already contains
  source material for AI-led product-development and software-delivery
  operating patterns.
- `docs/agent-training/EXPERT_TRAINING_SYSTEM.md` defines expert-grade answer
  expectations, including grounding in tenant context, industry corpus, and AI
  ecosystem evidence.
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md` requires
  app-tier AI and retrieval paths to use the AgentContextBroker boundary.
- `docs/architecture/adr/ADR-0006-ai-as-advisor.md` requires AbarVa to remain
  decision support, not an autonomous decision-maker.

Backlog row T281 asks whether AbarVa should build a "Software Delivery /
AI-Led Dev" corpus wave. The decision needs to be durable before T282 scopes
the actual wave.

## Decision

AbarVa will build a governed Software Delivery / AI-Led Dev corpus wave.

The wave is accepted as a shared, non-tenant-confidential industry corpus asset
for executive technology, operating-model, and AI-delivery conversations. It
must be built through the existing corpus governance path: source materials,
pattern authoring, manifest/checksum generation, retrieval validation, release
record, and quality evaluation.

The wave must not be treated as client private data. Client-specific code,
roadmaps, incident details, architecture diagrams, delivery metrics, or
enterprise documents belong in the client data plane and must remain scoped to
one client. Shared corpus content may describe generalized delivery patterns,
failure modes, operating models, controls, and benchmarks.

The T281 completion boundary is the decision itself. T282 owns the follow-on
scope: pattern taxonomy, source list, authoring plan, validation harness,
release manifest, and any product surfacing.

## Consequences

- AbarVa can answer CIO/CTO/CDAO questions about AI-led delivery with more
  specific evidence than a generic industry corpus would provide.
- Sentinel, Atlas, Nexus, Source, and Tower can eventually retrieve delivery
  patterns through the broker boundary without changing the tenant data
  boundary.
- Corpus quality work must include hallucination controls: pattern provenance,
  citation-ready source metadata, answer-quality evals, and refusal behavior
  for questions outside the product's business-domain scope.
- Shared delivery content must avoid embedding customer-private code,
  architecture, credentials, tickets, incidents, or performance data.
- T282 must define the taxonomy before implementation. A suggested first-pass
  taxonomy is:
  - AI delivery operating model
  - agentic software-development lifecycle
  - architecture governance and ADR hygiene
  - platform engineering and developer experience
  - product delivery metrics and value realization
  - quality engineering, evals, and release controls
  - security, privacy, and compliance for AI-assisted delivery
  - vendor/tooling landscape and build-vs-buy patterns
- The corpus must remain advisory. It can recommend considerations and cite
  patterns, but a human owner must approve consequential delivery,
  procurement, staffing, security, or production-release decisions.

## Alternatives

- Do not build this wave. Rejected because the repository already has relevant
  source material and the product increasingly needs a credible enterprise
  technology-delivery corpus for CXO conversations.
- Build it as private client corpus only. Rejected because generalized delivery
  patterns are reusable across clients, while client-specific details must stay
  in the client data plane.
- Build it directly into prompts. Rejected because prompt-only knowledge is not
  versioned, checksumed, or auditable through the corpus release path.
- Build the entire corpus before a decision record. Rejected because T281 is a
  decision gate and T282 is the implementation-scope gate.

## References

- `docs/architecture/adr/0001-canonical-pattern-storage.md`
- `docs/knowledge-corpus/releases/README.md`
- `scripts/corpus/release-manifest.mjs`
- `docs/source-material/intelligence-pack/02-ai-led-pdlc.md`
- `docs/agent-training/EXPERT_TRAINING_SYSTEM.md`
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`
- `docs/architecture/adr/ADR-0006-ai-as-advisor.md`
