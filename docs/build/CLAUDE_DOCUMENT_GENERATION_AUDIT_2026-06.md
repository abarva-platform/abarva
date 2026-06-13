# Claude Document Generation Audit — June 2026

## Scope

This audit maps the current Anthropic/Claude usage paths in the AbarVa repo, with emphasis on document-generation and artifact-generation paths for Moves and Source. It is PR-1 of the document-generation remediation lane. It does not change runtime behavior.

Runtime search covered `src/app` and `src/lib` for:

- `messages.create`, `messages.stream`, `streamAgentTurn`
- `preflightAnthropicDirectClient`, `getAuditedAnthropicClient`
- direct model ids such as `claude-sonnet-*`, `claude-opus-*`, and `claude-haiku-*`
- deliverable-specific Source and Moves orchestration, renderer, persistence, source-label, and quality-validation code

Tests, generated fixtures, static docs, and non-runtime corpus mentions were excluded unless they define behavior for a runtime call path.

## Executive Findings

1. **Claude is already the governed reasoning provider for the audited paths.** Runtime calls route through `preflightAnthropicDirectClient` / `getAuditedAnthropicClient` for policy and audit, except wrapper helpers that create the same preflighted client internally.

2. **There is no single enforced document-generation policy yet.** Model ids, max token budgets, temperatures, fallback behavior, and pass structure are scattered across Source templates, Moves deliverable modules, generic chat routes, and existing orchestration helpers.

3. **Some strong architecture already exists but is not universally adopted.** The reusable Deliverable Intelligence Orchestrator in `src/lib/deliverables/orchestrator/*` already implements six-pass artifact architecture, evidence grounding, red-team critique, board-grade rewrite, source register discipline, quality gating, and persistence mapping. It is not yet the mandatory path for all Moves and Source artifacts.

4. **Source flagship D09 now has quality gating, but the Source artifact route remains template-local.** `d09_rfp_pack` blocks deterministic fallback, calls Claude, runs consulting-grade review, rewrites when needed, and records quality metadata. However, Source still uses `src/lib/source/agent-generation/prompt-registry.ts` with local model/token settings and a route-local quality loop, not the shared document-generation policy/orchestrator.

5. **Moves has multiple overlapping deliverable paths.** There are legacy Haiku JSON deliverables, v2 Opus draft/review/revision generation, board deliverables, program narrative generation, and the newer orchestrator. These need consolidation so every major artifact uses the same tiered policy, source-label hygiene, multipass flow, validation, renderer, and durable File Cabinet persistence.

6. **Several chat/synthesis paths intentionally use low budgets and must stay out of final artifacts.** Nexus/Sentinel chat, Tower synthesis, short program/source synthesis, classifiers, guards, and extraction helpers use 150-2048 token budgets. Those are acceptable for short answers, classification, or extraction, but are not acceptable for board-grade deliverables.

7. **Durable artifact storage is inconsistent by path.** The shared orchestrator persistence maps passed deliverables into `generated_artifacts`; Moves board-grade persistence writes rendered artifacts; Source route currently registers generated markdown with an inline provenance URI rather than rendering DOCX/PPTX/XLSX/HTML to Azure Blob/File Cabinet for every final artifact.

8. **Source-label hygiene exists for Moves deliverables but is not global.** `src/lib/programs/deliverables/source-labels.ts` maps internal ids to client-readable source labels and detects forbidden tags. This should become a shared source-label mapper for both Moves and Source final documents.

## Risk Classification

| Risk | Severity | Evidence | Required follow-up |
|---|---:|---|---|
| Scattered model/token settings | High | Hardcoded Sonnet/Opus/Haiku settings across routes/libs | Central document-generation policy with env-configurable tiers |
| One-shot or cramped deliverables | High | Legacy/v2 paths generate large artifacts in one draft call or local template budgets | Route all major deliverables through multipass orchestrator |
| Final artifact persistence gaps | High | Source generated markdown registry uses inline URI; durable rendered Blob/File Cabinet is not universal | Unified artifact vault persistence for all final formats |
| Raw source label leakage | High | Some prompts include raw evidence ids or uploaded artifact metadata; mapper is not global | Shared source-label mapper and validator |
| Quality validation not universal | High | D09 has a quality gate; Moves has validators; many deliverables bypass unified validation | `validateDeliverableQuality` shared across Source/Moves |
| Chat settings reused by serious work | Medium | Shared `streamAgentTurn` defaults to 1024 unless caller overrides | Policy must reject Tier-1 budgets for deliverables |
| Deterministic fallback for final docs | Medium | Source non-flagship artifacts can fallback to deterministic draft | Gate final artifacts: preliminary only unless Claude + validator pass |

## Current Claude Usage Map

### Shared Anthropic Egress

| File | Function / route | Module | Model | Tokens | Temp | Stream | Stop | Fallback | Use | Tags / citation risk | Truncation risk | Multi-pass | Storage | Quality validation | Source register |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---|---|---|---|
| `src/lib/integrations/ai-egress/anthropic-direct.ts` | `getAnthropicDirectClient`, `preflightAnthropicDirectClient`, `createAnthropicDirectTextAdapter` | Shared AI egress | Caller-provided | Caller-provided | none | no | none | throws if no key; adapter returns model response | Egress policy/audit wrapper | depends on caller | depends on caller | caller-owned | no | no | no |
| `src/lib/agent/stream.ts` | `streamAgentTurn` | Shared chat/composer | default `claude-opus-4-7` | default 1024 | none | yes | none | throws on missing tenant/preflight denial | Generic streaming agent turn | depends on caller prompt | High if used for docs without override | no | no | no | no |
| `src/lib/agent/streaming/toolUseLoop.ts` | tool-use loop | Shared agent/tool use | caller-provided | caller-provided | none seen | yes | none | caller-owned | Multi-turn tool use | depends on caller | depends on caller | tool loop, not doc multipass | no | no | no |

### Source Deliverables and Source Chat

| File | Function / route | Module | Model | Tokens | Temp | Stream | Stop | Fallback | Use | Tags / citation risk | Truncation risk | Multi-pass | Storage | Quality validation | Source register |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---|---|---|---|
| `src/lib/source/agent-generation/prompt-registry.ts` | Source prompt registry | Source deliverables | `claude-sonnet-4-6` | default 4000; D09 4500 | none | route uses non-streaming | none | route may deterministic fallback except gated artifacts | D01 strategy, D05 scope, D09 RFP | User prompt includes tenant/event/upstream and uploaded evidence metadata; D09 includes evidence excerpts | Medium-high for RFPs; 4500 can be cramped | Template-local only; D09 later adds review/rewrite | route-owned | D09 only | D09 asks for source register; not global |
| `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` | Artifact generate route | Source deliverables | template model | template max tokens | none | no | none | deterministic fallback when no Anthropic, except consulting-grade artifacts block | Generate Source artifact body | Internal artifact metadata and evidence state can enter prompt; final body not centrally scrubbed | Medium-high for large packages | D09: generate → review → rewrite → review; others one-shot | Updates artifact state; registers generated markdown with inline URI | D09 consulting-grade gate only | D09 prompt asks for source register; not enforced for all |
| same | `runConsultingGradeReview` | Source quality | template model | 2200 | none | no | none | retries invalid JSON once | Rubric review | body/source context in prompt | Medium for complex review JSON | review pass | metadata only | yes for gated artifacts | yes, reviewed as quality criterion |
| same | `runConsultingGradeQualityGate` rewrite | Source quality | template model | template max tokens | none | no | none | fails route if rewrite/review fails | Rewrite weak artifact | same as original prompt | Medium-high | review → rewrite → review | metadata only | yes | yes |
| `src/lib/source/sentinel-chat-llm.ts` | `maybeCreateSourceSentinelChatLlmResponse` | Source Sentinel chat | env `SENTINEL_CHAT_MODEL` or `claude-sonnet-4-6` | 900 | none | no | none | deterministic fallback with warning | Short Source Q&A | Evidence labels are exposed as `[E#]`; not final document | Low-medium | no | no | no | citations in answer object |
| `src/app/api/source/synthesis/route.ts` | Source synthesis route | Source | `claude-sonnet-4-6` | 150 | none | yes | none | route fallback/error | Very short synthesis | not document-grade | High if misused | no | no | no | no |

### Moves / Strategic Moves Deliverables

| File | Function / route | Module | Model | Tokens | Temp | Stream | Stop | Fallback | Use | Tags / citation risk | Truncation risk | Multi-pass | Storage | Quality validation | Source register |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---|---|---|---|
| `src/lib/deliverables/orchestrator/model-caller.ts` | `createAuditedModelCaller`, `generateDeliverable` | Shared deliverable orchestrator | default `claude-opus-4-8` | pass-specific | none | yes | none | throws on preflight/client failure | Board-grade multipass deliverables | Uses clean orchestrator prompts and source register | Low if pass budgets respected | yes, six passes | via orchestrator persistence if caller uses it | yes | yes |
| `src/lib/deliverables/orchestrator/prompt-builder.ts` | six-pass prompt builder | Shared deliverable orchestrator | caller-provided | 6000 / 16000 by pass | n/a | n/a | n/a | n/a | Artifact architect, evidence mapping, draft, critique, rewrite, render package | Strong: forbids raw ids and requires numeric citations | Low | yes | n/a | yes downstream | yes |
| `src/lib/deliverables/orchestrator/orchestrator.ts` | `runDeliverableOrchestration` | Shared deliverable orchestrator | injected | prompt max tokens | n/a | n/a | n/a | blocks on parse/quality | Full document generation loop | strong | Low | yes | optional via persistence | yes | yes |
| `src/lib/deliverables/orchestrator/persistence.ts` | `persistDeliverable` | Shared deliverable persistence | n/a | n/a | n/a | n/a | n/a | refuses failed result | Save passed deliverable | uses rendered clean doc | n/a | n/a | `generated_artifacts` via repository | gates before save | yes |
| `src/lib/deliverables/v2-generator.ts` | `generateDraft` | Moves / legacy-v2 deliverables | `claude-opus-4-7` | 8000 | 0.3 | no | none | throws | Full draft | prompt-dependent | Medium for major docs | one draft pass | later `persistVersion` to deliverables_v2 | separate review call | not guaranteed |
| same | `reviewAgainstRubric` | Moves / legacy-v2 quality | `claude-opus-4-7` | 3000 | none | no | none | returns score 0 on failure | Rubric review | prompt-dependent | Medium | review only | no | yes, but threshold defaults 70/100 | no |
| same | `reviseIfBelowThreshold` | Moves / legacy-v2 revision | `claude-opus-4-7` | 8000 | 0.3 | no | none | throws | One revision if score low | prompt-dependent | Medium | draft → review → optional revision | persisted to `deliverables_v2` | yes, but not board-grade threshold | not guaranteed |
| `src/lib/deliverables/generate.ts` | `runHaiku` and `generateLegacyDeliverableForPhase` | Legacy Moves deliverables | `claude-haiku-4-5-20251001` | 2048 | none | no | none | JSON parse null / no save | Legacy engagement phase JSON deliverables | high; raw turn history and patterns enter prompt | High for serious artifacts | no | writes JSON to engagement fields | no | no |
| `src/lib/programs/deliverable-narrative.ts` | narrative generator | Moves | env/default `claude-opus-4-7` | default 6000 | none | yes | none | caller-owned | Move narrative deliverable | uses facts/gaps; citation handling path-specific | Medium | no | caller-owned | no | partial |
| `src/lib/programs/deliverables/board-deliverable.ts` | board deliverable generator | Moves | env/default `claude-opus-4-7` | 8000 | none | yes | none | structured citation-clean fallback | Board-style Move deliverable | source labels/citation map used | Medium | no | returns contract output; separate persistence path | validator available but not universal in call | yes |
| `src/lib/programs/deliverables/orchestrator.ts` | plan/draft/review call chain | Moves | env/default `claude-opus-4-7` | caller pass budgets | none | yes | none | caller-owned | Move orchestrated deliverable | source register/citation map used | Medium-low | yes, but not six-pass shared orchestrator | returns output; caller-owned | route/path-specific | yes |
| `src/lib/programs/deliverables/quality-validator.ts` | `validateDeliverableQuality` | Moves quality | n/a | n/a | n/a | n/a | n/a | blocks through caller | Hard quality validator | detects internal tags/source ids | n/a | n/a | n/a | yes | yes |
| `src/lib/programs/deliverables/source-labels.ts` | source label mapper | Moves quality/source register | n/a | n/a | n/a | n/a | n/a | deterministic humanization | Source register hygiene | strong for known ids | n/a | n/a | n/a | used by validator | yes |
| `src/lib/programs/board-artifacts/board-grade-persistence.ts` | `persistBoardGradeMoveArtifact` | Moves persistence | n/a | n/a | n/a | n/a | n/a | warns and returns null if client unresolved | Save rendered board-grade Move artifact | depends on rendered artifact | n/a | n/a | `generated_artifacts` / Artifact Vault path | no direct quality gate | no direct source register enforcement |

### Nexus / Sentinel / Intelligence / Tower Chat and Synthesis

These paths are not final document generators. They should remain Tier 1 or short-answer paths and must not be reused for board-grade artifacts.

| File | Function / route | Module | Model | Tokens | Temp | Stream | Fallback | Use | Document risk |
|---|---|---|---|---:|---:|---|---|---|---|
| `src/app/api/chat/route.ts` | chat route | Nexus/chat | `claude-sonnet-4-6` | 2048 through adapter | none | no | route-owned | Generic chat | Not for deliverables |
| `src/app/api/chat/agent/route.ts` | agent chat | Nexus/agent | `claude-sonnet-4-6` | 2048 default; 4096 program/source | none | yes via stream helper | route-owned | Agent responses and native PDF blocks | Not for final docs |
| `src/app/api/chat/step/route.ts` | step chat | Nexus/chat | `claude-sonnet-4-6` | 1024 | none | yes | route-owned | Step response | Not for final docs |
| `src/lib/nexus/composer.ts` | `streamAgentTurn` wrapper | Nexus | env/default `claude-opus-4-7` | 4096 | none | yes | route-owned | Composer response | Not for final docs unless routed to docgen |
| `src/lib/programs/nexus-free-text.ts` | free-text Nexus | Moves/Nexus | env/default `claude-opus-4-7` | 380 | none | no | route-owned | Short free-text | Too small for docs |
| `src/lib/sentinel/orchestrator.ts` | Sentinel orchestrator | Sentinel | `claude-sonnet-4-6` | 420 | none | no | route-owned | Decision-support answer | Too small for docs |
| `src/lib/intelligence/ask/classifier.ts` | classifier | Intelligence | `claude-haiku-4-5-20251001` | 256 | none | no | fallback/classification | Intent classification | Correctly not docgen |
| `src/lib/intelligence/ask/followups.ts` | follow-up generator | Intelligence | `claude-haiku-4-5-20251001` | 256 | none | no | fallback | Follow-up questions | Correctly not docgen |
| `src/lib/intelligence/ask/synthesizer.ts` | answer synthesis | Intelligence/Sentinel | Haiku/Sonnet/Opus by intent | dynamic low answer budget | none | yes | safe refusal on leak | CXO answer synthesis | Not for final artifacts |
| `src/app/api/programs/synthesis/route.ts` | program synthesis | Moves | `claude-sonnet-4-6` | 150 | none | yes | route-owned | Short synthesis | Too small for docs |
| `src/app/api/reasoning/stage-synthesis/route.ts` | stage synthesis | Moves | `claude-sonnet-4-6` | 200 | none | yes | route-owned | Stage summary | Too small for docs |
| `src/app/api/tower/synthesis/route.ts` | tower synthesis | Tower | `claude-sonnet-4-6` | 350 | 0 | yes | honest fallback | Portfolio/Tower short synthesis | Too small for docs |
| `src/lib/atlas/llm.ts` | Atlas LLM | Tower/Atlas | `claude-opus-4-7` | `ATLAS_MAX_TOKENS` 2000 | none | no | honest fallback | Tower/Atlas answer | Not final docgen |

### Extraction, Classification, Loader Stewardship, and Guardrails

These are not artifact generators; low token budgets are acceptable if results are bounded.

| File | Function / route | Module | Model | Tokens | Temp | Stream | Fallback | Use |
|---|---|---|---|---:|---:|---|---|---|
| `src/lib/agent/maestro-extractor.ts` | extractor | Agent/capture | `claude-haiku-4-5-20251001` | 512 | none | no | caller-owned | Extract structured fields |
| `src/lib/agent/pattern-trigger.ts` | trigger classifier | Agent | `claude-haiku-4-5-20251001` | 512 | none | no | caller-owned | Pattern trigger |
| `src/lib/agent/capture.ts` | capture classifier | Agent | `claude-haiku-4-5-20251001` | 512 | none | no | caller-owned | Capture facts |
| `src/lib/agent/guardrail.ts` | guardrail check | Agent | `claude-haiku-4-5-20251001` | 256 | none | no | caller-owned | Guardrail classification |
| `src/lib/tower/classify.ts` | Tower classifier | Tower | `claude-haiku-4-5-20251001` | 512 | none | no | caller-owned | Classification |
| `src/lib/programs/classifier.ts` | Program classifier | Moves | env/default `claude-haiku-4-5-20251001` | 512 | 0 | no | caller-owned | Classification |
| `src/lib/context-ingestion/loader/mapping-proposal.ts` | mapping proposal | Admin/context ingestion | `claude-sonnet-4-6` | 1500 | none | no | caller-owned | Suggest field mappings |
| `src/lib/context-ingestion/loader/steward-reviewer.ts` | steward review | Admin/context ingestion | `claude-sonnet-4-6` | 1500 | none | no | caller-owned | Review loaded evidence |
| `src/lib/context-ingestion/loader/steward-chat.ts` | steward chat | Admin/context ingestion | `claude-sonnet-4-6` | 800 | none | no | caller-owned | Loader steward chat |
| `src/app/api/org-search/route.ts` | org search adapter | Other/admin | `claude-sonnet-4-6` | 4096 | none | no | adapter-owned | Org search explanation | Not docgen |

## Major Deliverable Path Assessment

### Source

| Deliverable family | Current path | Current quality posture | Gap |
|---|---|---|---|
| Source Event Brief / Strategy Memo | `d01_strategy_memo` template | Sonnet, 4000 tokens, one-shot | Needs Tier 3/4 policy, source register enforcement, durable rendered artifacts |
| Evidence Readiness / Scope | `d05_scope_memo` template | Sonnet, 4000 tokens, one-shot | Needs multipass and validator |
| RFP Package | `d09_rfp_pack` template + route quality gate | Sonnet, 4500 tokens, generate-review-rewrite-review; deterministic fallback blocked | Needs section-by-section generation, Tier 4 model/token policy, rendered DOCX/XLSX/HTML to Blob/File Cabinet |
| Proposal / evaluation / pricing / negotiation docs | Specs exist in Source, but not audited as all wired through same high-quality generation path | Mixed or not wired | Needs migration to orchestrator |

### Moves

| Deliverable family | Current path | Current quality posture | Gap |
|---|---|---|---|
| Program Charter / Discovery / Design / Roadmap / Business Case | Multiple paths: legacy, v2, board-deliverable, program orchestrator, shared deliverable orchestrator | Strong pieces exist, but adoption is uneven | Consolidate through centralized policy and shared multipass orchestrator |
| Estimate / Value models | Board-grade expert-kernel renderers exist for some cases | Often deterministic/renderer-driven | Need source/citation and validator integration where Claude contributes |
| Executive decks / Handoff packs | Board-grade persistence exists for some rendered artifacts | Persistence can warn/skip if client unresolved | Enforce File Cabinet persistence as part of export gate |

## Existing Assets to Reuse

The remediation should not start from scratch. Reuse and harden:

- `src/lib/deliverables/orchestrator/prompt-builder.ts` — six-pass prompt standard and generous token budgets.
- `src/lib/deliverables/orchestrator/orchestrator.ts` — full multipass orchestration with plan and quality gates.
- `src/lib/deliverables/orchestrator/model-caller.ts` — audited Anthropic caller, defaulting board-grade work to Opus-class model.
- `src/lib/deliverables/orchestrator/persistence.ts` — save passed orchestrated deliverables through artifact repository.
- `src/lib/programs/deliverables/source-labels.ts` — internal id to human-readable source label mapper.
- `src/lib/programs/deliverables/quality-validator.ts` — hard validator for internal tags, source register, citations, sections, tables, title/version/date, client-to-complete items, and readable fonts.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — Source quality gate/retry learning from D09.
- `src/lib/source/agent-generation/quality-review.ts` and `src/lib/deliverables/quality/consulting-grade-rubric.ts` — partner-grade Source quality rubric.

## Required Remediation Slices

### PR-2 — Central document-generation policy

Create `src/lib/ai/document-generation-policy.ts` with environment-configurable tiers:

- `ABARVA_CLAUDE_CHAT_MODEL`, `ABARVA_DOCGEN_CHAT_MAX_TOKENS`
- `ABARVA_CLAUDE_WORKING_DRAFT_MODEL`, `ABARVA_DOCGEN_DRAFT_MAX_TOKENS`
- `ABARVA_CLAUDE_BOARD_GRADE_MODEL`, `ABARVA_DOCGEN_BOARD_MAX_TOKENS`
- `ABARVA_CLAUDE_LARGE_PACKAGE_MODEL`, `ABARVA_DOCGEN_PACKAGE_MAX_TOKENS`

The policy must reject Tier-1 chat budgets for final deliverables and log token usage/cost metadata by artifact.

### PR-3 — Deliverable Intelligence Orchestrator adoption contract

Promote the existing orchestrator types into the canonical contract for Moves and Source:

- `DeliverableIntelligenceRequest`
- `DeliverableArtifactBrief`
- `DeliverableGenerationPlan`
- six-pass prompt sequence
- high-stakes token budgets
- audited model caller

### PR-4 — Shared source-label mapper

Move/rename the existing Moves source-label mapper into a shared location and require it for both Source and Moves final documents. Final outputs must not expose `document_extract:*`, `tower_*`, `enterprise_context_*`, `chunk_id`, `fact_key`, raw table names, or retrieval labels.

### PR-5 — Multipass generation engine and Source migration

Route Source final artifacts through the orchestrator. D09 should become section-by-section Tier 4 generation with Excel companion plans. D01/D05 should get at least Tier 3 working/board-grade flow depending on artifact state.

### PR-6 — Moves migration

Route Program Charter, Discovery Report, Solution Design, Target Architecture, Operating Model, Roadmap, Estimate/Value/Business Case, Mobilization Plan, Handoff Pack, and Executive Playback Decks through the same policy/orchestrator, or explicitly mark deterministic renderers as non-Claude with validator and source register requirements.

### PR-7 — Unified quality validator

Merge Source consulting-grade rubric and Moves quality validator into a shared validator that blocks export on:

- internal tags/source ids
- unsupported claims
- no source register
- missing client-to-complete list when evidence is missing
- missing title/version/date
- required sections/tables absent
- thin body or likely truncation
- tiny fonts
- wrong tenant/client casing

### PR-8 — Renderer and File Cabinet enforcement

Make final export fail closed unless generated artifacts are rendered and saved durably:

- DOCX, PPTX, XLSX, HTML/MD as applicable
- Azure Blob storage
- Postgres metadata
- File Cabinet visibility
- version history
- source register and context trace links
- open/download actions

### PR-9 — SkyHarbor live proof

Regenerate and validate:

- Moves: SkyHarbor AI-PDLC Program Charter
- Source: SkyHarbor AMS RFP package

Proof must include quality validator pass, no internal tags, source register, client-to-complete checklist, DOCX/HTML/XLSX where required, Blob/File Cabinet persistence, and browser evidence.

## Acceptance Status for PR-1

| Acceptance item | Status |
|---|---|
| Every Claude usage path mapped | Complete for runtime paths in `src/app` and `src/lib`; tests/generated/docs excluded |
| Major deliverable paths identified | Complete |
| Low-token or deterministic deliverable paths flagged | Complete |
| Source/Moves reusable assets identified | Complete |
| No runtime behavior changed | Complete |

## Immediate Next Recommendation

Start PR-2 by adding `src/lib/ai/document-generation-policy.ts` and tests. The first enforcement should be non-invasive: expose a policy API and update one safe caller to read from it, while adding regression tests that final deliverables cannot use chat-tier budgets. Then migrate Source D09 and the shared orchestrator model caller onto the policy.
