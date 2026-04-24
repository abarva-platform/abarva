# 03 SOURCE AGENT TYPES REVIEW

## 1. Inventory

### Created Files

| File | Purpose | Key Exported Types | Runtime Logic? | Imports Existing Source Types? | Forbidden Imports? |
|---|---|---|---|---|---|
| `src/lib/source/agent-context.ts` | Defines the Source agent context contract that future Nexus turns must assemble before event-specific responses. | `SourceAgentContextBundle`, `SourceTenantContext`, `SourceAuthenticatedUser`, `SourceUserRole`, `SourcePersona`, `SourceSurface`, `SourceAgentContextScope`, `SourceContextUsed`, `SourceContextAssemblyInput`, `SourceContextAssemblyResult`, `SourceContextAssemblyFailure`, `SourceContextQualitySummary`, `SourceContextSourceOfTruthTimestamp`, `SourceAllowedAction`, `SourceWaitState`, `SourceEventSnapshot`, `SourceStageSnapshot`, `SourceGateSnapshot`, `SourceRiskSnapshot`, `SourceDecisionSnapshot`, `SourceArtifactSnapshot`, `SourceScorecardSnapshot`, `SourceValueLedgerLineSnapshot`, `SourcePatternContext`, `SourceEvidenceContext` | Contract-only. No runtime behavior. | Yes, imports `SourceRigorLevel`, `SourceLifecycleStatus`, `SourceStageKey`, `SourceStageStatus`, `StageGateStatus`, scorecard/artifact/value types from `./types`. | No. |
| `src/lib/source/chat-types.ts` | Defines future Source chat, response, suggested action, guidance, correction, and state contracts. | `SourceChatRole`, `SourceChatMessage`, `SourceChatThread`, `SourceChatIntent`, `SourceSuggestedAction`, `SourceSuggestedActionKind`, `SourceAgentResponse`, `NexusSourceGuidance`, `SourceResponseConfidence`, `SourceResponseMode`, `SourceContextUsedSummary`, `SourceResponseAction`, `SourceChatInputState`, `SourceChatResponseState`, `SourcePromptCorrection`, `SourceTypoToleranceHint` | Contract-only. No runtime behavior. | Yes, imports Source artifact/lifecycle/stage types from `./types` and context/attachment/validation contracts from sibling Source files. | No. |
| `src/lib/source/context-quality.ts` | Defines context quality dimensions, labels, scores, thresholds, and assessment shape. | `SourceContextQualityScore`, `SourceContextQualityDimension`, `SourceContextQualityLabel`, `SourceVanillaResponseRisk`, `SourceContextQualityAssessment`, `SourceContextQualityThresholds`, `DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS` | Contract-only plus one pure constant. | No direct existing Source type import needed. | No. |
| `src/lib/source/attachments.ts` | Defines attachment metadata, purpose, parse status, summary, extracted entities, citations, errors, confidence, and security status. | `SourceAttachment`, `SourceAttachmentType`, `SourceAttachmentPurpose`, `SourceAttachmentParseStatus`, `SourceAttachmentSummary`, `SourceExtractedEntity`, `SourceAttachmentCitation`, `SourceAttachmentAssociation`, `SourceAttachmentParsingError`, `SourceAttachmentConfidence`, `SourceAttachmentSecurityStatus` | Contract-only. No upload/parsing behavior. | Yes, imports `SourceArtifactKind` and `SourceStageKey` from `./types`. | No. |
| `src/lib/source/agent-validation.ts` | Defines future validation result, golden prompt, finding, severity, verdict, and pass criteria contracts. | `SourceAgentValidationResult`, `SourceAgentValidationScore`, `SourceAgentValidationDimension`, `SourceAgentValidationFinding`, `SourceAgentValidationSeverity`, `SourceGoldenPromptFixture`, `SourceGoldenPromptExpectedBehavior`, `SourceVanillaResponseFlag`, `SourcePersonaCrawlerVerdict`, `SourceValidationPassCriteria`, `SOURCE_DEFAULT_VALIDATION_PASS_CRITERIA` | Contract-only plus one pure constant. | Indirectly, imports `SourcePersona` from `./agent-context`. | No. |

### Updated Files

| File | Purpose | Key Change | Runtime Logic? | Forbidden Imports? |
|---|---|---|---|---|
| `src/lib/source/index.ts` | Barrel export for Source library. | Exports new type-contract files and selected `agent-context` types without duplicating `SourceValueLedgerSnapshot`. | No runtime behavior added. | No. |
| `CYCLE_STATE.md` | Live Source operating state. | Notes that the Source context-aware agent contract types were created without UI/API/model/upload work. | Documentation only. | No. |

## 2. Contract Coverage Matrix

| Requirement | Status | Type/File | Notes |
|---|---|---|---|
| tenant context | covered | `SourceTenantContext` in `agent-context.ts` | Includes tenant/client identifiers and names. |
| authenticated user | covered | `SourceAuthenticatedUser` in `agent-context.ts` | Minimal user identity shape. |
| user role/persona | covered | `SourceUserRole`, `SourcePersona` in `agent-context.ts` | Persona currently aliases role; acceptable for first contract. |
| route/surface | covered | `route`, `SourceSurface` in `agent-context.ts` | Route is string; surface is controlled union. |
| context scope | covered | `SourceAgentContextScope` in `agent-context.ts` | Covers portfolio/event/stage/artifact/scorecard/value/attachment/vendor/pattern. |
| sourcing event snapshot | covered | `SourceEventSnapshot` in `agent-context.ts` | Contains event identity, owner, stage, lifecycle, value summary. |
| archetype | covered | `sourcingArchetype`, `SourcePatternContext.archetype` | Currently string-based. Later may become canonical archetype union. |
| rigor level | covered | `SourceRigorLevel` from `types.ts` | Reused existing Source rigor type. |
| workflow stage | covered | `SourceStageSnapshot` | Uses existing `SourceStageKey` and `SourceStageStatus`. |
| lifecycle status | covered | `SourceLifecycleStatus` | Reused canonical Source lifecycle status. |
| readiness score | covered | `stageReadinessScore`, `SourceStageSnapshot.readinessScore` | Optional field, enough for contract. |
| next action | covered | `nextAction`, `SourceAllowedAction`, `NexusSourceGuidance.nextAction` | Supports deterministic and response-level action. |
| owner fields | covered | `nextActionOwner`, `eventOwner`, `stageOwner`, `decisionOwner` | Good separation. |
| due date | covered | `dueDate`, `SourceWaitState.dueDate`, `SourceStageSnapshot.dueDate` | Covered at bundle/stage/wait-state levels. |
| aging | covered | `agingDays`, `SourceWaitState.agingDays` | Covered. |
| blockers/wait state | covered | `blockers`, `SourceWaitState` | Blockers are string array; future builder may want structured blocker ids. |
| required inputs | covered | `requiredInputs` | Currently string array; future pass may promote to structured input snapshots. |
| missing inputs | covered | `missingInputs` | Same note as required inputs. |
| risks | covered | `SourceRiskSnapshot` | Includes severity, owner, stage, evidence ids. |
| decisions | covered | `SourceDecisionSnapshot` | Includes owner/status/options/evidence. |
| stage gates | covered | `SourceGateSnapshot` | Includes status, owner role, required artifacts, blockers, evidence required. |
| artifacts | covered | `SourceArtifactSnapshot` | Includes kind/status/tier/readiness/inputs/evidence. |
| scorecard state | covered | `SourceScorecardSnapshot` | Includes lifecycle, approval, criteria, defaults, overrides, lock. |
| projected value ledger | covered | `projectedValueLedger`, `SourceValueLedgerLineSnapshot` | Context-specific line extends canonical ledger entry. |
| realized value ledger | covered | `realizedValueLedger`, `SourceValueLedgerLineSnapshot` | Optional, correct for measured-value availability. |
| uploaded files | covered | `uploadedFiles`, `SourceAttachment` | Good coverage. |
| parsed file summaries | covered | `parsedFileSummaries`, `SourceAttachmentSummary` | Good coverage. |
| selected attachments | covered | `selectedAttachmentIds` | Good for file-specific prompts. |
| pattern pack | covered | `selectedPatternPack`, `SourcePatternContext` | Strong enough for first context builder. |
| pattern sections | covered | `relevantPatternSections`, `SourcePatternSectionContext` | Includes section kind and confidence. |
| evidence/citations | covered | `evidenceCitations`, `SourceEvidenceContext` | General evidence shape included. |
| citation coverage | covered | `SourceCitationCoverage` | Covers required/cited/missing claims. |
| prior turns | covered | `priorConversationTurns`, `SourceChatMessage` | Good for event-scoped continuity. |
| prompt/intent | covered | `userPrompt`, `normalizedIntent`, `SourceChatIntent` | Good. |
| allowed actions | covered | `SourceAllowedAction` | Includes gate/evidence check flags. |
| source-of-truth timestamps | covered | `SourceContextSourceOfTruthTimestamp` | Good for stale-data checks. |
| context quality | covered | `SourceContextQualityScore` | Includes completeness, pattern, evidence, event, missing-input, actionability, vanilla risk. |

Overall coverage: strong. Main future refinement is structured required/missing input snapshots instead of string arrays.

## 3. Deterministic vs Model-Assisted vs Evidence-Gated Review

### Deterministic Support

| Deterministic Fact | Supported? | Type/File |
|---|---|---|
| stage | Yes | `workflowStage`, `SourceStageSnapshot` |
| status | Yes | `lifecycleStatus`, `SourceLifecycleStatus`, `SourceStageStatus` |
| owner | Yes | `eventOwner`, `stageOwner`, `decisionOwner`, `nextActionOwner` |
| due date | Yes | `dueDate`, `SourceWaitState.dueDate` |
| aging | Yes | `agingDays`, `SourceWaitState.agingDays` |
| gate completion | Yes | `SourceGateSnapshot.status` |
| scorecard lock state | Yes | `SourceScorecardSnapshot.lockStatus` |
| artifact status | Yes | `SourceArtifactSnapshot.status` |
| stored value ledger fields | Yes | `SourceValueLedgerLineSnapshot` |
| file list | Yes | `uploadedFiles` |

### Model-Assisted Support

| Model-Assisted Need | Supported? | Type/File |
|---|---|---|
| advisory narrative | Yes | `SourceAgentResponse.answer`, `SourceResponseMode.modelAssisted` |
| synthesis | Yes | `SourceAgentResponse`, `NexusSourceGuidance.summary` |
| artifact draft language | Partial | `SourceArtifactAction`, `SourceArtifactSnapshot` exist; no draft-section type yet. |
| risk explanation | Yes | `SourceRiskSnapshot`, `SourceAgentResponse.answer` |
| executive summary | Partial | `SourceAgentResponse` can carry it; no executive-summary-specific response type. |
| tradeoff explanation | Yes | `SourceAgentResponse.answer`, `SourceResponseMode.modelAssisted` |

### Evidence-Gated Support

| Evidence-Gated Claim | Supported? | Type/File |
|---|---|---|
| savings claims | Yes | `SourceValueLedgerLineSnapshot`, `SourceEvidenceContext`, `SourceCitationCoverage` |
| vendor comparisons | Partial | Attachment/vendor response can be represented, but there is no vendor comparison snapshot yet. Acceptable because vendor flow is not approved. |
| readiness assertions | Yes | `stageReadinessScore`, `SourceGateSnapshot`, `SourceArtifactSnapshot.readiness`, evidence contexts |
| value realization statements | Yes | `realizedValueLedger`, `citationIds`, evidence contexts |
| recommendation confidence | Yes | `SourceContextQualityScore`, `SourceResponseConfidence`, validation scores |
| file-specific statements | Yes | `SourceAttachmentSummary`, `SourceAttachmentCitation`, `selectedAttachmentIds` |

Gaps:

- Add future `SourceGeneratedArtifactSection` or `SourceArtifactDraftPlan` before artifact drafting.
- Add future vendor response/comparison snapshots only when vendor flow is approved.
- Add executive-summary-specific response shape only when executive decision view is approved.

## 4. Chat Contract Review

| Requirement | Supported? | Type/File | Notes |
|---|---|---|---|
| direct answer | Yes | `SourceAgentResponse.answer` | Covered. |
| context used | Yes | `SourceAgentResponse.contextUsed`, `SourceContextUsedSummary` | Covered. |
| confidence | Yes | `SourceResponseConfidence`, `confidence` fields | Covered. |
| citations | Yes | `SourceAgentResponse.citations`, `SourceChatMessage.citations` | Uses `SourceEvidenceContext`. |
| recommended next action | Yes | `recommendedNextAction`, `SourceResponseAction` | Covered. |
| 3 suggested actions | Yes | `SourceSuggestedAction[]` | Type supports it; exact count should be enforced later by builder/validation. |
| custom input option | Yes | `customInputEnabled`, `SourceSuggestedActionKind.custom` | Covered. |
| handoff target | Yes | `handoffTarget?: SourceChatRole` | Covered. |
| artifact actions | Yes | `SourceArtifactAction[]` | Covered. |
| validation result | Yes | `SourceAgentValidationResult` | Covered. |
| response mode | Yes | `SourceResponseMode` | Covered. |
| typo/prompt correction | Yes | `SourcePromptCorrection`, `SourceTypoToleranceHint` | Covered. |
| chat input state | Yes | `SourceChatInputState` | Covered. |
| chat response state | Yes | `SourceChatResponseState` | Covered. |

Missing before UI design:

- No explicit `SourceSuggestedActionSet` type that enforces exactly three actions plus custom.
- No UI display density/ordering contract for context chips, citations, and action rows.
- No disabled/loading state metadata on `SourceChatInputState`; current state union is enough for type contract, but UI will need richer state.

## 5. Attachment Contract Review

| Requirement | Supported? | Type/File | Notes |
|---|---|---|---|
| file type | Yes | `SourceAttachmentType` | Includes pdf/docx/xlsx/csv/pptx/txt/md/image/unknown. |
| file purpose | Yes | `SourceAttachmentPurpose` | Includes all requested purposes. |
| parse status | Yes | `SourceAttachmentParseStatus` | Includes uploaded/classified/needsPurpose/parsing/parsed/parseFailed/lowConfidence/quarantined. |
| file-to-event association | Yes | `SourceAttachmentAssociation.eventId` | Covered. |
| file-to-stage association | Yes | `SourceAttachmentAssociation.stageKey` | Covered. |
| parsing errors | Yes | `SourceAttachmentParsingError` | Covered. |
| extracted entities | Yes | `SourceExtractedEntity` | Covered. |
| summaries | Yes | `SourceAttachmentSummary` | Covered. |
| citations | Yes | `SourceAttachmentCitation` | Locator supports page/sheet/row/slide/section/paragraph. |
| confidence | Yes | `SourceAttachmentConfidence` | Covered. |
| security/quarantine status | Yes | `SourceAttachmentSecurityStatus` | Covered. |
| ambiguous purpose flow | Yes | `needsPurpose` status and optional `purpose` | Covered conceptually. |

Gaps before upload implementation:

- Add file size, checksum, MIME type, and storage locator before real upload.
- Add tenant/security scan metadata before storing user files.
- Add retention/deletion policy fields if regulated files are expected.
- Add parser provenance fields when parsing is implemented.

## 6. Context Quality / Validation Review

| Requirement | Supported? | Type/File | Notes |
|---|---|---|---|
| context grounding | Yes | `SourceAgentValidationResult.contextGrounding` | Covered. |
| actionability | Yes | `SourceAgentValidationResult.actionability`, context quality dimension | Covered. |
| evidence score | Yes | `SourceAgentValidationResult.evidence` | Covered. |
| vanilla response risk | Yes | `SourceVanillaResponseRisk`, `vanillaResponseRisk`, `SourceVanillaResponseFlag` | Covered. |
| golden prompt fixtures | Yes | `SourceGoldenPromptFixture` | Covered. |
| persona crawler verdict | Yes | `SourcePersonaCrawlerVerdict` | Covered as accept/defer/reject. |
| validation findings | Yes | `SourceAgentValidationFinding` | Covered. |
| severity | Yes | `SourceAgentValidationSeverity` | Covered. |
| pass criteria | Yes | `SourceValidationPassCriteria`, default constant | Covered. |

Gaps before any model call:

- No executable validation harness yet, by design.
- `SourceValidationPassCriteria` literal types hard-code thresholds, which is good for defaults but may be too rigid if future tests need variants. Could later add a configurable criteria type if needed.
- Need golden prompt fixture data before model route implementation.

## 7. Import and Coupling Check

Confirmed: new files do not import from:

- `src/lib/programs/mock.ts`
- `src/components/programs/ProgramSurface.tsx`
- `src/app/programs`
- `src/app/(maestro)/preview`
- `src/app/demo`

Observed imports are bounded to:

- `src/lib/source/types.ts`
- sibling files under `src/lib/source`

Source remains bounded to `src/lib/source` and existing Source primitive types. No Program, preview, demo, API, UI, or model coupling was introduced.

## 8. Naming and Duplication Check

| Item | Assessment |
|---|---|
| `SourceValueLedgerSnapshot` remains canonical in `types.ts` | Yes. `agent-context.ts` only re-exports it for discoverability and does not redefine it. |
| `SourceValueLedgerLineSnapshot` is context-specific | Yes. It extends `ValueLedgerEntry` with assumptions, measurement owner/method, and citation ids for agent context. |
| no confusing duplicate types introduced | Mostly yes. There is some expected overlap between `SourceContextQualityScore` and `SourceAgentValidationResult`; they serve different layers: context assembly vs response validation. |
| naming consistent with existing Source types | Yes. Names use `Source*` prefix and existing `SourceStageKey`, `SourceLifecycleStatus`, artifact, scorecard, and value types. |
| barrel exports in `index.ts` are safe | Yes. `index.ts` exports new files and selected `agent-context` types. No `SourceValueLedgerSnapshot` duplicate export conflict was introduced. |

Naming notes:

- `SourcePersona = SourceUserRole` is acceptable for now, but a future persona model may need richer persona metadata.
- `blockers`, `requiredInputs`, and `missingInputs` are string arrays in `SourceAgentContextBundle`; future builder work should consider structured snapshot types.
- `route` is a string; future contracts may introduce `SourceRouteContext` if route matching becomes more formal.

## 9. Implementation Recommendation

Recommendation: A. Create a deterministic Source context builder contract and stub, no API/model/UI.

Why:

- The type layer is broad enough to support a deterministic context builder.
- A builder contract is the next natural gate before chat UI or API routes.
- It will validate which fields can be populated from current mock/domain data and which are future placeholders.
- It keeps model calls blocked until context quality can be computed.
- It keeps Source separate from Program Nexus APIs.

Recommended next slice:

- Add `src/lib/source/context-builder.ts`.
- Export a deterministic `buildSourceAgentContext(input): SourceContextAssemblyResult` stub.
- Populate only available deterministic fields from existing Source data.
- Return explicit `SourceContextAssemblyFailure` or low-context quality when data is unavailable.
- No UI, no route, no model call, no upload parsing.

## 10. Commit Recommendation

Recommendation: commit Source agent type contracts as-is after review.

Rationale:

- The types are contract-only and pass the intended architecture boundary.
- No UI/API/model/upload work is included.
- Program/preview/demo coupling is absent.
- The known gaps are appropriate next-slice concerns, not blockers for preserving this contract layer.

Do not commit until explicitly asked.
