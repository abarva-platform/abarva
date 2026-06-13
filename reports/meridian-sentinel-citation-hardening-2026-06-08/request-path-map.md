# Meridian Sentinel/Nexus — Citation Hardening · Request-Path Map

Agent A · 2026-06-08 · READ-ONLY trace. All refs are `file:line` against the current branch.

Meridian identifiers: tenantId/clientId `6e419b6e-950d-4d34-a4fc-06c3e451a6c4`, app clientKey `meridian`, inventory/broker key `meridian-health`.

---

## 0. TL;DR

There are **three** answer pipelines. Only ONE is the live Sentinel chat answer path that Meridian CXOs hit:

| Pipeline | Entry | Produces sources? | Forwards to payload? | UI renders evidence? |
|---|---|---|---|---|
| **A. Intelligence Ask** (`askIntelligence`) | `POST /api/intelligence/ask` (general branch) | YES — rich `AskSource[]` w/ `sources` NDJSON event | YES — `route.ts:204` enqueues the event | **NO — both live UIs ignore the `sources` event** ← DROP POINT |
| **B. Sentinel Reasoning** (`runSentinelReasoning`) | `POST /api/intelligence/ask` (`it_productivity` branch only) | YES — `SentinelCitation[]` per stage | YES — `sentinel-stage` event | YES — `SentinelReasoningCards.tsx:308-327` renders citation pills |
| **C. Nexus Query** (`runPipeline`) | `POST /api/v1/nexus/query` (SSE) | YES — `Source[]` | YES — `source_attached` events + persisted on turn | (separate Nexus surface, not the Sentinel chat) |

**The hardening target is Pipeline A.** Evidence is fully retrieved and even streamed to the client, then **silently discarded by the React client** because neither `SentinelChat.tsx` nor `SentinelReasoningCards.tsx` reads `event.type === 'sources'`.

---

## 1. Request → Retrieval → Synthesis → Response → UI render map (Pipeline A)

1. **Request shape** — `src/app/api/intelligence/ask/route.ts:30-35` `AskPayload { query, requestedClient, surfaceContext, tabId }`. POST body `{ q|query, client, surfaceContext, tabId }` parsed at `route.ts:279-294`.
2. **Tenancy resolution** — `route.ts:62-90`. `resolveTenant({requestedClient, surfaceClientKey, surfaceActiveClient, allowFallback:false})` → `CanonicalTenant`; derives `tenantId` (= clientId UUID), `tenantClientKey` (= `meridian`), `tenantInventoryKey` (= `meridian-health`). For Meridian all three are populated.
3. **Intent gate** — `route.ts:135-147` `classifySentinelIntent(...)`. If `intent === 'it_productivity'` → **Pipeline B** (`route.ts:148-183`, `runSentinelReasoning`, `sentinel-stage` events). Otherwise → **Pipeline A** (`route.ts:184`).
4. **Pipeline A generator** — `src/lib/intelligence/ask/index.ts:99` `askIntelligence(query, opts)`. Event order: `classified` (`index.ts:111`) → retrieval (`index.ts:114-145`) → `sources` (`index.ts:151`) → `delta`* (`index.ts:206`) → `followups` (`index.ts:216`) → `done` (`index.ts:217`).
5. **Retrieval fan-in** — `index.ts:137-146` builds `rawSources` from:
   - `retrieveSurfaceContextSources` (`index.ts:114`)
   - `retrieveTenantStructuredFacts` (`index.ts:121`) — DB structured rows (apps/vendors/initiatives), `confidence 0.99`
   - `retrieveTenantEnterpriseSources` (`index.ts:116`) — `enterprise_context_chunks` + graph, `confidence 0.94-0.98`
   - `retrieveTenantTechnologySources` (`index.ts:122`)
   - `retrieveRetailOverlaySources` (`index.ts:123`) — apex-only overlay
   - `route(...)` (`index.ts:124`) — corpus/genome **patterns**, vendor, knowledge
   - `retrieveWorldview` (`index.ts:129`)
6. **Confidence** — computed `averageConfidence` at `index.ts:147-149` (mean of `source.confidence`). Also per-source `confidence` on every `AskSource`.
7. **Sources event emitted** — `index.ts:151` `yield { type:'sources', sources, coverageReport }`.
8. **Synthesis** — `synthesizeStream` (`src/lib/intelligence/ask/synthesizer.ts:272`). Consumes `sources` only as LLM prompt context (`synthesizer.ts:328`, `formatSourcesBlock` `:259-270`). Streams **text deltas only** — never re-emits sources. The system prompt explicitly instructs the model NOT to print inline citation IDs because "the UI renders sources separately" (`synthesizer.ts:212`).
9. **Route forwards events** — `route.ts:184-205`. The `sources` event IS forwarded: `route.ts:197-199` reads it (to count citations for telemetry), then `route.ts:204` `controller.enqueue(JSON.stringify(event))` enqueues **every** non-`done` event, including `sources`, as NDJSON.
10. **UI consume** — TWO live clients call `POST /api/intelligence/ask` and parse NDJSON:
    - `src/components/intelligence-v3/SentinelChat.tsx:186-215` — handles ONLY `delta` / `error` / `done`. **Never reads `sources` or `classified`.** Answer body = concatenated `delta` text (`SentinelChat.tsx:198-203`).
    - `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx:113-129` — handles `session` / `sentinel-stage` / `delta` / `error` / `done`. **Never reads `sources`.** For Pipeline A it shows `fallbackText` (plain delta text, `:250-254`) with no evidence.

→ **Evidence basis is retrieved, scored, and streamed to the browser, then dropped by the client because no handler reads the `sources` event.**

---

## 2. Evidence-type matrix

| Evidence type | Where produced (file:line) | Provenance fields it carries | Survives to NDJSON payload? | UI renders it? |
|---|---|---|---|---|
| **Client context chunks** (`enterprise_context_chunks`) | `tenant-enterprise-context.ts:144-168` (segment chunks); raw rows via `ContextChunk` (`tenant-data/types.ts:146-166`: `chunkId`, `sourceSegmentId`, `sourceDoc`, `recordId`, `vectorScore`) | Provenance EXISTS on `ContextChunk` but is **flattened into a prose `detail` string** by `formatChunk` (`tenant-enterprise-context.ts:1089-1094`). `TenantEnterpriseSource` (`:19-25`) has NO provenance array. | YES (inside `sources[].detail` text) | NO |
| **Client structured records** (`applications`, `vendor_contracts`, `ai_initiatives`, `clients`) | `tenant-enterprise-context.ts:411-751`; structured facts `:356-409` | Row IDs (`vendor_id`, `initiative_id`, derived `APP-` refs, `clients[id]`) embedded in `detail` prose. `confidence 0.97-0.99`. No structured citation object. | YES (in `detail`) | NO |
| **Healthcare corpus patterns** (`public.corpus_patterns`) | `retrievers/pattern.ts:90-110` `buildCorpusSource` via `searchCorpus` (`corpus/retrieval.ts:122-151`). Industry-scoped to Meridian via `verticalOverlays` (`pattern.ts:59-70`, `allowedCorpusIndustryScopes`). | `id` = slug, `name` = title, `confidence` = hit score; `source_basis`, `category`, `depth_score`, `industry_scope` flattened into `detail` (`pattern.ts:96-102`). | YES | NO |
| **Genome patterns** (`genome_patterns`, F-codes) | `pattern.ts:36-51` `buildSource` | `id` = F-code, `name`, `confidence` (0.95/0.85/0.70); failure_rate/category/vertical in `detail`. | YES | NO |
| **Per-source provenance object** | NOT produced for Pipeline A. `AskSource` (`ask/types.ts:32-39`) = `{type,name,id,detail,url?,confidence?}` only. A ready-made `IntelligenceProvenanceGrounding` type exists (`intelligence/types.ts:94-101`: `sourceType, sourceId, sourceTitle, confidence, sourceBasis, lastUpdated`) but is **not wired into Ask**. | — | NO | NO |
| **Confidence** | per-source on each `AskSource`; aggregate `averageConfidence` (`index.ts:147-149`); also corpus `confidence`/`depth_score`. | n/a | YES (per-source `confidence` is on each item in the `sources` event); aggregate is NOT emitted (only used as private LLM hint, `synthesizer.ts:298-301`) | NO |
| **Coverage report** | `assertCoverage` (`index.ts:150`), emitted on `sources` event (`index.ts:151`) | category/missing-evidence | YES | NO |
| **Sentinel reasoning citations** (Pipeline B ONLY) | `SentinelCitation[]` (`sentinel-reasoning/types.ts:13-20`: `id, label, sourceType, version, url, detail`) per `SentinelReasoningStage` (`:46-60`, w/ `confidence`, `corpusVersionPinned`) | Full structured citation | YES (`sentinel-stage` event) | **YES** — `SentinelReasoningCards.tsx:308-327` pills |

---

## 3. Exact drop point(s)

**Primary drop point — the client, not the server.** Sources reach the browser but no handler consumes them:

- `src/components/intelligence-v3/SentinelChat.tsx` → `handleMessage` NDJSON loop, `:186-215`. The `switch`/`if` ladder only matches `delta`, `error`, `done`. There is **no `if (event.type === 'sources')` branch**. The streamed `sources` line is `JSON.parse`d (`:188`) and then thrown away. This is the live "The Brief"/AgentDock chat surface for Meridian.
- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx` → `ask()` NDJSON loop, `:113-129`. Same omission — no `sources` branch; Pipeline A answers fall through to `fallbackText` (`:121-122`, rendered `:250-254`) with zero evidence.

**Secondary (modeling) drop point — provenance flattened in retrieval.** Even if the client rendered `sources`, structured provenance (sourceDoc / chunkId / recordId / segment) is lossy because:
- `tenant-enterprise-context.ts:1089-1094` `formatChunk` collapses `chunk.sourceDoc` + text into one prose line inside `detail`.
- `tenant-enterprise-context.ts:156-168` builds `TenantEnterpriseSource` with only `{type,name,id,detail,confidence}` — the `ContextChunk.chunkId`/`sourceSegmentId`/`recordId` (available at `:145-148`) are not carried onto the source object.
- `retrievers/pattern.ts:96-102` likewise flattens `provenance.source` / `source_basis` / `category` into `detail`.

So the UI fix alone (render the `sources` event) restores **named, confidence-scored, per-source evidence pills** immediately. A second, smaller step promotes the already-known chunk/record IDs into a structured provenance field for "open the underlying row/doc" affordances.

---

## 4. Minimal patch recommendation (smallest change, no isolation weakening, no invented citations)

**Step 1 (necessary + sufficient to display evidence basis): render the `sources` event in the two clients.**
- `SentinelChat.tsx:186-215` — add `if (event.type === 'sources') { setSources(event.sources ?? []) }` and attach the sources to the agent turn; render them as pills below the answer body (reuse the exact pill markup pattern already proven in `SentinelReasoningCards.tsx:308-327`). Each `AskSource` already has `name`, `id`, `confidence`, `detail`, optional `url` — enough for a labeled pill with a confidence badge and hover `detail`.
- `SentinelReasoningCards.tsx:113-129` — add the same `sources` branch so Pipeline A (the `fallbackText` path) shows pills too.
- These are **client-only, read-only** changes. No new fields, no new server round-trips, no isolation surface touched.

**Step 2 (citation-gap correctness): make "citation gap" key off real source presence.**
- Today the only answer-time "no evidence" copy is the `!sawDelta` fallback (`SentinelChat.tsx:218-226`) and the empty-corpus prompt note (`synthesizer.ts:265`) — neither reflects whether the `sources` event was non-empty. After Step 1, gate a "citation gap" / "advisory from domain expertise (no tenant/corpus citations)" badge on `sources.length === 0` from the actual event. The route already counts this (`route.ts:198`). This shows the gap **only when citations are truly absent** and never when sources were retrieved.
- The existing "Citation gaps" UI in `EvidenceDatasetDrawer.tsx:435-444` is a **dataset-coverage admin widget** (counts `view.totalMissingCitations` from a read-model), unrelated to answer-time evidence — leave it; do not conflate.

**Step 3 (optional, deeper provenance — only if "open source row" is wanted): carry structured provenance on `AskSource`.**
- Add an optional `provenance?: { sourceDoc?, chunkId?, recordId?, segmentId? }[]` (or reuse `IntelligenceProvenanceGrounding` from `intelligence/types.ts:94-101`) to `AskSource` (`ask/types.ts:32-39`).
- Populate it where the IDs already exist: `tenant-enterprise-context.ts:156-168` (from the `group.chunks` `ContextChunk`s) and `pattern.ts:90-110` (slug/version/source_basis). This is additive; `detail` stays as the LLM-facing prose. No new query, no isolation change.

Do **not** weaken `formatSourcesBlock`/synthesizer behavior — the model must keep citing in prose, not inline IDs (`synthesizer.ts:212`). Rendering happens from the `sources` event, exactly as the prompt already assumes.

---

## 5. Tenant-isolation-sensitive spots (do not regress)

- **Tenancy resolution** `route.ts:62-90` — `allowFallback:false`; never default a tenant. Step-1/2 changes are client-side and must not synthesize a client key.
- **Client scoping in retrieval** — every structured/chunk query is `WHERE client_id = $1` (`tenant-enterprise-context.ts:298,419,452,481,508,549,664,697,727`), `client_id` resolved by `resolveClientIdForTenantKey` (`:604-617`) via tenant aliases. Provenance promotion (Step 3) must copy only IDs from rows already returned under this scope — never re-query without `client_id`.
- **Corpus industry scoping** — `pattern.ts:59-88` filters corpus/genome hits to the tenant's allowed verticals (`allowedCorpusIndustryScopes`, `patternRowMatchesTenant`). Meridian gets healthcare scope; do not surface a pattern that failed this filter as a citation.
- **Identity pin + leak guards** — `synthesizer.ts:309` `buildTenantIdentityPin`, `:368-396` `detectCrossTenantIdentityLeak` / `detectOffTenantMention`. These run on the answer TEXT; rendering `sources` pills bypasses the text guard, so any pill label that echoes tenant identity should still come only from same-tenant `AskSource` objects (it does — all sources are tenant-scoped by §5 above). No new exposure.
- **`/api/v1/nexus/query`** `requireTenancy()` (`_intel-auth.ts:16-37`) scopes by `getActiveClientRow()` clientId — Pipeline C already forwards + persists `sources` correctly (`v1/nexus/query/route.ts:104-121`); use it as the reference contract, not a thing to change.

---

## Explicit answers to the brief's questions

- **Does retrieval already produce per-source provenance (file/row/sheet/chunk) for Meridian?** Partially. The raw `ContextChunk` carries `chunkId`/`sourceSegmentId`/`sourceDoc`/`recordId` (`tenant-data/types.ts:146-166`) and structured rows carry their IDs, but the `AskSource` objects only keep a flattened `detail` string + `id`/`name`/`confidence`. No structured provenance array survives onto the source (`ask/types.ts:32-39`; flattening at `tenant-enterprise-context.ts:1089-1094`, `pattern.ts:96-102`).
- **Do healthcare corpus patterns reach the synthesizer/answer for Meridian, with identifiers?** Yes. `route` → `retrievePattern` → `searchCorpus` over `public.corpus_patterns`, industry-scoped to Meridian healthcare, with `id`=slug, `name`=title, `confidence`, `source_basis`/`category`/`depth_score` in `detail` (`pattern.ts:90-110`). They enter the `sources` event and the synthesizer prompt — but the client drops them.
- **Exact line where sources are available but not forwarded into the response (the drop point)?** Not the server — `route.ts:204` enqueues the `sources` event. The drop is in the **clients**: `SentinelChat.tsx:186-215` and `SentinelReasoningCards.tsx:113-129` have no `event.type === 'sources'` handler, so the parsed event is discarded.
- **What does the UI render for evidence today, and what would it render with the payload?** Today Pipeline A renders only the streamed answer text (no pills). Pipeline B (`it_productivity`) already renders citation pills (`SentinelReasoningCards.tsx:308-327`). With Step 1, Pipeline A would render the same style of pills (name + confidence badge + hover detail) from the existing `sources` event.
- **Is confidence computed?** Yes — per-source `confidence` on every `AskSource` (set in each retriever) and aggregate `averageConfidence` at `index.ts:147-149`; the aggregate is used privately as an LLM calibration hint (`synthesizer.ts:298-301`) and not currently shown.
