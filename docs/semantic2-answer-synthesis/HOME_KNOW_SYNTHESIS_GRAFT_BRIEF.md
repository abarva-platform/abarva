# Codex brief — Home KNOW LLM synthesis graft

**Self-contained.** Execute on a clean branch off `origin/main`. Surgical: add an LLM phrase-only step to the existing Home KNOW engine. Do **not** change retrieval, the read-model views, the contract, tables/charts/gaps/citations, or the UI. Phrase-only.

## Why (proven, not speculative)
The live eval (`scripts/qa/eval-home-know-quality.mjs`, 8 SkyHarbor questions, 2026-06-24) returned **0/8 consultant-grade**: every answer `mechanical` or `blocked`, with a hard fail on Q3 (`"I found 3 Home source gap(s)."` — a literal row-count lead). Root cause: `/api/home/know/ask` → `buildHomeKnowResponse()` builds prose from `homeKnowProse(...)` **templates — no Claude call**. The retrieval/substrate is fine (live `mv_home_*` views); only the prose is mechanical. Sample bad leads:
- Q1: *"IT is loaded by portfolio/team: …"* (lists, doesn't synthesize)
- Q2/Q6: *"The enterprise context has enough … detail to frame this answer."* (canned non-answer → `blocked`)
- Q3: *"I found 3 Home source gap(s)."* (row-count lead, hard fail)

## The graft point
`src/lib/home/know/home-know-engine.ts`, in the response-assembly function that ends with `return validateHomeKnowResponse({ … prose: homeKnowProse({ … }) … })`. At that point `input.tenantKey`, `input.packet`, `intent`, `question`, the computed `facts` array, and the `gaps` array are all in scope. Replace **only** the `prose` value.

## What to build

### 1. `src/lib/home/know/home-know-synthesis.ts`
```
export async function synthesizeHomeKnowProse(args: {
  tenantKey: string;
  question: string;
  intent: HomeKnowIntent;
  facts: HomeKnowFact[];   // the already-computed facts array from the engine
  gaps: HomeKnowGap[];     // the already-computed gaps array
}): Promise<string | null>
```
- Serialize the **existing** `facts` and `gaps` into plain text (one line each — `facts` as their label/value, `gaps` as their human message). Use the real field names from the contract; do not invent fields.
- Call **`claude-opus-4-8`** via `getAuditedAnthropicClient({ tenantId: args.tenantKey, workflow: 'home-know-synthesis', model: 'claude-opus-4-8', dataClass: 'confidential', prompt })` then `client.messages.create({ model, max_tokens: 700, system, messages:[{role:'user',content:user}] })`. (No `temperature`/`budget_tokens` — removed on 4.8.)
- **Phrase only** — the model writes prose from the supplied facts/gaps; it must invent nothing.
- Validate the output (below). On ANY failure (LLM error, empty, validation fail) **return `null`** — never throw.

**System prompt:**
```
You are AbarVa's enterprise librarian. Answer the question ONLY from the FACTS and
GAPS below. Write 2–5 sentences of executive prose: lead with the business read,
then the key implication, then name the specific missing evidence from GAPS.
Rules: never lead with a count or "I found N …"; never put internal IDs, table/view
names, or system language in the prose; state gaps as the specific missing field,
never "no data"; do not recommend, summon experts, or frame a decision. Return ONLY
the prose — no preamble, no JSON, no headings.
```
**User message:** `QUESTION:\n<question>\n\nFACTS:\n<facts lines>\n\nGAPS:\n<gap lines>`

**Validation (reject → return null, fall back to template):**
- `noRowCountLead`: lead doesn't match `^\s*(i\s+found|there\s+(are|were)|we\s+have|loaded)\b|^\s*\d[\d,]*\s+(rows|records|...)`
- `noRawIds`: no `SHA-..-\d+|APP-\d{4,}|DP-\d{4,}|CON-\d{4,}|NODE-\d+|EDGE-\d+`
- `noDebug`: no `local env|read path|pattern family|enterprise_context_|mv_home_|Current-state read|Evidence points`
- non-empty, ≤ ~6 sentences.

### 2. Wire it in `home-know-engine.ts`
- Make the assembly path `async` if it isn't (the engine is already async — it awaits the read-model client).
- `intent === 'decision_handoff'` → **skip synthesis**, keep the existing handoff prose (Q5 must stay a clean hand-off).
- Otherwise: `const llm = isFeatureEnabled({ clientKey, clientId }, 'home_know_llm_synthesis') ? await synthesizeHomeKnowProse({ tenantKey: input.tenantKey, question, intent, facts, gaps }) : null;` then `prose: llm ?? homeKnowProse({ … })`.
- `homeKnowProse` stays as the fallback. Keep `validateHomeKnowResponse` (it still sanitizes the final string).

### 3. Flag — `src/lib/features/registry.ts`
Add `home_know_llm_synthesis` (policy `tenant`, `includeTenants: ['skyharbor']` to start; env override `ABARVA_FEATURE_HOME_KNOW_LLM_SYNTHESIS_TENANTS` already works). Default off everywhere else.

## Acceptance (must pass)
Re-run the eval against the patched engine:
```
BASE_URL=<env> HOME_KNOW_COOKIE=<skyharbor session> ANTHROPIC_API_KEY=<key> \
  node scripts/qa/eval-home-know-quality.mjs
```
- **≥ 6 / 8 answers verdict ∈ {executive, acceptable}** (was 0/8)
- **0 hard fails** (Q3 row-count lead gone)
- **Q5 still `answerStatus: "handoff"`**
- Template fallback proven: with the flag off, behaviour is byte-identical to today.

## Out of scope (do not touch)
Retrieval, `mv_home_*` views, `home-know-contract.ts`, `HomeKnowResponse` shape, tables/charts/graphs/gaps/citations/safety, `HomeSurface`/`HomeKnowAsk`/`HomeKnowAnswerRenderer`. This is prose-only.

## Release
Code-lane + experimental (flag-gated, SkyHarbor only). Add a release record + pass `release:check` before the PR. Do not flip the flag in production until acceptance is green in a DB-connected env.
```
