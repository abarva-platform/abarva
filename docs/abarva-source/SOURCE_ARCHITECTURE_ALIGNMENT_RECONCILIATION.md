# Source Architecture Alignment Reconciliation

Date: 2026-04-25

## Purpose

This reconciliation cross-checks the AbarVa architecture and design packs that now influence AbarVa Source. It is documentation only and does not implement runtime code, UI, API routes, model calls, schedulers, persistence, upload/parsing, workflow engines, approval engines, or `/programs` integration.

## 1. What Each Architecture Pack Owns

| Pack | Owns | Does not own |
|---|---|---|
| Experience System | Visual language, page archetypes, journey maps, data table patterns, agent activity UI, response patterns, three choices plus custom, and implementation governance. | Runtime service boundaries, persistence, API route behavior, model gateway behavior, or Source-specific sourcing semantics. |
| Runtime Architecture | Platform runtime layering, model gateway boundaries, context builder, knowledge fabric, ingestion/parsing model, evidence ledger, agent runtime, handoffs, mission model, API boundaries, and runtime acceptance criteria. | Page-level visual design, Source-specific sourcing workflows, or pattern authoring depth. |
| Pattern Operating Model | Pattern taxonomy, authoring standard, storage and manifest model, sectioning, retrieval/context assembly, agent usage, artifact usage, validation usage, product-logic promotion, and learning loop. | UI layout, runtime ingestion implementation, generated manifests, database schema, or model calls. |
| Source Build Pack | AbarVa Source product vision, sourcing workflows, data model, journey/state machine, agent contracts, pattern pack architecture, artifact/RFP generation model, scorecard governance, value ledger model, lifecycle/alerts, and Source acceptance criteria. | Platform-wide visual canon, platform runtime services, generalized pattern governance beyond Source, or production deployment evidence. |
| Source Production Readiness Tracker | Honest Source readiness state, gates, incomplete areas, blockers, and do-not-build boundaries. | Runtime implementation, CI enforcement, live monitoring, or production evidence. |
| Production Readiness Manifest | Machine-readable readiness status across platform components, gates, blockers, and next actions. | Narrative product design, detailed architecture rationale, or live monitoring. |

## 2. Where The Packs Overlap

| Overlap area | Packs involved | Alignment status | Notes |
|---|---|---|---|
| Agent behavior | Experience System, Runtime Architecture, Source Build Pack | Aligned | All three say agents are context-first and not generic chatbots. Runtime now adds missions and triggers; Experience System adds activity UI; Source Build Pack adds Source-specific behavior. |
| Three choices plus custom | Experience System, Source Build Pack, Agent Mission Model | Aligned | Experience System owns interaction pattern; Source uses it in Nexus guidance and future mission actions. |
| Context used and confidence | Experience System, Runtime Architecture, Source validation docs | Aligned | Context Builder and validation reports provide the deterministic foundation; UI rules require context visibility when trust is affected. |
| Pattern usage | Pattern Operating Model, Source Build Pack, AMS pattern pack | Aligned with implementation gap | Pattern docs explain authoring and sectioning; Source has AMS authored/sectioned docs. Runtime retrieval/manifest implementation is still not started. |
| Workflow validation | Runtime Architecture, Source Build Pack, Source validation harness | Aligned | Source has deterministic workflow fixtures, runner, and report. Runtime workflow engine is intentionally not implemented. |
| Data readiness | Runtime Architecture, Source Build Pack, Production readiness tracker | Mostly aligned | Admin/Setup owns onboarding/readiness; Source consumes readiness. Runtime and UI implementation remain future work. |
| UI activity patterns | Experience System, Agent Mission Model, Source future UI | Aligned at spec level | Agent activity should be calm, mission-count driven, and not avatar/chat-led. No UI implementation is approved here. |

## 3. Duplicate Or Conflicting Terminology

| Term | Current use | Risk | Recommendation |
|---|---|---|---|
| Agent runtime vs agent mission model | Runtime Architecture describes execution flow; Agent Mission Model describes concrete work items and triggers. | Low | Treat mission model as a layer inside agent runtime, not a separate competing runtime. |
| Agent panel vs mission panel | Experience System uses agent panel broadly; Agent Activity UI Pattern adds mission panel variant. | Low | Use "agent panel" for the component family and "mission panel" for the work-queue variant. |
| Context validation vs workflow validation | Source has both deterministic harnesses. | Low | Keep context validation about grounding/anti-vanilla behavior; keep workflow validation about gates, blocks, defers, and lifecycle integrity. |
| Pattern guidance vs product logic | Pattern Operating Model explicitly separates guidance from promoted product logic. | Medium | Future runtime work must label each pattern section as guidance, artifact, validation, benchmark, negotiation, or product-logic candidate. |
| Readiness tracker vs production readiness manifest | Source tracker is narrative; JSON manifest is machine-readable. | Medium | Update the JSON only when component status, gates, blockers, or next actions change. Use the Source tracker for narrative milestones. |
| Dashboard Nexus preview vs chat UI | Some Source plans mention Nexus previews. | Medium | Treat previews as deterministic read models, not freeform chat or model calls, until explicitly approved. |

No hard conflicts were found. The main risk is terminology drift as specs move toward runtime implementation.

## 4. Agent Mission Model Alignment With Runtime Architecture

The Agent Mission Model aligns with Runtime Architecture because it:

- Preserves the rule that agents do not call models directly.
- Uses Context Builder, evidence, workflow state, validation results, and patterns as mission inputs.
- Treats Model Gateway as future controlled infrastructure, not direct agent behavior.
- Adds mission types, states, priorities, handoffs, triggers, audit needs, and stop conditions without implementing schedulers or background jobs.
- Keeps agents as product roles bound to work objects, not generic personalities.

Future runtime implementation should use the mission model as a deterministic read-model layer before adding queues, schedulers, persistence, or model-assisted phrasing.

## 5. Pattern Operating Model Alignment With Source Pattern Packs

The Pattern Operating Model aligns with the Source pattern pack work:

- AMS Managed Services Sourcing has been authored as deep human-readable IP.
- AMS pattern sections create stable section IDs suitable for later machine-addressable runtime context.
- Pattern Operating Model defines how authored IP can become guidance, artifacts, validation rules, product logic, and learning loops.
- Source Build Pack names pattern usage across RFP generation, scorecards, pricing, validation, and agent guidance.

Current gap: there is no generated manifest, runtime registry, retrieval pipeline, SourceAgentContextBundle pattern section injection, or pattern-linked validation enforcement beyond deterministic docs/fixtures.

## 6. Source Build Pack Alignment With Experience System

The Source Build Pack aligns with the Experience System at the spec level:

- Source should be table-forward, data-forward, and action-oriented.
- Agents should guide the next best action rather than become a blank chatbot.
- Journey state, blockers, value at stake, owner, due date, and context should be visible when they matter.
- Dark panels should be sparse and purposeful; off-white/warm-white remains the default design direction.
- Source data readiness, pattern usage, artifacts, approvals, and workflow states should use calm, enterprise-grade UI patterns.

Current gap: existing Source UI may still lag the full Experience System canon. Authenticated visual review and bounded UI polish should continue to cite the relevant Experience System files.

## 7. Production Readiness Tracker Alignment

The Source Production Readiness Tracker reflects the architecture direction honestly:

- Context validation foundation is complete.
- Workflow validation foundation is complete.
- Pricing and negotiation intelligence is designed/spec-only.
- Source/Admin data readiness integration is designed/spec-only.
- Agent mission model is designed/spec-only.
- Upload/parsing, persistence, workflow engine, approval engine, artifact versioning, model-assisted responses, and broad Source UI remain incomplete or not started.

`docs/build/production-readiness.json` should not be promoted by this reconciliation. This slice adds no runtime behavior, no tests, no deployment evidence, no live persona walk, and no production gate changes.

## 8. Gaps Requiring Future Slices

1. Source agent mission queue plan: translate platform mission model into Source-specific mission types, triggers, and read-model inputs.
2. Deterministic Source agent mission read model: build non-persistent mission outputs from SourceAgentContextBundle, context validation, workflow validation, and multi-agent briefing.
3. Source mission UI plan: decide where mission activity appears without creating agent spam or chat UI.
4. Pattern manifest plan: define how authored/sectioned patterns become runtime-discoverable without implementing ingestion.
5. Source data readiness contract: define exact Admin/Setup readiness fields Source consumes.
6. Source Nexus API hardening: keep deterministic no-model contract tests green before adding any model path.
7. Authenticated Source visual review: confirm Experience System alignment in the actual app.
8. Production-readiness manifest hygiene: update only when tracked component status, gates, blockers, or next actions materially change.

## 9. Recommended Next Implementation Sequence

1. Plan Source agent mission queue.
2. Implement deterministic Source agent mission read model.
3. Add deterministic contract tests for Source missions.
4. Plan mission activity UI with Experience System references.
5. Only then add a small Source dashboard mission preview if explicitly approved.
6. Keep model calls, schedulers, persistence, upload/parsing, workflow engines, approval engines, artifact versioning, and broad UI expansion blocked until their contracts are reviewed.

## Production Readiness Note

No `production-readiness.json` update is recommended for this reconciliation. It does not change runtime readiness, gates, blockers, test evidence, deployment evidence, or production status.
