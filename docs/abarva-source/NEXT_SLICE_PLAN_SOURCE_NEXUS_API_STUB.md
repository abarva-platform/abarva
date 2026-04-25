# Next Slice Plan: Source Nexus API Stub

Date: 2026-04-25

Status: planned only.

Scope: planning and documentation only. Do not implement the route in this slice.

## 1. Purpose Of Source-Specific Nexus API Route

The Source Nexus API stub should provide the first Source-specific runtime entry point for Nexus without calling a model. Its purpose is to prove that a request for sourcing guidance can be answered from deterministic Source context, context validation, workflow validation, and the multi-agent briefing layer before any LLM behavior is introduced.

The stub should answer:

- Which sourcing event is in focus?
- What context is available?
- What context is missing?
- What workflow gates are blocked or deferred?
- What should Nexus recommend next?
- What should Sentinel, Atlas, and Steward contribute to the same request?
- What can the system safely answer without model calls?

The route is a bridge between the deterministic Source library layer and future user-facing Nexus interactions.

## 2. Why Source-Scoped, Not Program-Scoped

Source must have its own route because sourcing behavior is not the same as Program behavior.

Source-specific requirements include:

- Sourcing event identity and stage.
- SourceAgentContextBundle assembly.
- Vendor and sourcing lifecycle concepts.
- RFP, scorecard, artifact, approval, waiver, and value-ledger readiness.
- Context validation fixtures specific to sourcing prompts.
- Workflow validation fixtures specific to sourcing gates.
- Nexus sourcing guidance rather than generic program guidance.
- Sentinel evidence and citation constraints for sourcing artifacts.
- Atlas executive value and portfolio-risk read for sourcing decisions.
- Steward gate and governance enforcement for sourcing workflow moves.

The route must not reuse ProgramSurface, `/programs` assumptions, or `src/lib/programs/mock.ts`. Program-scoped runtime behavior can inform patterns later, but this route should be Source-native from the first stub.

## 3. Proposed Route

Proposed route:

```text
POST /api/v1/source/[eventId]/nexus/ask
```

Route intent:

- Accept a Source-scoped Nexus request for a single sourcing event.
- Assemble deterministic Source context for the event.
- Run deterministic validation/reporting.
- Build deterministic multi-agent briefing output.
- Return a no-model response that is useful for review, UI wiring, and future model preflight.

This route should not stream, persist, call a model, create artifacts, or mutate workflow state in the first implementation.

## 4. No-Model First Behavior

The first implementation should be deterministic only.

No-model behavior should:

- Ignore or reject any request to call a model.
- Produce a bounded answer from SourceAgentContextBundle.
- Include validation summaries.
- Include Nexus suggested actions.
- Include Sentinel, Atlas, and Steward briefings.
- Preserve BLOCK and DEFER outcomes as valid safety behavior.
- Label missing evidence, missing inputs, and seeded/projected value clearly.
- Refuse to imply that uploaded documents are citeable before parsing/validation exists.

The no-model stub should be useful even before chat UI exists. It is a runtime preflight endpoint, not the final agent experience.

## 5. SourceAgentContextBundle Usage

The route should assemble or load a SourceAgentContextBundle for the requested event.

Expected SourceAgentContextBundle usage:

- `tenant`: verify tenant/client scope.
- `authenticatedUser`: tie response to the current user.
- `contextScope`: likely `event` or `stage` for v1.
- `sourcingEvent`: event identity, archetype, owner, stage, value at stake.
- `workflowStage`: current stage label, status, readiness.
- `gates`: stage gate state and blockers.
- `artifacts`: artifact readiness and missing inputs.
- `scorecard`: scorecard lifecycle and lock state if available.
- `attachments`: uploaded/placeholder evidence state.
- `evidenceCitations`: citation availability.
- `missingInputs`: what Nexus must surface.
- `blockers`: what Nexus and Steward must not ignore.
- `nextAction`: deterministic next action.
- `contextQuality`: confidence and missing context reasons.
- `allowedActions`: what the response can safely suggest.

If the context bundle cannot be built, the route should return a structured context error rather than a generic answer.

## 6. Deterministic Multi-Agent Briefing Usage

The route should call the deterministic multi-agent briefing layer after context and validation reports are available.

Expected function:

```text
buildSourceMultiAgentBriefing(input)
```

Expected agent usage:

- Nexus: primary sourcing command read and next action.
- Sentinel: evidence, citation, and context validation caution.
- Atlas: executive value/risk synthesis.
- Steward: gate, approval, blocker, and cannot-proceed read.

The response should make Nexus the primary answer while preserving the other agent reads as structured supporting context. This keeps the route Source-agentic without becoming chat UI.

## 7. Context Validation Report Usage

The route should generate or load the deterministic context validation readable report.

Expected usage:

- Include suite verdict.
- Include pass/defer/reject counts.
- Include remaining context gaps.
- Include reject reasons if any.
- Include defer reasons if context is intentionally incomplete.
- Use report output to lower confidence when needed.
- Prevent Nexus from overstating unsupported answers.

If context validation rejects the input, the route should return a structured response with `answerStatus: "blocked"` or `answerStatus: "low_context"` rather than pretending the request can be answered normally.

## 8. Workflow Validation Report Usage

The route should generate or load the deterministic workflow validation readable report.

Expected usage:

- Include outcome counts: PASS, BLOCK, DEFER, WAIVER_REQUIRED, FAIL.
- Include mismatch count.
- Include suite verdict.
- Include blocker explanations.
- Include intentional defer explanations.
- Include required remediation.
- Feed Steward cannot-proceed reasoning.

Current known deterministic workflow outcome:

- 12 total.
- 11 BLOCK.
- 1 DEFER.
- 0 mismatches.
- Remaining intentional defer: uploaded document cannot be cited before parsing/validation.

The route should treat expected BLOCK outcomes as healthy enforcement, not runtime failures.

## 9. Request Shape

Proposed request body:

```ts
interface SourceNexusAskRequest {
  message?: string;
  mode?: 'dashboard' | 'event' | 'stage' | 'evidence' | 'workflow' | 'executive' | 'lowContext';
  focusArea?: string;
  userRole?: string;
  stageKey?: string;
  selectedActionId?: string;
  includeMultiAgentBriefing?: boolean;
  includeValidationReports?: boolean;
  deterministicOnly?: true;
  clientRequestId?: string;
}
```

Request rules:

- `deterministicOnly` should default to true.
- `message` is optional because the stub can answer with a current command read.
- `selectedActionId` can represent one of the three choices plus custom actions later.
- `stageKey` may refine context assembly when the event has a current stage.
- `includeValidationReports` should default to true for early review.
- Unknown fields should be ignored or rejected consistently, depending on existing app API conventions.

## 10. Response Shape

Proposed response body:

```ts
interface SourceNexusAskResponse {
  requestId: string;
  clientRequestId?: string;
  eventId: string;
  generatedAt: string;
  deterministicOnly: true;
  answerStatus: 'answered' | 'blocked' | 'deferred' | 'low_context' | 'error';
  answer: {
    title: string;
    summary: string;
    primaryFinding: string;
    recommendedNextAction: string;
    confidence: 'low' | 'medium' | 'high';
  };
  context: {
    scope: string;
    eventName?: string;
    stageLabel?: string;
    contextUsed: unknown[];
    missingInputs: string[];
    blockers: string[];
  };
  multiAgentBriefing: unknown;
  suggestedActions: unknown[];
  contextValidation?: {
    verdict: string;
    passCount: number;
    deferCount: number;
    rejectCount: number;
    remainingGaps: string[];
  };
  workflowValidation?: {
    verdict: string;
    total: number;
    outcomeCounts: Record<string, number>;
    mismatchCount: number;
    blockers: string[];
    defers: string[];
  };
  cannotProceedReasons: string[];
  warnings: string[];
  outOfScope: string[];
}
```

Response rules:

- Return deterministic structured output before any prose-only response.
- Keep Nexus answer concise.
- Include enough validation data for reviewers and future UI.
- Include suggested actions, including custom option where appropriate.
- Include out-of-scope warnings when the request asks for UI, model calls, artifact generation, upload/parsing, workflow mutations, or API behavior outside the stub.

## 11. Error And Failure States

The plan should account for these failure states:

- `401 unauthenticated`: user is not signed in.
- `403 forbidden`: user lacks Source access or tenant access.
- `404 event_not_found`: requested Source event does not exist for the tenant.
- `409 tenant_mismatch`: event belongs to a different tenant/client.
- `422 invalid_request`: request body is malformed or unsupported.
- `422 unsupported_mode`: mode is not available in the no-model stub.
- `424 context_unavailable`: SourceAgentContextBundle cannot be assembled.
- `424 context_validation_rejected`: context validation rejects safe answering.
- `424 workflow_blocked`: workflow validation indicates a hard gate block.
- `424 evidence_not_usable`: requested evidence is loaded but not parsed/validated/citeable.
- `501 model_not_enabled`: request asks for model behavior before model wiring is approved.
- `501 mutation_not_supported`: request asks to generate artifacts, upload files, change workflow stage, approve, waive, or persist state.
- `500 internal_error`: unexpected server error.

Errors should be structured and should not fall back to generic chatbot language.

## 12. Auth And Tenant Considerations

The route must be safe before it is useful.

Auth and tenant rules:

- Require authenticated user.
- Resolve tenant/client from the app-owned auth/session context.
- Ensure `eventId` belongs to the active tenant/client.
- Ensure the user role can access Source for that tenant.
- Do not expose cross-tenant event names, values, artifacts, vendors, or evidence.
- Include a clear forbidden response when the user is authenticated but not allowed.
- Avoid logging sensitive evidence text in the first stub.
- Keep future audit hooks in the plan, but do not implement audit persistence in the stub.

Role considerations:

- Sourcing lead and operator can ask operational/event questions.
- Executive roles can ask executive brief questions.
- Viewer can receive read-only deterministic responses.
- Admin/steward roles may see gate/governance details if policy allows.

The first implementation should use existing app auth conventions and should not invent a new permission system.

## 13. What Not To Build

Do not build these in the API stub plan or first stub:

- Chat UI.
- Streaming response UI.
- Model calls.
- OpenAI or Anthropic wiring.
- Upload/parsing.
- Evidence extraction.
- Artifact generation.
- RFP generation.
- Scorecard UI.
- Artifact drawer UI.
- Value ledger UI.
- Vendor workflow.
- Event canvas expansion.
- Workflow engine.
- Approval engine.
- Artifact versioning implementation.
- Document export/import.
- Database migrations.
- Generated pattern manifest.
- Pattern ingestion.
- `/programs` integration.
- `/preview` or `/demo` surfaces.
- `ProgramSurface`.
- `src/lib/programs/mock.ts`.

## 14. Acceptance Criteria

The future implementation should satisfy these criteria:

- Route exists at `POST /api/v1/source/[eventId]/nexus/ask`.
- Route is Source-scoped and does not depend on ProgramSurface or program mock data.
- Route uses SourceAgentContextBundle.
- Route runs or includes deterministic context validation report.
- Route runs or includes deterministic workflow validation report.
- Route builds deterministic multi-agent briefing.
- Nexus answer is the primary response.
- Sentinel, Atlas, and Steward are preserved as structured supporting reads.
- Response includes suggested actions.
- Response includes missing inputs, blockers, defers, warnings, and cannot-proceed reasons.
- No model calls are made.
- No UI is changed.
- No upload/parsing is implemented.
- No workflow state is mutated.
- Authenticated tenant boundary is enforced.
- Cross-tenant event access is blocked.
- Deterministic smoke test covers a seeded Data and AI Modernization Source event.
- Validation includes scoped lint, TypeScript, and a no-model route smoke check.

## 15. Future Phases After No-Model Stub

Phase 1: no-model route stub.

- Implement the route.
- Assemble deterministic Source context.
- Return deterministic multi-agent briefing and validation summaries.
- Add route smoke tests.

Phase 2: reviewed UI binding.

- Add a small UI integration only after the stub is reviewed.
- Bind to existing dashboard or Nexus panel shell without chat expansion.
- Preserve three choices plus custom if used.

Phase 3: context preflight enforcement.

- Require context validation before any future model call.
- Require workflow validation before recommending workflow movement.
- Keep BLOCK and DEFER outcomes visible.

Phase 4: model-assisted Nexus response.

- Add model calls only after the route, context validation, tenant safety, and no-model output are stable.
- Model prompt must include SourceAgentContextBundle, context validation, workflow validation, and pattern context.
- Model response must cite context used and disclose missing context.

Phase 5: evidence and pattern hardening.

- Add upload/evidence pipeline only after a separate approved plan.
- Add pattern section grounding only after manifest/runtime pattern plan.
- Add artifact generation only after artifact lifecycle, review, approval, and evidence gates are enforceable.

## Slice Boundary

This slice creates the plan only. It does not implement the API route. It does not add tests, route handlers, model calls, UI, upload/parsing, persistence, workflow logic, or approvals.
