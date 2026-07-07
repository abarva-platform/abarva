# Software Delivery / AI-Led Dev Corpus Scope

Backlog row: T282

Status: scoped for execution

Decision dependency: `docs/architecture/adr/ADR-0010-software-delivery-ai-led-dev-corpus-wave.md`

## Purpose

This document scopes the Software Delivery / AI-Led Dev corpus wave accepted in
ADR-0010. It defines the taxonomy, source rules, pattern structure, validation
gates, and rollout boundaries required before authoring or loading corpus rows.

This is a shared industry corpus wave. It is not a client private data load.

## Product Questions This Wave Should Answer

The wave should help AbarVa answer executive questions such as:

- Where should AI agents fit in the software delivery lifecycle?
- How should a CIO or CTO measure agent productivity without hiding quality
  debt?
- What operating-model changes are required before scaling agentic delivery?
- What governance, release, and validation controls prevent agent-generated
  work from compounding risk?
- How should platform engineering, security, product, architecture, and finance
  teams coordinate AI-assisted delivery?
- Which signals indicate context debt, specification debt, validation debt, or
  senior-bench decay?

The wave should not answer general world history, current affairs, politics,
medical advice, legal advice, or questions unrelated to enterprise AI and
business-delivery decisions.

## Corpus Boundary

Allowed shared-corpus material:

- generalized delivery operating models;
- reusable AI-led software-delivery patterns;
- failure modes, anti-patterns, and risk signals;
- executive diagnostic questions;
- non-confidential benchmark ranges with provenance;
- vendor/tooling categories and selection criteria;
- governance, quality, security, privacy, and release-control patterns.

Disallowed shared-corpus material:

- customer source code, tickets, incidents, pull requests, commit history, or
  architecture diagrams;
- client-specific roadmap, staffing, cost, quality, uptime, or productivity
  data;
- credentials, secrets, tenant identifiers, emails, logs, or support transcripts;
- private evaluation results from a customer environment;
- any content that should live in the client data plane.

If private client material is useful for one client, it belongs in that
client's private data plane and must remain scoped to one client and one client
only.

## Seed Source Inventory

Verified repo sources available now:

| Source                                                                       | Use                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `docs/source-material/intelligence-pack/02-ai-led-pdlc.md`                   | Primary seed source: AI-Led PDLC umbrella plus child patterns. |
| `docs/architecture/adr/ADR-0010-software-delivery-ai-led-dev-corpus-wave.md` | Accepted decision and boundary.                                |
| `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`            | Retrieval boundary: product surfaces must use the broker.      |
| `docs/architecture/adr/ADR-0006-ai-as-advisor.md`                            | Responsible AI boundary: advisory, human-approved decisions.   |
| `docs/agent-training/EXPERT_TRAINING_SYSTEM.md`                              | Expert-grade answer expectations and eval thresholds.          |
| `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md`                         | Provenance and versioning expectations.                        |
| `docs/knowledge-corpus/CURATION_PIPELINE.md`                                 | Curation workflow expectations.                                |
| `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`                           | Pattern schema and storage vocabulary.                         |
| `scripts/corpus/release-manifest.mjs`                                        | Manifest and checksum process.                                 |

External sources may be added only after a source manifest is created with:

- owner;
- source URL or document location;
- license/usage status;
- publication date or refresh date;
- extraction method;
- quality tier;
- reviewer;
- reason the source is safe for shared corpus use.

Do not use anonymous scraped content or private customer artifacts as shared
corpus sources.

## Taxonomy

Initial taxonomy:

| Domain                               | Description                                                                             | Example pattern IDs                     |
| ------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------- |
| `ai_delivery_operating_model`        | Org design, roles, funding, governance, and operating rhythm for AI-led delivery.       | `pattern_ai_delivery_operating_model_*` |
| `agentic_pdlc`                       | How agent work enters discovery, specs, coding, review, release, and support.           | `pattern_agentic_pdlc_*`                |
| `specification_quality`              | Spec debt, requirements granularity, acceptance criteria, and human-agent task framing. | `pattern_specification_quality_*`       |
| `validation_and_quality_engineering` | Test strategy, evals, CI gates, review automation, defect escape controls.              | `pattern_validation_quality_*`          |
| `context_as_code`                    | Agent context ownership, freshness, codebase indexes, ADR hygiene, prompt surfaces.     | `pattern_context_as_code_*`             |
| `platform_engineering`               | Developer experience, golden paths, internal platforms, templates, paved roads.         | `pattern_platform_engineering_*`        |
| `security_privacy_compliance`        | Secure SDLC, secrets, data handling, audit trails, AI governance, policy controls.      | `pattern_ai_delivery_security_*`        |
| `value_measurement_finops`           | Productivity, cost per outcome, rework, cycle time, incident cost, model/tool spend.    | `pattern_delivery_value_*`              |
| `talent_and_apprenticeship`          | Senior bench, skill formation, review culture, delegation boundaries.                   | `pattern_ai_delivery_talent_*`          |
| `vendor_and_tooling_landscape`       | Tool categories, build-vs-buy, rationalization, procurement and risk evaluation.        | `pattern_delivery_tooling_*`            |

## Pattern Structure

Every authored pattern must include:

- stable `pattern_id`;
- domain from the taxonomy above;
- short executive title;
- summary;
- business problem;
- signals/triggers;
- diagnostic questions;
- interventions;
- anti-patterns;
- adoption risks;
- responsible-AI and human-in-the-loop considerations;
- relevance to Sentinel, Nexus, Atlas, Source, and Tower where applicable;
- source references with provenance;
- quality tier: `gold`, `silver`, `bronze`, or `needs_rewrite`;
- retrieval tags;
- owner/reviewer;
- release version.

Patterns must not be loaded if source references, quality tier, or reviewer are
missing.

## Phased Build Plan

| Phase   | Output                                                                                                          | Completion Gate                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Phase 0 | This scope, ADR dependency, and verifier.                                                                       | T282 complete after PR merge and CI green.                                                                               |
| Phase 1 | Curated seed set from `02-ai-led-pdlc.md`: umbrella plus 4 child patterns normalized into the target structure. | 5 gold/silver patterns, source references, sample retrieval QA.                                                          |
| Phase 2 | Minimum viable executive corpus across all taxonomy domains.                                                    | At least 120 reviewed patterns, every domain represented, manifest regenerated.                                          |
| Phase 3 | Retrieval and answer-quality integration.                                                                       | Eval shows answers cite tenant context when available, corpus patterns when relevant, and refuse out-of-scope questions. |
| Phase 4 | Scaled wave.                                                                                                    | Only after Phase 2/3 quality gates pass; target count set by retrieval coverage, not raw volume.                         |

Do not jump directly to a 10,000-pattern load. Scale only after retrieval
quality, provenance, and deduplication are stable.

## Response-Quality Gates

Before the wave is product-visible:

- corpus release manifest must be regenerated and checked;
- duplicate-risk scan must pass or have reviewed exceptions;
- sample retrieval QA must cover each taxonomy domain;
- at least 80% of sampled answers must cite relevant corpus evidence when the
  user asks a software-delivery question;
- answers must bind to tenant context only when tenant context is available;
- answers must clearly separate shared patterns from client facts;
- out-of-scope questions must be refused or redirected to the supported
  enterprise AI/business-delivery domain;
- high-risk recommendations must stay advisory and require human approval.

## Agent Binding Rules

- Sentinel may use the wave for enterprise AI and delivery-strategy questions.
- Nexus may use the wave for program governance, stage-risk, and delivery
  operating-model recommendations.
- Atlas may use the wave for executive operating-model and value-measurement
  synthesis.
- Source may use the wave for software-delivery vendor category and procurement
  diligence, but not for autonomous vendor decisions.
- Tower may use the wave for portfolio-level delivery health, cost, and risk
  signals.

All retrieval must go through the AgentContextBroker boundary. No product
surface should import corpus storage or vector/search clients directly.

## T282 Completion Boundary

T282 is complete when this scope document, verifier, package script, and release
record merge with green CI. It does not require authored corpus rows, database
loads, retrieval UI changes, or production surfacing.

Those are follow-on implementation backlog items.
