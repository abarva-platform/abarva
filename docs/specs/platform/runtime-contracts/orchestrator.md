# Nexus Orchestrator Contract

Why this contract matters: `runPipeline()` is the shared execution core behind `/api/v1/nexus/query`. When builders change event order, input shape, or fallback behavior here, the Ask UI, SSE consumers, and downstream tests drift quickly.

## Source of truth

- `src/lib/nexus/orchestrator.ts`
- `src/app/api/v1/nexus/query/route.ts`
- `src/lib/nexus/sseStream.ts`
- `src/lib/nexus/sessionContext.ts`

## Input contract

`runPipeline(input: OrchestratorInput)` accepts:

- `query: string`
- `tenancy: TenancyCtx`
- `priorTurns?: NexusTurnData[]`
- `formatOverride?: NexusFormat`
- `pivotHints?: { majorIrreversibleDecision?, successCriteriaMissing?, stakeholderCount?, dollarImpactUsd?, preloadablePhases? }`
- `capability?: 'counter' | { persona: string }`
- `includeSessionContext?: boolean`
- `onProgress?: (p) => void`
- `onTextDelta?: (text) => void`
- `onGateSignal?: (signal) => void`

Important behavior:

- `includeSessionContext` defaults to enabled. The route does not explicitly pass it, so normal `/api/v1/nexus/query` requests load session context.
- Session context loads in parallel with parse/classification, then gets awaited just before compose.
- `capability` is how persona and counter flows reuse the same pipeline.

## Output contract

`runPipeline()` returns:

- `mode: NexusMode`
- `format: NexusFormat`
- `payload: Record<string, unknown>`
- `bundle: CompositionBundle`
- `latencyMs: { parse, plan, retrieve, assemble, compose, total }`
- `strippedCount: number`
- `clarifying?: ReturnType<typeof shouldClarify>`
- `session?: SessionContext`
- `gateSignals: GateSignal[]`

`GateSignal` currently supports:

- `gate_approval`
- `phase_transition`
- `charter_generation`

Each signal may include `fromPhase`, `toPhase`, and a parsed `payload` object.

## Six-phase pipeline

The orchestrator runs in this order:

1. `parse`
   - Classifies `mode` via `classifyMode()`
   - Decides clarification via `shouldClarify()`
   - Chooses `format` via `classifyFormat()`
2. `plan`
   - Builds intake plan with `runIntake()`
3. `retrieve`
   - Runs evidence retrieval with `runEvidence()`
4. `assemble`
   - Runs `runValue()` and `runDecision()`
   - Runs `runContradiction()`
   - Builds the composition bundle with `assemble()`
5. `compose`
   - Calls `compose()` with bundle, format, capability, and optional session context block
   - Streams text via `onTextDelta`
   - Parses gate signals from `composed.rawText`
6. `render`
   - No additional transformation phase today; the payload is already ready and progress is marked complete

## Clarifying fast-path

If `shouldClarify()` fires:

- retrieval/assembly/composition are skipped
- output `format` becomes `clarification`
- payload shape is:
  - `format: 'clarification'`
  - `question`
  - `options`
- `latencyMs.plan`, `retrieve`, `assemble`, and `compose` are `0`

## Latency cap

`HARD_CAP_MS` is `15000`.

Actual shipped behavior:

- if elapsed time before composition exceeds `HARD_CAP_MS - 3000` (12 seconds),
- the orchestrator returns `format: 'idk'`
- with:
  - `why_dont_know: 'Pipeline exceeded latency budget before composition.'`
  - `who_would_know: 'Retry with a narrower question · or contact Maestro.'`

This is a pre-compose fallback, not a full-request timeout.

## Session context contract

`loadSessionContext()` returns:

- `user`
  - `id`, `name`, `role`, `email`
  - `isVip`
  - `vipProfile`
- `tenant`
  - `clientId`, `clientName`, `industryCode`
- `recentEngagements`
  - top 5 active tenant engagements ordered by `updated_at desc`

`renderSessionContextBlock()` injects:

- user identity if known
- tenant name and industry if known
- VIP summary when `vip_profiles` exists
- recent active programs
- an instruction not to ask the user to identify themselves or the tenant

## `/api/v1/nexus/query` SSE contract

The route emits a text/event-stream response via `makeNexusStream()` and `encodeEvent()`.

Event names and payload shapes:

- `turn_started`
  - `{ type, turnId, mode, format }`
- `clarifying_question`
  - `{ type, question, options }`
- `retrieval_progress`
  - `{ type, phase, status, latencyMs? }`
- `content_delta`
  - `{ type, text? }`
- `source_attached`
  - `{ type, claimId, source }`
- `turn_complete`
  - `{ type, turnId, payload: { threadId, mode, format, latencyMs, strippedCount } }`
- `error`
  - `{ type, code: 'pipeline_error', recoverable: false, message }`

Current route behavior worth preserving:

- user turn is persisted before `runPipeline()`
- assistant turn is persisted after pipeline completion
- thread state is touched once the new Nexus turn becomes the third Nexus turn on the thread
- the route does not currently pass `onGateSignal`, so gate signals are parsed in the orchestrator but not acted on in this SSE route

## Changelog

- 2026-04-21: Initial contract doc authored from shipped source
