# Source Nexus API Stub Review

Date: 2026-04-25

Slice: Source-specific Nexus API route stub.

## Files Changed

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
- `src/lib/source/nexus-api.ts`
- `src/lib/source/index.ts`
- `CYCLE_STATE.md`
- `docs/abarva-source/build-pack/implementation-reviews/19_SOURCE_NEXUS_API_STUB_REVIEW.md`

## Route Behavior

Route:

```text
POST /api/v1/source/[eventId]/nexus/ask
```

Behavior:

1. Requires existing v1 tenancy/auth resolution.
2. Accepts a JSON body with `prompt`, `mode`, `focusArea`, `userRole`, `selectedAttachmentIds`, and optional `stageKey`.
3. Builds a deterministic `SourceAgentContextBundle` from the existing seeded Source context builder.
4. Runs the deterministic context validation readable report.
5. Runs the deterministic workflow validation readable report.
6. Builds the deterministic Source multi-agent briefing.
7. Returns a structured JSON response with `noModel: true`.
8. Does not persist state.
9. Does not create a chat thread.
10. Does not parse files.
11. Does not mutate workflow or event state.

The route is intentionally a no-model runtime preflight. It is not the final Source chat or agent experience.

## Request Shape

Accepted request fields:

```ts
{
  prompt?: string;
  mode?: 'dashboard' | 'event' | 'stage' | 'evidence' | 'workflow' | 'executive' | 'lowContext';
  focusArea?: string;
  userRole?: SourceUserRole;
  selectedAttachmentIds?: string[];
  stageKey?: SourceStageKey;
}
```

If the request body is empty, the route defaults to a deterministic command-read prompt.

If the request body is malformed JSON, the route returns:

```json
{
  "ok": false,
  "error": "bad_request",
  "detail": "Malformed JSON request body.",
  "noModel": true
}
```

## Response Shape

Successful responses include:

- `ok`
- `httpStatus`
- `requestId`
- `eventId`
- `prompt`
- `mode`
- `generatedAt`
- `noModel: true`
- `answerStatus`
- `contextScope`
- `contextQuality`
- `context`
- `multiAgentBriefing`
- `nexusSummary`
- `suggestedActions`
- `contextValidationSummary`
- `workflowValidationSummary`
- `warnings`
- `defers`
- `cannotProceedReasons`
- `summary`

Deterministic error responses are returned for missing or unknown event ids.

## Deterministic Components Used

- `buildSourceContextAssemblyResultFromSeed`
- `getSourceContextValidationReadableReport`
- `getSourceWorkflowValidationReadableReport`
- `buildSourceMultiAgentBriefing`
- `getSourceMultiAgentSuggestedActions`
- `summarizeSourceMultiAgentBriefing`

The implementation uses the seeded Source context, context validation foundation, workflow validation foundation, and deterministic multi-agent briefing layer. It does not call OpenAI, Anthropic, or any model provider.

## Auth And Tenant Handling

The route uses the existing `/api/v1` tenancy helper:

```ts
requireTenancy()
```

This provides:

- authenticated user check
- active client check
- user/client identifiers for the deterministic Source context bundle

Known gap:

- Source does not yet have a production persistence model, so the route cannot validate a real Source event row against a tenant-owned database table.
- Current event lookup is deterministic seeded context only.
- A future persistence slice must enforce real Source event ownership before production use.

The stub does not weaken existing auth and does not invent a new tenant model.

## Validation Results

Passed:

```text
npx eslint 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/lib/source/nexus-api.ts src/lib/source/index.ts
npx tsc --noEmit --pretty false
```

## Smoke Check Result

Command used:

```text
npx tsx -e "import { SOURCE_GOLDEN_EVENT_IDS, createSourceNexusApiStubResponse } from './src/lib/source'; const response = createSourceNexusApiStubResponse({ eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization, prompt: 'What should Nexus do next?', mode: 'event', userRole: 'sourcingLead', tenant: { tenantId: 'tenant-smoke', tenantName: 'Smoke Tenant' }, user: { id: 'user-smoke', email: 'smoke@example.com' } }); console.log(JSON.stringify({ ok: response.ok, noModel: response.noModel, eventId: response.eventId, answerStatus: response.answerStatus, contextScope: response.contextScope, hasBriefing: Boolean(response.multiAgentBriefing), nexus: response.nexusSummary?.primaryFinding, suggestedActions: response.suggestedActions.length, contextVerdict: response.contextValidationSummary?.verdict, workflowVerdict: response.workflowValidationSummary?.verdict, defers: response.defers.length }, null, 2)); if (!response.noModel || !response.multiAgentBriefing || response.eventId !== SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) process.exit(1);"
```

Result:

```json
{
  "ok": true,
  "noModel": true,
  "eventId": "evt-source-data-ai-si-selection",
  "answerStatus": "blocked",
  "contextScope": "event",
  "hasBriefing": true,
  "nexus": "Data & AI Modernization SI Selection cannot move cleanly until 4 missing inputs are resolved.",
  "suggestedActions": 16,
  "contextVerdict": "defer",
  "workflowVerdict": "defer",
  "defers": 3
}
```

## Known Gaps

- No production Source persistence yet.
- No real Source event tenant ownership check yet.
- No Source-specific role matrix yet.
- No model calls.
- No chat UI.
- No upload/parsing.
- No artifact generation.
- No workflow mutation.
- No route-level integration tests yet.

## Confirmation

No model calls, UI changes, upload/parsing, persistence, chat thread storage, workflow engine, approval engine, artifact versioning, document export/import, event canvas, scorecard UI, artifact drawer, value ledger UI, vendor flow, AI/RFP generation, `/programs`, `/preview`, or `/demo` work was done.
