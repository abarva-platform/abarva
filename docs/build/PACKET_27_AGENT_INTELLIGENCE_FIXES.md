# Packet 27 — Agent Intelligence Fixes (Codex hand-off)

**Trigger:** post-Northstar dry-run agent intelligence audit (2026-05-26 08:51 UTC) found 3 critical gaps + 1 hallucination risk that limit Sentinel to "smart medtech consultant" tier instead of "your CIO's second brain." This packet specifies the fixes.

**Demo pressure:** Tomorrow's CXO demo. These fixes are NOT blocking the demo (we have a workaround — coach questions to agent's strengths). They ARE blocking the path to a $750K/yr deal that depends on the agent passing scrutiny on named-entity questions.

**Estimated total Codex effort:** 3-4 days, parallelizable across 4 sub-streams.

---

## The audit that triggered this packet

I ran 4 questions a real CXO would ask. Results:

| Question | Result | Failure mode |
|---|---|---|
| "What are our top 5 applications by criticality? Name them." | ⚠️ **Hallucinated** — confidently named "Epic EHR, Meditech Expanse, Mirth Connect, Veeva Vault" (these are typical provider-EHR apps, NOT Northstar's medtech-product-dev apps) | Agent invents plausible names when substrate lacks structured-entity recall |
| "Who is our CFO and what are their top 2 priorities?" | ✅ Confessed honestly — "I don't have the named CFO surfaced" | Substrate has no executive-bio chunks (despite 5 personas existing in `cxo-personas.ts`) |
| "What's our annual IT spend and top 3 line items?" | ✅ Confessed honestly | No financial-fact chunks; structured tables not in retrieval path |
| "Name 3 most-exposed vendor renewals in the next 6 months." | ✅ Confessed honestly | `vendor_contracts` table loaded but NOT in retrieval path |

The hallucination on Q1 is the highest-risk behavior. The 3 honest confessions are correct behavior given the data gap, but they reveal the platform isn't yet a "second brain" — it's a "well-read consultant."

## Root cause analysis

| Problem | Where it lives | Fix |
|---|---|---|
| Industry-pattern chunks dominate; no named-entity facts | Northstar's 720 chunks are generic medtech patterns ("clinical coding AI modernization pattern N applies when...") tagged with `tenant_applicability: 'Northstar context layer'` — they don't contain Northstar-specific people, dollars, or product names | **Stream G** — author Northstar named-entity fact chunks |
| Retriever only queries `enterprise_context_chunks` | `src/lib/knowledge/tenant-enterprise-context.ts` and the synthesizer don't query `applications` / `ai_initiatives` / `vendor_contracts` despite those tables being populated | **Stream H** — extend retriever to structured tables |
| Agent invents named entities when none surface | Synthesizer system prompt doesn't have an explicit "do not invent named entities" rule strong enough to override the LLM's pattern-matching instinct | **Stream I** — hallucination prevention via per-tenant fact-fingerprint |
| Demo questions hit gaps unexpectedly | No way to know upfront which questions the agent CAN answer authoritatively vs. will fall back | **Stream J** — data-availability pre-check API |

---

## Stream G — Northstar named-entity fact chunks

**Goal:** Replace ~150 of the 720 generic industry-pattern chunks with Northstar-specific named-entity facts so the agent can answer named-entity questions authoritatively.

**Why this is the lowest-risk highest-leverage fix:** Pure data work, no runtime change. Loader is already in place. Existing chunks can be supplemented or replaced in-place.

### Tasks

Author 150 new chunks to add to `datasets/northstar-clinical-tech-synthetic-v1/16-market-corpus/client-data-corpus.jsonl` (or a new `16-market-corpus/named-entity-facts.jsonl`):

1. **Executive bios — 5 chunks** (one per persona in `src/lib/auth/cxo-personas.ts` Northstar entries):
   ```json
   {
     "chunk_id": "NST-FACT-EXEC-001",
     "source_file_id": "NST-FACT-EXEC",
     "industry": "clinical technology / medtech",
     "use_case": "executive bench",
     "claim": "Maya Rangan is the CEO of Northstar Clinical Technologies, in seat since October 2024 after the prior-parent separation. Background: 22-year medtech operator, last role was COO at a $4B medtech division.",
     "evidence_basis": "Synthetic exec bio matching CXO_PERSONAS.ts ceo-northstar entry",
     "tenant_applicability": "Northstar named-entity recall",
     "confidence": 0.95,
     "do_not_overclaim_notes": "Composite executive bio; not a real person."
   }
   ```
   Repeat for Daniel Okafor (CFO), Priya Mehta (CIO), Elena Kovacs (CQO), Marcus Lee (EVP HIS).

2. **FY26 IT budget breakdown — 8 chunks** covering:
   - Total IT operating envelope (~$1.15B per Packet 22 §Part 2)
   - Top 5 categories: AMS/SI execution, infrastructure, cybersecurity, ERP+Workday, R&D engineering productivity
   - Run/Grow/Transform split
   - YoY changes
   - Tariff carve-out

3. **Top 20 named applications by criticality — 20 chunks** sourced from the actual 240 rows in the `applications` table for Northstar. Each chunk states: name, vendor, criticality tier, annual cost, deployment model, owning function. Use real loaded data — query `applications WHERE client_id = '2702b525-4c6a-4fbe-973d-99a8480d8318' AND criticality IN ('tier1','tier2') LIMIT 20`.

4. **Top 10 vendor renewals — 10 chunks** sourced from `vendor_contracts WHERE client_id = '2702b525-...' ORDER BY renewal_date LIMIT 10`. Each chunk: vendor name, annual value, renewal date, scope summary, concentration percentage, exit-clause exposure.

5. **Active initiatives — 32 chunks** for the 32 active initiatives in the Northstar dataset. Each chunk: initiative_id, name, sponsor, stage, committed annual dollar, status_flag. Reference Packet 22 §Part 7 for the 14 board-watched headlines (BSA/AML-equivalent for medtech, etc.).

6. **Board & activist context — 6 chunks** covering:
   - Q3 2025 board priorities
   - Activist investor presence + their thesis
   - The Capital Markets Strategic Review (Packet 22 §Part 3)
   - FY28 23-25% operating margin target
   - 10% EPS CAGR commitment
   - Recent earnings call risk callouts

7. **Regulatory exposure register — 12 chunks** covering:
   - FDA PCCP (medtech AI/ML device guidance)
   - EU AI Act Annex I (Aug 2027)
   - MDR/IVDR ongoing
   - FDA 524B cybersecurity
   - SBOM mandate
   - The disclosed $100-120M tariff headwind for 2026
   - GDPR / EU data residency

8. **Strategic context narrative — 15 chunks** covering:
   - Prior-parent separation timeline + remaining TSAs
   - Q4 2024 vs Q4 2025 financial performance
   - The Aug 2024 product divestiture context (composite mirrors Solventum's Q2 2024 events)
   - Current go-forward AI bets in market

9. **Vendor concentration & supplier risk — 12 chunks** covering top single-source vendors, FX exposure, alternative-sourcing patterns.

10. **Workforce + culture context — 10 chunks** covering attrition pressures, post-separation talent integration, AI literacy program status.

All chunks should:
- Use the Meridian JSONL shape (`id`/`title`/`text`/`source_file_id`/`tenant_id`/`dataclass`/`last_updated`/`depth_score`) OR the Northstar shape with `claim`+`evidence_basis`+`use_case`
- Set `tenant_id: 'northstar'` and load via `TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts`
- Have `depth_score: 8` or higher (Meridian shape) OR `confidence: 0.9` or higher (Northstar shape)
- Map to canonical retrieval segments (`enterprise_profile`, `org_structure`, `it_financials`, `it_landscape`, `program_inventory`) — see segment-mapping logic in `scripts/seed/load-tenant-substrate.ts`

**Run after authoring:**
```bash
TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks --concurrency=8
```

**Cost:** ~$0.30 OpenAI embedding fees for 150 new chunks.

**Success criteria:**
- After load, `node scripts/audit/db-substrate-audit.mjs` shows Northstar chunks ≥ 870 (existing 720 + 150 new)
- Re-run the agent intelligence audit; Q1 (top 5 apps) now names actual Northstar apps from the loaded data — not hallucinated provider-EHR apps
- Q2 (CFO) now names Daniel Okafor with priorities
- Q3 (IT spend) now cites the $1.15B envelope + top 3 line items
- Q4 (vendor renewals) now names 3 vendors with dates

---

## Stream H — Retriever extends to structured tables

**Goal:** When user asks "top 5 apps by criticality", retriever should query `applications` table directly (not just chunks). Same for `ai_initiatives` and `vendor_contracts`.

### Where the code lives

`src/lib/intelligence/ask/index.ts` calls `retrieveTenantEnterpriseSources` (in `src/lib/knowledge/tenant-enterprise-context.ts`) and `retrieveTenantTechnologySources`. Currently both go through `getTenantDataAdapter()` which only reads `enterprise_context_chunks`.

### Build target

New retrieval primitive: `retrieveTenantStructuredFacts(tenantInventoryKey: string, query: string): Promise<TenantStructuredSource[]>`.

For each of these query patterns, query the corresponding table:

| Query intent regex | Table | Query |
|---|---|---|
| `/top\s+\d+\s+(apps?\|applications?)\s+by\s+criticality/i` | `applications` | `WHERE client_id = ? AND criticality IN ('tier1','tier2','tier3') ORDER BY criticality, annual_cost_usd DESC LIMIT 10` |
| `/which\s+(applications?\|apps?)\s+(are\s+)?(retiring\|decommission)/i` | `applications` | `WHERE client_id = ? AND status = 'retiring'` |
| `/(top\|biggest)\s+vendor/i` OR `/vendor.*\b(spend\|cost)\b/i` | `vendor_contracts` | `WHERE client_id = ? ORDER BY annual_contract_value_usd DESC LIMIT 10` |
| `/vendor\s+renewal/i` OR `/renewing/i` OR `/renewal\s+(window\|date)/i` | `vendor_contracts` | `WHERE client_id = ? AND renewal_date >= NOW() AND renewal_date <= NOW() + INTERVAL '6 months' ORDER BY renewal_date` |
| `/active\s+initiatives?/i` OR `/in[-\s]?flight\s+initiatives?/i` | `ai_initiatives` | `WHERE client_id = ? AND status_flag != 'closed' ORDER BY committed_annual_usd DESC LIMIT 10` |
| `/initiatives?\s+by\s+(stage\|phase)/i` | `ai_initiatives` | `WHERE client_id = ? GROUP BY stage` |

When the regex matches, append the structured-fact rows as a high-confidence source to the chunk-based sources. Format each row as a `TenantStructuredSource` with `confidence: 0.99` and a clear `detail` that lists rows as bullet points:

```
Top 10 applications by criticality (Northstar):
- Epic Hyperspace · tier1 · $13M/yr · Epic · on_prem · CMIO-owned
- Epic Hyperdrive · tier1 · $6.1M/yr · Epic · on_prem · CMIO-owned
...
```

### Wire-up

In `src/lib/intelligence/ask/index.ts`, where the existing retrievers are called:

```ts
const [worldview, surfaceContext, tenantSources, techSources, structuredFacts] = await Promise.all([
  retrieveWorldview(trimmed),
  retrieveSurfaceContextSources(opts.surfaceContext),
  retrieveTenantEnterpriseSources(opts.tenantInventoryKey, trimmed, opts),
  retrieveTenantTechnologySources(opts.tenantInventoryKey, trimmed),
  retrieveTenantStructuredFacts(opts.tenantId, trimmed),  // NEW
]);
const sources = [...worldview, ...surfaceContext, ...tenantSources, ...techSources, ...structuredFacts];
```

### Tests

Add `src/lib/knowledge/__tests__/tenant-structured-facts.test.ts` with mocked Supabase responses asserting:
- "top 5 apps" query returns N rows from `applications` table
- "vendor renewals next 6 months" query returns rows with renewal_date in window
- "active initiatives" query returns rows with status_flag != 'closed'
- All sources have `confidence: 0.99` (structured-data confidence)
- Empty result on no-match queries (don't fabricate rows)

**Estimated effort:** 1-2 days. Mostly query-pattern matching + table joins. Schema is already stable.

---

## Stream I — Hallucination prevention via fact-fingerprint

**Goal:** When the agent doesn't have named-entity data for a tenant, prevent it from inventing plausible-sounding alternatives (like Epic EHR for a medtech-product-dev tenant).

### Approach

1. **Per-tenant fact-fingerprint:** at session start, query the substrate for "what named-entity classes does this tenant have data for?" Result:
   ```ts
   interface TenantFactFingerprint {
     hasExecutiveBios: boolean;       // chunks tagged source_segment_id = org_structure with name-pattern matches
     hasApplicationPortfolio: boolean; // applications.count > 0
     hasVendorContracts: boolean;     // vendor_contracts.count > 0
     hasInitiatives: boolean;         // ai_initiatives.count > 0
     hasFinancials: boolean;          // chunks tagged it_financials with $-pattern matches
     hasBoardMinutes: boolean;        // chunks tagged enterprise_profile with board-pattern matches
     namedEntityClasses: string[];    // ['apps','vendors','initiatives','executives']
   }
   ```

2. **Inject the fingerprint into the system prompt** so the synthesizer knows upfront what's available:
   ```
   FACT AVAILABILITY (current session):
   - Executive bios:        false (no named executive data loaded)
   - Application portfolio: true (240 apps in DB)
   - Vendor contracts:      true (90 contracts in DB)
   - Initiatives:           false (0 active initiatives loaded yet)
   - Financial figures:     false (no FY budget data loaded)
   
   When the user asks for a fact in a class marked `false`, you MUST refuse the
   specific request and offer either (a) a pattern-based directional answer with
   explicit "this is a pattern, not your data" caveat, or (b) an explanation that
   the data needs to be ingested first. NEVER fabricate names, dollars, dates,
   or other named entities for false classes.
   ```

3. **Add `no-fabrication` regression tests:** for each of the 4 audit questions above, assert that when the relevant `has*` flag is false, the agent's response contains either "I don't have" or "I don't want to invent" or "would need to be ingested" — never invents a specific name/dollar/date.

### Where to wire it

- New file: `src/lib/intelligence/ask/tenant-fact-fingerprint.ts`
- Call from: `src/app/api/intelligence/ask/route.ts` (compute fingerprint once per request, pass to synthesizer)
- Synthesizer system prompt: insert the FACT AVAILABILITY block from `tenant-fact-fingerprint.ts`

### Tests

`src/lib/intelligence/ask/__tests__/no-fabrication.test.ts`:
- Mock Supabase: 0 executives, 240 apps, 0 financials
- Mock LLM call
- Assert that the prompt sent to the LLM contains "Executive bios:        false"
- Assert that the synthesizer's response contains a refusal pattern when fingerprint says false

**Estimated effort:** 1 day.

---

## Stream J — Data-availability pre-check API

**Goal:** Demo prep tool. Before the demo, run a check that tells you which questions are answerable authoritatively for a tenant. Lets the user (or future product UI) know which questions to ask.

### Build target

New script: `scripts/audit/demo-question-readiness.mjs`. Takes a tenant key. Runs each of these test questions:

```
1. "What do you know about us?"                        → identity check
2. "Top 5 apps by criticality, name them"              → structured-table query
3. "Top 5 vendors by annual spend"                     → structured-table query
4. "Active initiatives by stage"                       → structured-table query
5. "Who is our CFO?"                                   → executive-bio chunk recall
6. "FY26 IT spend by category"                         → financial chunk recall
7. "Most-exposed vendor renewals in next 6 months"     → structured-table query
8. "Where are we exposed on EU AI Act?"                → regulatory chunk recall
9. "What's our biggest in-flight initiative?"          → cross-table reasoning
10. "How would you approach our biggest current risk?" → pattern + grounding fusion
```

For each: classify the response as `GROUNDED` / `PATTERN` / `CONFESSED` / `HALLUCINATED` based on:
- `GROUNDED`: contains specific named entities AND the entities match what's in Supabase
- `PATTERN`: industry-pattern answer with explicit "this is a pattern" caveat
- `CONFESSED`: explicit refusal ("I don't have...")
- `HALLUCINATED`: contains named entities that DON'T match Supabase (the dangerous case)

Print a heatmap:
```
Northstar demo-readiness:
                              GROUNDED  PATTERN  CONFESSED  HALLUCINATED
Q1 identity                       ✓
Q2 top apps                                                    ✗
Q3 top vendors                              ✓
Q4 active initiatives                       ✓
Q5 CFO                                              ✓
...
```

Hallucinated count > 0 = DO NOT DEMO until fixed.

**Estimated effort:** half-day.

---

## Coordination

| Stream | Priority | Estimated | Owner |
|---|---|---|---|
| G — Northstar fact chunks | **HIGHEST** | 1 day data work | Codex |
| H — Retriever to structured tables | HIGH | 1-2 days | Codex |
| I — Fact-fingerprint hallucination prevention | HIGH | 1 day | Codex |
| J — Demo-readiness checker | MEDIUM | half-day | Codex |

If parallelized across 4 Codex agents: ~1.5 days end-to-end.
If serial single-Codex: ~3-4 days.

## Verification gate after all 4 streams land

Re-run the audit from this packet's "Honest agent intelligence assessment":

```bash
node scripts/audit/demo-question-readiness.mjs --tenant northstar
```

Success target:
- 0 hallucinated answers
- ≥ 7/10 grounded answers (vs today's 0/10)
- Remaining 3 either grounded or honestly confessed
- Total time per question: < 25 seconds

## Out of scope for this packet

- Apex / Meridian / First Capital named-entity backfill (Stream G's pattern can extend, but separate work)
- Embeddings model migration (sticking with text-embedding-3-large)
- Synthesizer prompt overhaul beyond the FACT AVAILABILITY block
- Source-files Phase 1 (UUID FK constraint — separate fix)
- Cross-tenant integration test (Stream F in prior packet — depends on these landing first)

## How to start

```bash
git checkout -B codex/stream-g-northstar-fact-chunks origin/main
# Stream G: data work — author 150 chunks in datasets/, run loader, verify
```

Each stream is independent enough to spawn in parallel worktrees. The verification step at the end exercises all four together.
