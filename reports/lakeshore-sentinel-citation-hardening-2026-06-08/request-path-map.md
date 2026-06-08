# Lakeshore "Sentinel Intel" Citation Gap — Request-Path Map & Minimal Patch

Agent A — Retrieval & Evidence Binding · 2026-06-08
Worktree: `/Users/anand/Projects/nexus-disc` (branch `sentinel-citation-hardening`, includes PR #3321)
Scope: READ-ONLY analysis. No source edits, no app run, no DB.

---

## TL;DR

Evidence IS retrieved with full provenance and IS emitted by the server as a
`{ type: 'sources', sources: AskSource[] }` NDJSON event. The **client chat
component never reads that event** — its stream reader only consumes `delta` /
`text` / `error` / `done`. The agent turn it builds carries no citation data,
and the "Citation gap" banner is then decided by a _plain-text heuristic over the
answer body_ (`shouldShowPlainTextCitationGap`). Because the synthesizer prompt
deliberately tells the model NOT to emit inline bracket IDs ("the UI renders
sources separately"), the body has no citation markup → the heuristic always
fires → "Citation gap" shows on a fully-grounded answer.

Seam class: **(c) payload reaches the client but the client drops the citation
field + (e) UI render-gate (heuristic) hides truth.** This is the same family as
the prior "data present, gate hides it" bug.

The "0 proof points" footer is a **separate, brief-side** bug: the Lakeshore
read-model hardcodes `proofPoints: []`.

---

## 1. Which endpoint the chat POSTs to (confirmed by reading the client)

- Host surface: `src/components/intelligence-v4/IntelligenceBrief.tsx:468` renders
  `<SentinelChat …>` (import at `:26`). Footer "… proof points" at `:446`.
- Chat component: `src/components/intelligence-v3/SentinelChat.tsx`.
- **POST target:** `src/components/intelligence-v3/SentinelChat.tsx:158`
  → `fetch('/api/intelligence/ask', { method: 'POST', … body: { q, client, surfaceContext } })`.
  NOT `/api/v1/sentinel/query` and NOT `/api/v1/nexus/query`. (Those endpoints exist
  and are used elsewhere — `useNexusStream`, Source canvas — but the Lakeshore
  Intelligence brief chat uses `/api/intelligence/ask`.)

Server handler: `src/app/api/intelligence/ask/route.ts` (`POST` → `handleAsk` →
streams NDJSON). Two answer paths inside the stream:

- `it_productivity` intent → `runSentinelReasoning(...)` emitting `sentinel-stage`
  events whose `stage.citations` are counted (`route.ts:168`) but only the count
  is kept; the citations objects are streamed inside `stage` (`route.ts:169`).
- default path → `askIntelligence(...)` (`route.ts:184`), which yields a `sources`
  event (`route.ts:197`) that the route **forwards verbatim** to the client
  (`route.ts:204`, the generic `controller.enqueue(JSON.stringify(event))`).

So the route does NOT strip sources — it passes them through.

## 2. Where corpus/tenant evidence is retrieved & whether rows carry provenance

Retrieval lives under `src/lib/intelligence/ask/` (orchestrated by
`index.ts` → `router.ts` + retrievers). Sources are assembled at
`src/lib/intelligence/ask/index.ts:137-146` (`rawSources = [...surface, ...routed.sources, ...worldview.sources]`).

Provenance IS present on every row. `AskSource` shape — `src/lib/intelligence/ask/types.ts:32-39`:
`{ type: SourceType; name: string; id: string | null; detail: string; url?; confidence? }`.

Concrete provenance per retriever:

- `retrievers/retail-overlay.ts:81-83` — `type:'PATTERN'`, `id: row.chunk_id`,
  reads `public.enterprise_context_chunks` (`:129`); carries `pattern_id`/`chunk_id`.
- `retrievers/pattern.ts:45-47` & `:104-106` — `type:'PATTERN'`, `id: row.code ?? row.id`
  / `id: hit.slug` (genome_patterns → corpus_patterns fallback), `name` = pattern title.
- `retrievers/knowledge.ts:53,70-71` — `id: r.id`, `name: r.title` from knowledge rows
  (source_key, title, publisher, content_type).
- `retrievers/vendor.ts` — `type:'VENDOR'`, vendor/product name + id.
- `retrievers/surface-context.ts:56-89` — `type:'SURFACE' | 'TENANT' | 'GRAPH'`,
  `id` = clientKey/activeTab, scoped to the active client.

Tenant isolation: retrievers receive `clientId` / `tenantInventoryKey`
(`pattern.ts:125`, `retail-overlay.test.ts:19`, route resolves it via
`resolveTenant({ allowFallback: false })`, `route.ts:66-79`). Scoping is enforced at
retrieval; the patch below must NOT relax it — pass the already-scoped `AskSource`
list straight through.

## 3. How retrieved context reaches the model

`src/lib/intelligence/ask/index.ts:192` calls `synthesizeStream({ … sources … })`.
`synthesizer.ts:259-270` `formatSourcesBlock(sources)` injects each source into the
prompt as `[SOURCE n · TYPE · name]\n detail`. **The model DOES see source
type/name/detail.** But `synthesizer.ts:212` instructs:

> "Do not output source citations inline as bracketed IDs — the UI renders sources
> separately. Cite evidence in prose…"

So by design the answer body contains NO machine-detectable citation markup. Source
IDs are NOT stripped from the model input; they are intentionally kept out of the
output text because the contract is that the UI renders the `sources` event
separately — a contract the current client never fulfills.

## 4. Exact shape of the answer payload to the UI

Streamed NDJSON events (`src/lib/intelligence/ask/index.ts:35-37`,
`:111,:151,:156,:158,:159`):

- `{ type:'classified', classification }`
- `{ type:'sources', sources: AskSource[], coverageReport }` ← **the citations payload**
- `{ type:'delta', text }` (many)
- `{ type:'followups', followups }`
- `{ type:'done' }`

A dedicated citations/sources field DOES exist (the whole `sources` event). It is
populated for grounded answers. The route forwards it (`route.ts:204`). It is the
**client** that lacks any handler for it.

## 5. Render condition for "Citation gap" and "0 proof points"

Citation gap (chat): `src/components/agent/AgentDock.tsx:803-806` renders
`<CitationGapNotice compact />` when
`shouldShowPlainTextCitationGap(turn.body, surfaceContext)` is true.
Gate logic — `src/lib/agent/citation-gap.ts:32-41`: true when body looks substantive
(`hasSubstantiveClaimText`, `:13`) AND has no citation markup
(`hasAgentCitationMarkup` looks for `{{cite:`, `[user-context:`, `[tenant-specific:`,
`<abv-source`, `Source basis:`, or `[PAT-…]`, `:3-22`) AND surfaceContext has no
`evidenceContext.usableEvidenceCount > 0` (`:24-30`).
→ A grounded Lakeshore answer (prose, no bracket IDs, surfaceContext without
`evidenceContext`) trips all three → banner shows. Banner text:
`src/components/agent/CitationGapNotice.tsx:36` ("…has no source citations attached").

Note the richer renderer `AgentResponse.tsx:100,125` uses a _structured_ gate
`shouldShowRenderedResponseCitationGap` keyed on `response.citations.length === 0`
(`citation-gap.ts:43-51`) — but `SentinelChat`/`AgentDock` do NOT use
`AgentResponse`; they render plain `turn.body` (`AgentDock.tsx:807-809`).

"0 proof points" footer (brief, not chat): `IntelligenceBrief.tsx:446`
`{data.proofPoints.length} proof points`. For Lakeshore the read-model hardcodes
`proofPoints: []` at `src/lib/intelligence-v3/lakeshore-live.ts:621`. Separate root
cause; same "evidence not bound to the surface read-model" family.

## 6. THE SEAM (precise)

The lost-evidence point is in the **client stream reader**:
`src/components/intelligence-v3/SentinelChat.tsx:186-216`. The loop parses each
NDJSON line into `{ type, delta, text, error, telemetryEventId }` and only acts on
`delta` (append to `answer`), `error`, and `done` (capture `telemetryEventId`). There
is **no `case` for `type === 'sources'`**. The `AskSource[]` payload is parsed and
discarded. The agent `DockMessage` it builds (`:199-213`) carries only `body` +
`feedbackEventId`; `AgentDock`'s `ChatMessage` type (`AgentDock.tsx:173-181`) has no
`citations` field at all.

Classification: **(c)** payload arrives but client has no citation field/handler,
compounded by **(e)** the UI gate (`shouldShowPlainTextCitationGap` over `turn.body`)
hides the truth. NOT (a) retrieval — provenance is present. NOT (b) synthesis — the
route forwards sources untouched. (d) is by-design (model told not to inline-cite),
which is fine ONLY because a separate-rendering contract was promised but never wired
on this surface.

---

## Files + functions that must change (smallest end-to-end patch)

Goal: carry the real `AskSource[]` from the stream onto the agent turn, render it as
a sources/citation block, and make the gap gate evidence-aware — WITHOUT inventing
citations and WITHOUT silencing the banner when `sources` is genuinely empty.

1. `src/components/agent/AgentDock.tsx`
   - Extend `ChatMessage` (`:173-181`) with optional `citations?: AgentDockCitation[]`
     (a minimal `{ type; name; id; detail?; url? }`, mirroring `AskSource`).
   - In the agent-turn render (`:802-810`): when `turn.citations?.length` > 0, render a
     compact "Sources" list (type · name, link if `url`) below the body and pass a
     truthy signal so the gap banner is suppressed; change the gate at `:804` to
     `turn.role === 'agent' && (turn.citations?.length ?? 0) === 0 &&
shouldShowPlainTextCitationGap(turn.body, surfaceContext)`. (Banner still shows
     when there genuinely are zero sources.)

2. `src/components/intelligence-v3/SentinelChat.tsx`
   - In the reader loop (`:186-216`) add handling for `event.type === 'sources'`:
     map `event.sources` (filter to those with a real `id`/`name`) onto the
     in-flight `agentTurnId` turn's new `citations` field via `setLocalTurns`.
     Widen the inline event type (`:188-194`) to include
     `sources?: Array<{ type:string; name:string; id:string|null; detail?:string; url?:string }>`.
   - (Optional, nice-to-have) thread `coverageReport` for a future evidence drawer;
     not required for the banner fix.

That is the complete chat-citation fix: two files, no server change (sources already
emitted + forwarded). Tenant isolation is untouched because the client merely renders
the already-scoped `AskSource` list the server produced.

### Separate follow-up (footer "0 proof points") — out of the chat seam

3. `src/lib/intelligence-v3/lakeshore-live.ts:621` — `proofPoints: []` must be
   populated from the loaded Lakeshore corpus (the same `enterprise_context_chunks` /
   patterns the chat retrieves), or the footer at `IntelligenceBrief.tsx:446` will
   keep reading 0. This is a read-model population task, not a wiring fix; flag for
   the brief/read-model owner. Do not fabricate a count — bind real ledger rows.

### What NOT to do

- Do not delete/disable `CitationGapNotice` or weaken `shouldShowPlainTextCitationGap`
  globally — the banner must still fire for genuinely uncited answers.
- Do not force the model to emit inline bracket IDs to satisfy the heuristic; the
  correct contract is the structured sources event, now consumed.
- Do not loosen `resolveTenant({ allowFallback:false })` or retriever `clientId`
  scoping.

## Tenant-isolation considerations in the retrieval path

- `route.ts:66-79` resolves tenant with `allowFallback:false`; `sentinelClientId` and
  `tenantInventoryKey` derive from the canonical tenant, not raw client input.
- Retrievers are passed `clientId`/`tenantInventoryKey` (`pattern.ts:125`,
  `retail-overlay`), so `enterprise_context_chunks` / pattern rows are already
  client-scoped before becoming `AskSource`s. The UI patch only renders what the
  server already scoped — it introduces no new tenant-leak surface.
