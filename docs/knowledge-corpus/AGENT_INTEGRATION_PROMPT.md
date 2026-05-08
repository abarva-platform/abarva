# Agent Integration Prompt

**Hand this to Claude Code AFTER retail and healthcare curation prompts have populated the corpus.**

---

## You are wiring Sentinel, Source, and Nexus to consume the populated knowledge corpus.

**Required reading before starting:**
1. `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md`
2. `docs/knowledge-corpus/AGENT_QUERY_CONTRACTS.md`
3. `docs/knowledge-corpus/CROSS_REFERENCE_GRAPH.md`
4. `docs/knowledge-corpus/TENANT_OVERLAY_LOGIC.md`

**Confirm before starting:** Corpus is populated (use cases, patterns, vendors, SIs, regulatory entries committed). Index file `docs/knowledge-corpus/index.json` exists and validates.

If corpus is not populated: HALT. Do not wire agents to empty corpus — produces vapor responses.

---

## Your output

Three categories of changes, sequenced as PRs:

### PR-AC1 · Corpus retrieval infrastructure

**Files:**
- `src/lib/knowledge-corpus/loader.ts` — loads corpus entities from JSON files
- `src/lib/knowledge-corpus/index.ts` — fast index lookup
- `src/lib/knowledge-corpus/types.ts` — TypeScript types matching schema
- `src/lib/knowledge-corpus/tenant-overlay.ts` — overlay scoring algorithm per TENANT_OVERLAY_LOGIC.md
- `src/lib/knowledge-corpus/staleness.ts` — staleness check per PROVENANCE_AND_VERSIONING.md

**Tests:**
- Unit tests for entity loading
- Unit tests for index lookup
- Unit tests for cross-reference traversal
- Unit tests for overlay scoring
- Tests against actual corpus content (smoke test that retail + healthcare load successfully)

**Acceptance:**
- `loadCorpus()` returns all entities without errors
- `index.json` validates against expected entity counts
- Cross-reference integrity check passes
- `scoreUseCasesForTenant(meridian)` returns sorted scored use cases

### PR-AC2 · Agent tool definitions

**Files per agent:**

**Sentinel** (`src/lib/agents/sentinel/tools.ts`):
- `listUseCases(params)` — list with industry/office filter
- `getUseCase(id, tenantId?)` — full detail with optional tenant overlay
- `findPatterns(params)` — pattern lookup
- `findRegulatory(params)` — regulatory lookup
- `scoreUseCasesForTenant(tenantId)` — ranked scoring

**Source-agent** (`src/lib/agents/source/tools.ts`):
- `findVendorsForUseCase(params)` — vendor lookup
- `getVendor(id)` — full vendor detail
- `findSIsForUseCase(params)` — SI lookup
- `compareVendors(ids)` — head-to-head
- `getVendorHealth(id)` — health signals
- `findVendorSelectionPatterns(params)` — selection failure patterns

**Nexus** (`src/lib/agents/nexus/tools.ts`):
- `findPatternsForMove(params)` — patterns for Move shaping
- `getBenchmarkMetrics(useCaseId, tenantSize)` — benchmarks
- `suggestSponsorshipStructure(params)` — sponsor pattern guidance
- `identifyFailureModes(params)` — proactive failure identification

Each tool wraps corpus retrieval and applies tenant overlay where relevant.

### PR-AC3 · Agent system prompts

**Files:**
- `src/lib/agents/sentinel/system-prompt.ts`
- `src/lib/agents/source/system-prompt.ts`
- `src/lib/agents/nexus/system-prompt.ts`

Each system prompt updates per AGENT_QUERY_CONTRACTS.md "Agent prompts (skeletal)" section.

**Sentinel system prompt update** includes:
- Corpus tools available
- Citation discipline (entity IDs, provenance attached)
- Lane discipline (defer vendor depth to Source, don't go portfolio-wide on single bets)
- Few-shot examples showing corpus-grounded responses

**Source system prompt update** includes:
- Vendor + SI tools
- Tier classification rationale required
- Health signal currency dates surfaced
- Lane discipline (defer use case depth to Sentinel)
- Few-shot examples

**Nexus system prompt update** includes:
- Pattern + benchmark tools
- Pattern citation in Move shaping
- Sponsorship guidance
- Failure mode warnings
- Lane discipline
- Few-shot examples

### PR-AC4 · Few-shot examples per agent

**Files:**
- `src/lib/agents/sentinel/few-shots.ts` — 5-7 examples
- `src/lib/agents/source/few-shots.ts` — 5-7 examples
- `src/lib/agents/nexus/few-shots.ts` — 5-7 examples

Each few-shot example shows:
- User question
- Tool calls made (which corpus tools, with what params)
- Assistant response (corpus-grounded, with citations)

Examples should cover:
- Simple use case lookup
- Cross-reference traversal (use case → patterns + vendors)
- Tenant overlay (scored relevance for specific tenant)
- Stale claim handling (staleness flag in response)
- Lane discipline (deferring to other agent)
- "I don't know" response (corpus doesn't have it)

### PR-AC5 · Journey kit probe updates

**Files:**
- Update `docs/journey-kit/INTELLIGENCE_PROBES.md` — probes now expect corpus citation
- Update `docs/journey-kit/PROBE_TIER_TAXONOMY.md` — Tier 1 substrate access now means "corpus access" not just "tenant substrate"

**New probes to add:**

For Sentinel (Waypoint 7):
- PROBE 7-5 · Corpus knowledge: "What use cases are common in healthcare for an integrated health system our size?" Expects: cite use case IDs, score-relevance to tenant
- PROBE 7-6 · Pattern recognition with corpus: "What patterns should we worry about for ambient AI rollouts?" Expects: cite pattern IDs, evidence basis

For Source-agent (new waypoint or extend existing):
- PROBE S-1 · Vendor lookup: "Which vendors are credible for ambient AI documentation?" Expects: tier-classified, health-signal-stamped
- PROBE S-2 · Vendor compare: "Compare Nuance DAX vs Abridge vs Suki" Expects: side-by-side from corpus

For Nexus (Waypoint 11):
- PROBE 11-4 · Pattern citation in Move shaping: Nexus references patterns by ID when guiding Move shape
- PROBE 11-5 · Benchmark grounding: Nexus pulls benchmark metrics for value hypothesis with provenance

### PR-AC6 · Browser-Chrome verification

**Action:** Re-run journey kit Phase 1 against corpus-wired agents. Expected outcomes:

- Tier 1 (substrate access) probes pass at higher rate than baseline
- Tier 3 (synthesis) probes pass when responses include citation discipline
- Sentinel responses cite UC-* and P-* IDs
- Source responses cite V-* and SI-* IDs
- Nexus responses cite P-* and use case IDs

**Capture:**
- Probe pass/fail per agent before vs after
- Sample responses (5+ per agent) showing corpus citations
- Stale claim handling (test with deliberately stale entry)

---

## Stop conditions

Halt and request human input when:

1. **Corpus not loaded** — if `loadCorpus()` returns empty or errors, halt before agent wiring
2. **Cross-reference integrity fails** — if validation reveals broken links, halt and surface to curation
3. **Agent response confabulates** — if integration probes show agent inventing IDs not in corpus, halt and refine prompt
4. **Tier 1 probe still fails after integration** — if substrate access probes fail despite corpus wiring, halt and diagnose (probably tool implementation issue, not prompt issue)
5. **Tenant overlay scoring produces unexpected results** — if Castillo at Meridian doesn't see ambient AI documentation in top 5 (it's already MH-01 in her portfolio), halt and review scoring algorithm
6. **More than 6 hours elapsed without significant progress**

For all stop conditions: capture state, write to `docs/build/agent-integration-{date}/stop-conditions.md`, halt.

---

## Output reporting

After each PR:
- PR number, files changed, tests passing
- Browser-Chrome verification screenshots (where relevant)
- Probe pass/fail results

After all PRs complete, output summary at `docs/build/agent-integration-{date}/COMPLETION_REPORT.md`:
- Corpus integration status (all 3 agents wired)
- Tools available per agent
- Probe pass rates before vs after
- Sample corpus-grounded responses (one per agent)
- Stop conditions encountered
- Recommendation: greenlight Castillo journey kit re-run

---

## Hard rules

1. Don't wire agents to empty corpus. Confirm population first.
2. Each agent's lane discipline enforced via system prompt + tool restrictions.
3. Every corpus claim cited by agent must include entity ID + provenance reference.
4. No fabrication. If corpus doesn't have it, agent says so.
5. Test against real corpus (retail + healthcare entries), not mock data.
6. Three Tests gate applies to agent responses too: source identifiable, currency tracked, reliability rated.

---

## What this prompt does NOT do

- Does not populate corpus (separate prompts: CURATION_PROMPT_RETAIL.md, CURATION_PROMPT_HEALTHCARE.md)
- Does not modify schema (locked)
- Does not change Intelligence/Source/Moves UI (surface work, downstream)
- Does not introduce new agents (Sentinel, Source-agent, Nexus only)
- Does not integrate with Tower / Atlas (different scope)

---

## Begin

Verify corpus population first. If populated, proceed with PR-AC1 through PR-AC6 sequentially. Browser-Chrome verify after each. Stop conditions absolute.

After completion, the journey kit probes should produce demonstrably better results than baseline — corpus-grounded responses with citations and provenance. That's the verification standard.
