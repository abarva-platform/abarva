# 02 AGENT CONTEXT AWARENESS REVIEW

## 1. Inventory

### Created Files

| File | Purpose | Key Decisions | Status |
|---|---|---|---|
| `docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md` | Defines how Nexus becomes context-first rather than prompt-first. | Introduces `SourceAgentContextBundle`, context assembly pipeline, deterministic/model/evidence-gated split, grounding rules, anti-vanilla safeguards, and context quality scoring. | Complete for product review; needs implementation review before types are created. |
| `docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md` | Defines the future Source chat/input experience without building it. | Establishes guided chat, "3 choices + custom", attachment model, typo tolerance, chat UX states, and response UI contract. | Complete for design review; needs UX detail pass before UI implementation. |
| `docs/abarva-source/build-pack/24_CONTEXT_VALIDATION_HARNESS.md` | Defines how Source detects vanilla agent responses. | Establishes validation layers, golden prompts, vanilla-response heuristics, scoring rubric, pass thresholds, and human review checklist. | Complete for review; should become test/harness work before model wiring. |

### Updated Files

| File | Purpose | Key Decisions | Status |
|---|---|---|---|
| `CYCLE_STATE.md` | Live operating state for Source cycle. | Current item moved to Agent Context Awareness hardening; do-not-build list remains active. | Complete, but should be updated again after any commit/PR. |
| `docs/abarva-source/build-pack/00_MASTER_ANCHOR.md` | Build Pack spine and read-order authority. | Adds files 22-24 to read order; declares context awareness a load-bearing capability and a completion gate. | Complete. |
| `docs/abarva-source/build-pack/08_AGENT_DESIGN_AND_HANDOFFS.md` | Agent roles and handoffs. | Defines Nexus as context-first, requires Context Bundle or scoped derivative for handoffs, and clarifies Sentinel/Atlas/Steward fit. | Complete for review. |
| `docs/abarva-source/build-pack/15_ACCEPTANCE_CRITERIA.md` | Product acceptance gates. | Adds acceptance for context-aware chat, attachments, typo tolerance, suggested actions, and vanilla-response detection. | Complete for review. |
| `docs/abarva-source/build-pack/16_AGENT_PER_TURN_CONTRACT.md` | Per-turn agent lifecycle. | Adds Context Bundle assembly before model invocation, missing-context failure behavior, and context-aware response shape. | Complete for review. |
| `docs/abarva-source/build-pack/17_CRAWLER_PERSONA_VERIFICATION.md` | Persona crawler verification. | Adds context-aware response quality crawler checks and grounding prompts for CIO/CFO/procurement scenarios. | Complete for review. |

## 2. North Star Alignment Check

| Requirement | Assessment | Gaps |
|---|---|---|
| Nexus is context-first, not prompt-first | Clearly established in files 22, 08, 16, and 00. | None. |
| Every event-specific answer must use `SourceAgentContextBundle` | Clearly established. | Future implementation must decide required vs optional fields by route/surface. |
| Nexus should not produce vanilla GPT/Claude-style responses | Strongly established through anti-vanilla safeguards and validation harness. | Add automated fixture examples later. |
| Chat should provide 3 suggested actions plus custom prompt | Clear in file 23 and acceptance criteria. | Needs UI-level rules for disabled/loading/blocked action states. |
| File attachments are core context, not passive uploads | Clear in files 22 and 23. | Needs storage/parsing architecture later. |
| Uploaded files become structured evidence | Clear conceptually. | Needs citation granularity model: page, sheet, row, slide, paragraph, section. |
| Pattern packs ground the answer | Clear in files 21, 22, and 24. | Need exact pattern-section IDs/types during implementation. |
| Workflow state changes the answer | Clear: stage, lifecycle, gates, missing inputs, blockers, scorecard lock, value fields. | Need route-specific context requirements. |
| Deterministic facts are separated from model-assisted synthesis | Clear and repeated across files 16 and 22. | None. |
| Evidence-gated claims require citations/evidence | Clear. | Need enforcement strategy before model calls. |
| Low-context answers must disclose limitations | Clear. | Need exact copy/response templates later. |

Verdict: aligned. The docs now make Source an agent-led sourcing workbench rather than a dashboard with generic chat.

## 3. SourceAgentContextBundle Readiness

| Field Area | Covered? | Notes |
|---|---|---|
| tenant | Yes | `tenant: SourceTenantContext` included. |
| user | Yes | `user: SourceAuthenticatedUser` included. |
| persona/role | Yes | `userRole` and `persona` included. |
| route | Yes | `route` and `surface` included. |
| sourcing event | Yes | `sourcingEvent` included. |
| archetype | Yes | `sourcingArchetype` included. |
| rigor | Yes | `rigorLevel` included. |
| current stage | Yes | `workflowStage` included. |
| lifecycle status | Yes | `lifecycleStatus` included. |
| stage readiness | Yes | `stageReadinessScore` included. |
| next action | Yes | `nextAction` included. |
| owner | Yes | `nextActionOwner` included; should also add generic `eventOwner` and `stageOwner` later. |
| due date | Yes | `dueDate` included. |
| aging | Yes | `agingDays` included. |
| blockers | Yes | `blockers` included. |
| required inputs | Yes | `requiredInputs` included. |
| missing inputs | Yes | `missingInputs` included. |
| risks | Yes | `risks` included. |
| decisions | Yes | `decisions` included. |
| stage gates | Yes | `stageGates` included. |
| artifacts | Yes | `artifacts` and `artifactStatuses` included. |
| scorecard state | Yes | `scorecard`, defaults, overrides, lock status included. |
| value ledger | Yes | projected and realized ledgers included. |
| uploaded files | Yes | `uploadedFiles` and `parsedFileSummaries` included. |
| pattern pack | Yes | `selectedPatternPack` included. |
| pattern sections | Yes | `relevantPatternSections` included. |
| evidence citations | Yes | `evidenceCitations` included. |
| prior turns | Yes | `priorConversationTurns` included. |
| user prompt | Yes | `userPrompt` and `normalizedIntent` included. |
| confidence/grounding score | Yes | `contextQuality` included. |

Fields to clarify before implementation:

- Add `eventOwner`, `stageOwner`, and `decisionOwner` separately from `nextActionOwner`.
- Add `contextScope` such as `portfolio`, `event`, `stage`, `artifact`, `scorecard`, `value`, or `attachment`.
- Add `sourceOfTruthTimestamps` for stale-data checks.
- Add `permissions` or `allowedActions` so the response cannot propose unauthorized actions.
- Add `waitState` as a structured object, not just lifecycle plus blockers.
- Add `selectedAttachmentIds` for file-specific questions.
- Add `citationCoverage` or evidence sufficiency result for evidence-gated answers.

Readiness verdict: strong enough for TypeScript type-definition pass. Not ready for model calls until the required/optional matrix and enforcement rules are added.

## 4. Future Type Placement Recommendation

Recommended files:

| File | Types |
|---|---|
| `src/lib/source/agent-context.ts` | `SourceAgentContextBundle`, `SourceContextUsed`, `SourceAgentContextScope`, context builder input/output contracts |
| `src/lib/source/chat-types.ts` | `SourceChatMessage`, `SourceSuggestedAction`, `SourceAgentResponse`, `NexusSourceGuidance`, chat role/intent/surface types |
| `src/lib/source/context-quality.ts` | `SourceContextQualityScore`, scoring constants, score labels, deterministic quality helper signatures |
| `src/lib/source/attachments.ts` | `SourceAttachment`, `SourceAttachmentSummary`, `SourceExtractedEntity`, attachment parse status, attachment purpose |
| `src/lib/source/agent-validation.ts` | `SourceAgentValidationResult`, validation score types, golden prompt fixture shape, vanilla-response flags |

Type placement by name:

| Type | Recommended File |
|---|---|
| `SourceAgentContextBundle` | `src/lib/source/agent-context.ts` |
| `SourceChatMessage` | `src/lib/source/chat-types.ts` |
| `SourceSuggestedAction` | `src/lib/source/chat-types.ts` |
| `SourceAttachment` | `src/lib/source/attachments.ts` |
| `SourceAttachmentSummary` | `src/lib/source/attachments.ts` |
| `NexusSourceGuidance` | `src/lib/source/chat-types.ts` or `src/lib/source/agent-context.ts` if used as deterministic guidance output |
| `SourceContextQualityScore` | `src/lib/source/context-quality.ts` |
| `SourceAgentResponse` | `src/lib/source/chat-types.ts` |
| `SourceAgentValidationResult` | `src/lib/source/agent-validation.ts` |

Do not create these files yet without explicit approval.

## 5. Existing Agent API Fit

Files reviewed conceptually:

- `src/lib/nexus/orchestrator.ts`
- `src/lib/nexus/assembler.ts`
- `src/lib/nexus/composer.ts`
- `src/app/api/v1/nexus/query/route.ts`
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
- `src/app/api/v1/programs/[programId]/nexus/draft/route.ts`
- `src/lib/programs/nexus.ts`
- `src/lib/programs/nexus-free-text.ts`
- `src/lib/sentinel/orchestrator.ts`
- `src/app/api/v1/sentinel/query/route.ts`
- `src/lib/atlas/orchestrator.ts`
- `src/app/api/v1/atlas/ask/route.ts`

Reusable pieces:

- The generic Nexus six-phase shape in `src/lib/nexus/orchestrator.ts`: classify, retrieve, assemble, compose, render.
- The concept of an assembled bundle from `src/lib/nexus/assembler.ts`.
- The composer boundary in `src/lib/nexus/composer.ts`, once Source has a Source-specific context serializer.
- SSE streaming patterns from `src/app/api/v1/nexus/query/route.ts` and program Nexus ask route.
- Sentinel's evidence-thin/fail-honest posture and pattern ranking concepts.
- Atlas's split between scripted/hybrid/LLM turns and persisted trace/observation model.

What should not be reused directly:

- `src/lib/programs/nexus.ts` context assembly. It is Program-shaped: phases, modules, deliverables, flags, pattern preload, and program threads.
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`. It is explicitly program-scoped and validates `program_threads`.
- `src/app/api/v1/programs/[programId]/nexus/draft/route.ts`. It writes Program deliverables and runs Program quality gates.
- `src/lib/programs/nexus-free-text.ts`. It references Programs, `/preview/intelligence` links, ProgramContextBundle, and program-applicable patterns.

Recommended Source-specific route family:

- `POST /api/v1/source/[eventId]/nexus/ask`
- Later: `POST /api/v1/source/[eventId]/nexus/attachments`
- Later: `POST /api/v1/source/[eventId]/nexus/validate`

Program-scoped Nexus APIs should remain separate. Source should borrow architecture patterns, not imports that couple Source to `/programs` or Program domain types.

Fit verdict: the existing agent architecture is a useful reference, but Source needs its own context assembly, route boundary, types, persistence, validation, and artifact/value/scorecard domain contracts.

## 6. Chat UX Readiness

| Area | Assessment | Gap |
|---|---|---|
| 3 choices + custom | Clear and stage examples are good. | Need exact behavior for disabled suggestions and blocked actions. |
| Attachment behavior | Clear conceptually. | Need UI placement for file chips, parsing status, and "what I used." |
| Spell-check/typo tolerance | Clear examples. | Need domain dictionary/acronym preservation list later. |
| Response structure | Clear: answer, context, confidence, citations, next action, suggestions, handoff. | Need visual hierarchy and compact states in component spec. |
| Chat states | Strong list of states. | Need transition rules between states. |
| Guided workflow behavior | Clear. | Need mapping from suggested actions to deterministic intents. |
| Anti-generic-chatbot behavior | Strong. | Need validation fixtures before implementation. |

UX readiness verdict: ready for design review, not yet ready for code implementation. The next implementation step should be types/contracts, not UI.

## 7. Attachment Model Readiness

| Requirement | Assessment | Gap |
|---|---|---|
| supported file types | Clear: PDF, DOCX, XLSX, CSV, PPTX, TXT/MD, images later. | Need accepted size limits and security rules later. |
| file classification | Clear. | Need classification enum and ambiguous-purpose flow. |
| file-to-event association | Clear. | Need event permission enforcement. |
| file-to-stage association | Clear. | Need whether stage is required or optional by file purpose. |
| parsing status | Clear. | Need retry and manual override semantics. |
| summary/extracted entities | Clear. | Need entity schema by file purpose. |
| evidence/citation references | Clear. | Need citation granularity by file type. |
| failure behavior | Mostly clear. | Add quarantine behavior for parse failure or low confidence. |
| what Nexus can/cannot say before parsing completes | Clear. | Needs enforcement in validation harness. |

Attachment readiness verdict: good specification foundation. Needs storage, parser, citation, and security architecture before implementation.

## 8. Context Validation Readiness

| Area | Assessment |
|---|---|
| golden prompts | Specific and tied to dashboard, scope, scorecard, artifact/RFP, attachments, CFO, CIO, procurement. |
| vanilla-response detection | Clear and actionable. |
| scoring rubric | Clear 0-5 scales for context grounding, actionability, evidence. |
| pass/fail thresholds | Clear: grounding >= 4, actionability >= 4, evidence >= 3 for event-specific answers. |
| persona crawler links | Added in file 17 and linked conceptually to file 24. |
| expected evidence behavior | Clear for scorecard/value/file/RFP scenarios. |

Recommended additional golden prompts:

- Dashboard: "What changed since yesterday?"
- Waiting state: "Why are we waiting and who owns it?"
- Value ledger: "What value is projected versus realized?"
- Attachment ambiguity: "Use this file" after uploading an unclassified file.
- Low-context: "Can you recommend a vendor?" with no vendor evidence.
- Gate blocker: "Approve moving forward anyway."
- Pattern grounding: "Why is this a Data & AI Modernization sourcing event?"

Validation readiness verdict: strong enough to drive first harness fixtures after type definitions exist.

## 9. Implementation Risk List

| Risk | Mitigation |
|---|---|
| Agent still behaves generically | Require Context Bundle before event-specific response; run golden prompt validation. |
| Missing Context Bundle fields | Create TypeScript definitions first and review required/optional matrix by route. |
| Chat UI becomes generic prompt box | Do not build UI until response contract, suggested actions, and context-used display are typed. |
| Suggested actions become static chips | Generate suggestions from event state, stage, pattern pack, gates, and validation result. |
| File uploads do not become evidence | Require attachment summary, extracted entities, evidence references, and parse status before Nexus can cite file content. |
| Model-generated responses override deterministic state | Keep stage/status/gates/owners/scorecard/value fields deterministic and validate before render. |
| Scorecard/value claims without evidence | Add validation checks for scorecard default/override context and value ledger assumption/citation context. |
| Source agent coupled to Program APIs | Create Source-specific route and context builder; reuse patterns only at architectural level. |
| No validation harness before agent wiring | Build validation fixtures before any model-backed Source Nexus route. |

## 10. Recommended Next Step

Recommendation: A. Create TypeScript type definitions only for Source context/chat/attachments/validation, with no UI and no model calls.

Why:

- The documentation is now strong enough to type the contract.
- Types will expose naming gaps before UI or routes make them expensive.
- A typed context contract creates the seam for deterministic context builder work.
- It avoids premature chat UI, file upload, or model wiring.
- It keeps Source separate from Program-scoped Nexus APIs.

Suggested first implementation slice, when approved:

- Add `src/lib/source/agent-context.ts`
- Add `src/lib/source/chat-types.ts`
- Add `src/lib/source/context-quality.ts`
- Add `src/lib/source/attachments.ts`
- Add `src/lib/source/agent-validation.ts`
- Export them from `src/lib/source/index.ts`
- No UI, no routes, no model calls, no file parsing.

## 11. Commit Recommendation

Recommendation: commit context-awareness docs as-is after product review.

Rationale:

- The docs are coherent and align with the Source north star.
- No UI implementation is included.
- The layer provides a clean gate before chat, file upload, or agent wiring.
- Known gaps are implementation-detail gaps, not conceptual blockers.

Do not commit until explicitly approved.
