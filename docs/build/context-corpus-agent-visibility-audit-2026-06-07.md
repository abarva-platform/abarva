# Context/Corpus → Agent Visibility Audit — 2026-06-07

Executed against the prompt `docs/build/codex-prompts/CONTEXT_CORPUS_AGENT_VISIBILITY_AUDIT_PROMPT.md`.

> **Mandate (operator, this thread):** Supabase is decommissioned — **Azure-only**.
> Reasoning is **Anthropic/Claude-only** — no OpenAI. Prove the DB target before
> any audit; fail closed on Supabase; never print secrets.

## 0. Execution environment & DB-target proof (do this first)

This audit was run from a **Cursor Cloud VM**. Redacted environment classification
(no secret values printed):

| Env var                                          | State   |
| ------------------------------------------------ | ------- |
| `ABARVA_AZURE_DATABASE_URL`                      | absent  |
| `AZURE_DATABASE_URL`                             | absent  |
| `DATABASE_URL`                                   | absent  |
| `NEXT_PUBLIC_SUPABASE_URL` / anon / service-role | absent  |
| `ANTHROPIC_API_KEY`                              | present |
| `OPENAI_API_KEY`                                 | absent  |
| Vercel CLI / `VERCEL_TOKEN`                      | absent  |
| Clerk keys                                       | absent  |
| Azure CLI (service principal)                    | present |

**DB-target guard result (this VM):** `node scripts/data-plane/assert-azure-db-target.mjs` → **FAIL (exit 1)** — no Azure target var set; effective target `ABSENT`. The guard also fails closed when `DATABASE_URL` is a Supabase host (verified with a throwaway host) and passes only when the effective target is `*.postgres.database.azure.com` or a private `10.x` host.

**Consequence (per the mandate's own rule):** this VM is **not** an Azure-audit
environment and cannot reach the private Azure Postgres (`10.43.1.4`,
`publicNetworkAccess=Disabled`). **The data-plane audit must run from the Azure
private operator runner** (`job-abarva-private-operator-eus`, proven to resolve
`10.43.1.4` / `abarva_control`) or another in-VNet env that sets
`ABARVA_AZURE_DATABASE_URL`. No step in this audit queried or fell back to Supabase.

## 1. What is evidenced here vs. credential-blocked

| Task                                       | Status from this env                                      | How to complete                                                                                       |
| ------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| DB-target proof + Azure-only guard         | **DONE** (guard shipped, fails closed)                    | `npm run db:assert-azure-target` in the operator                                                      |
| Provider audit (Anthropic vs OpenAI)       | **DONE** (code-evidenced)                                 | —                                                                                                     |
| Retrieval-path audit (code)                | **DONE** (post-#3238 state assessed)                      | —                                                                                                     |
| Azure-store live counts (per client/table) | **PARTIAL** — operator proof totals only                  | run `src/scripts/meridian-context-inventory.ts` (Azure-only) via operator                             |
| Supabase-store counts                      | **N/A by mandate** — Supabase decommissioned; not queried | —                                                                                                     |
| Vercel prod read-store check               | **BLOCKED** (no Vercel access)                            | `vercel env ls production` (names only) — expect `ABARVA_AZURE_DATABASE_URL` present, Supabase absent |
| Signed-in golden-QA (live Sentinel/Nexus)  | **BLOCKED** (no Clerk session)                            | run golden suite against the authenticated product route from a Clerk-enabled env                     |
| Index ↔ DB reconciliation                  | **BLOCKED** (needs Azure AI Search admin + DB counts)     | `az search` `$count` per index vs operator DB counts                                                  |

No client is marked "loaded" here on inference; blocked cells stay blocked.

## 2. Provider audit (Task 5) — **P0 FINDING**

Production reasoning must be Claude. Code evidence:

| Path                                                                       | Provider                                                                                                                     | Verdict                                                                             |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Sentinel Ask synthesis** (`src/lib/intelligence/ask/synthesizer.ts:482`) | **OpenAI** — `createIntelligenceAskOpenAIText`, workflow `intelligence-ask-synthesis`, model `gpt-5.1` (`openai-runtime.ts`) | **P0 VIOLATION** — primary Sentinel answer path runs on OpenAI                      |
| Nexus free-text (`src/lib/programs/nexus-free-text.ts:701`)                | Anthropic — `getAuditedAnthropicClient`, `claude-opus-4-7`                                                                   | ✓ compliant                                                                         |
| Source chat (`src/lib/source/sentinel-chat-llm.ts:72`)                     | OpenAI — `preflightOpenAIDirectClient`                                                                                       | violation (Source reasoning)                                                        |
| Ask classifier / followups                                                 | OpenAI `gpt-4o-mini`                                                                                                         | utility (intent/followups) — allowed only if explicitly approved; otherwise migrate |

This is exactly the "AI Draft" Sentinel path the operator saw. **`synthesizer.ts`
was not touched by #3238**, so fixing it does not collide with the in-flight
retrieval thread.

Regression guard added: `src/lib/intelligence/ask/__tests__/provider-audit.test.ts`
— asserts Nexus uses Claude (passes) and tracks the Sentinel-on-OpenAI P0 via
`it.failing` (records the violation in CI without blocking; flips red the moment
Sentinel synthesis moves to Anthropic).

**Recommended fix (scoped, not done blind here):** route Sentinel Ask synthesis
(and Source chat) through the audited Anthropic client used by Nexus
(`getAuditedAnthropicClient`), preserving the streaming + token-budget +
cross-tenant identity guards. This changes the primary product reasoning path and
**must be validated with a signed-in QA pass** (Clerk env) before prod — so it is
flagged as the top fix rather than swapped unverified.

## 3. Retrieval-path audit (Task 3) — current state

- **Already fixed (#3238, on `main`):** `ask/index.ts` + `response-policy.ts` +
  `nexus-current-state-briefing.ts` now prioritize tenant technology /
  enterprise-context / structured-fact sources for current-state questions, so
  "what is our data analytics platform" prefers named loaded facts over the
  generic AI-bet brief.
- **Residual gaps (from #3238 Known Gaps + this audit):**
  - **Citation/provenance propagation** — provenance exists on facts
    (`source_system`, `source_file`, `confidence`) but is not consistently
    attached to the answer ("Citation gap"). Not yet closed.
  - **Chunk-only tenants** — tenants with chunks but `facts = 0`/`records = 0`
    were never promoted (extraction stage never ran); retrieval can't surface
    named rows that don't exist as facts.
  - **No full-corpus semantic recall** — retrieval remains keyword + bounded
    `LIMIT`/ranking, not vector/semantic over the whole corpus.
- **Store correctness:** corpus reads fail closed on Supabase
  (`src/lib/corpus/db.ts`), and #3237 removed legacy runtime fallback envs —
  consistent with the Azure-only mandate.

## 4. Azure-store evidence obtained via the proven operator

From `job-abarva-private-operator-eus` (ran 2026-06-06 22:44 UTC, resolved
`10.43.1.4` / `abarva_control`):

- `enterprise_context_chunks` = **9,360** total (meridian-health 873 +
  skyharbor-air 3,240 + lakeshore 5,247).
- `corpus_patterns` 39, `knowledge_sources` 20, `knowledge_chunks` 0,
  `genome_patterns` 52, `intelligence_graph_edges` 268.
- `enterprise_context_records` table **does not exist in `abarva_control`** —
  so aggregate "3,503 records / 820 relationships" numbers seen in some answers
  come from a different DB/schema (e.g. `abarva_context`), not the store that
  embeddings/retrieval use. **Cross-store/schema split is a real finding.**

Meridian context layer (from in-VNet load telemetry, 2026-06-06 14:56):
**873 chunks, all embedded** — `program_inventory` 340, `it_landscape` 185,
`enterprise_profile` 171, `it_financials` 109, `org_structure` 68.

To get the full per-client × per-table × fact-type matrix, run the Azure-only
inventory query (below) via the operator — it is **fail-closed on Supabase**.

## 5. Governed-loader posture

Per the prompt's hard constraint #2, any new/missing data load (e.g. the
`erp-data-estate` / `databricks-lakehouse-target-model` enrichment that names
DB2/Tableau/Cognos/SQL Server, currently NOT in the live tenant) must enter via
the governed Admin bulk/zip loader (blob → parse → commit → embeddings/index →
retrieval proof) — **no SQL inserts, no seed scripts.** Not loaded in this turn.

## 6. Artifacts shipped this turn

- `scripts/data-plane/assert-azure-db-target.mjs` + `npm run db:assert-azure-target`
  — fail-closed Azure-only DB-target guard (redacted classification, refuses Supabase).
- `src/lib/intelligence/ask/__tests__/provider-audit.test.ts` — provider regression
  guard (Nexus=Claude pass; Sentinel-on-OpenAI P0 tracked).
- This audit report.

## 7. Reproducible Azure-only audit runbook (run from the operator / in-VNet)

```bash
unset NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
test -n "$ABARVA_AZURE_DATABASE_URL" || { echo "FAIL: not an Azure audit"; exit 1; }
node scripts/data-plane/assert-azure-db-target.mjs          # must PASS (AZURE)
npx tsx src/scripts/meridian-context-inventory.ts --tenant meridian-health
# repeat per client; compare index doc counts (az search $count) to DB rows
```

## 7b. Failed decommission/proof gates — root-cause diagnosis (from Log Analytics)

Diagnosed read-only from operator job logs. **Fixes implemented in this PR**
(pure helpers + unit tests; coordinate the merge with the migration thread so the
job scripts aren't double-edited).

**`job-supa-drain-apply-eus` (FAILED 2026-06-06 23:34) — DEFINITIVE**

- Error: `clients: duplicate key value violates unique constraint "clients_name_key"` in `copyTable` (`scripts/data-plane/drain-supabase-to-azure.ts`).
- Cause: the Supabase→Azure copy does a plain INSERT of `clients`; a client with that `name` already exists in Azure → unique-key collision. The copy is **not idempotent**.
- Fix: upsert `clients` with `ON CONFLICT (name) DO UPDATE` (or `DO NOTHING` + id remap), so re-runs and pre-existing Azure clients don't collide. Re-run drain after.

**`job-a24-search-verify-eus` (FAILED 2026-06-07 00:19) — off by 7**

- Error: `azure_search_backfill_count_mismatch:meridian-health: expected 4376, got 4369` (`src/scripts/azure-ai-search-backfill.ts:167`).
- Body is already truncated to 30 KB (`safeSearchBody` in `tenant-context-backfill.ts`), so this is **not** the old `>32766`-byte term error. Two candidate causes:
  1. **Silent per-doc index failures (most likely):** `uploadBatch` (line 124) only checks `res.ok` (HTTP 200). Azure Search's `/docs/index` returns **200 even when individual documents fail** — the per-doc outcome is in `value[].status`/`errorMessage`. 7 docs can be rejected while the batch reports 200, so the index ends up 7 short.
  2. **Verify-before-commit race:** Azure Search `$count` is eventually consistent; `verify()` runs immediately after upload and can undercount.
- Fix: in `uploadBatch`, parse the 200 response body and fail (or log+collect) any `value[].status === false` with its `errorMessage`; and add a bounded poll/retry in `verify()` before asserting equality. That both fixes a real silent-failure bug and disambiguates the cause.

**`job-supa-final-eus` (FAILED 2026-06-07 00:55) — downstream**

- Logs show it completing per-table Supabase final backups (export manifest with row counts + sha256), no clean error line in the captured window.
- Most likely blocked by / dependent on the drain-apply failure (clients not fully migrated) or a final source==target reconcile assertion that can't pass while drain-apply is red.
- Fix: land the drain-apply idempotency fix, re-run drain → search-verify → final in order; capture the proof pack only after all three are green.

Note: `azure-ai-search-backfill.ts` keys its DB pool off `DATABASE_URL` (line 76). That is correct **only inside the operator**, where `DATABASE_URL` maps to the Azure Key Vault secret. Run behind `assert-azure-db-target` so it can never backfill from Supabase by accident.

## 8. Top recommendations (priority order)

1. **P0 — migrate Sentinel Ask synthesis + Source chat off OpenAI to the audited
   Anthropic client**, with a signed-in QA validation pass. (Tracked test in place.)
2. Close the **citation-gap** — propagate fact provenance to the answer.
3. Run the **Azure-only inventory** via the operator to produce the full
   per-client completeness + depth matrices (blocked from this VM).
4. Promote **chunk-only tenants** through extraction so named facts exist.
5. Confirm **Vercel production** sets `ABARVA_AZURE_DATABASE_URL` and not Supabase.
