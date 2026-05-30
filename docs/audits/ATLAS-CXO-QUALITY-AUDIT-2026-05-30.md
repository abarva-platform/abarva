# Atlas — CXO-grade quality audit + fix plan

> **Audit window:** 2026-05-30
> **Base commit:** `364148270` (origin/main)
> **Surface in scope:** `https://app.abarva.ai/tower` — the Atlas chat panel + the Tower synthesis hero quote
> **Scope:** READ-ONLY trace through the codebase, validated against the eight prosecution exhibits from a live Apex Retail transcript. No application code is changed by this audit. Fix PRs fan out from §8.
> **Audit posture:** empirical. Every claim is anchored to a file + line.

---

## 0. Executive verdict — is Atlas demoable to a CIO today?

**No.** Atlas would not survive 20 minutes of competent CIO scrutiny against the Apex Retail tenant in its current state. The blockers fall into three classes, in priority order:

1. **Cross-tenant content escape (catastrophic).** Two independent leak paths exist. (a) The Tower synthesis hero quote at `POST /api/tower/synthesis` is **hardcoded** to `APEX_RETAIL_PROGRAM_INSTANCES` and the literal user message `Portfolio snapshot for Apex Retail Group:` regardless of the signed-in tenant (`src/app/api/tower/synthesis/route.ts:101-106, 195`). Meridian Health and First Capital users see Apex's portfolio. (b) The Atlas chat LLM retrieval path (`src/lib/agent/retrieval.ts`) does **not** scrub legacy demo aliases (`Asterline`, `Heliara`, `Brindlemark`) before injecting chunks into the prompt — the alias scrub `normalizeLegacyClientAliases` exists in four other modules (`src/lib/knowledge/tenant-enterprise-context.ts:1096`, `src/lib/azure-search/tenant-context-retriever.ts:222`, `src/lib/programs/transformers.ts:97`, `src/lib/admin/release-ledger.ts:65`) but the Atlas retrieval pipeline calls none of them. The `topicChunks` slice queries the un-tenant-scoped Pinecone namespace `'global:ai_governance'` (`retrieval.ts:299`) which can return Meridian healthcare deliverable text containing "Abridge", "BAA", "clinical".
2. **Non-determinism by construction.** No `temperature` parameter is set anywhere — `src/lib/atlas/llm.ts:190`, `src/app/api/tower/synthesis/route.ts:237`. Anthropic defaults to ~1.0. Two consecutive identical questions return different answers — disqualifying for an audit-bearing CIO surface.
3. **Templated answer shells with hardcoded copy.** The shared response shaper at `src/lib/agent/response-shape.ts:209-210` injects the literal strings `'Needs validation.'` and `'Medium pending evidence.'` into every Atlas comparison/option block when the LLM output lacks an explicit `Weakness:` / `Fit:` clause — which is most of the time. Every row of a comparison table on Tower shows the same boilerplate.

Beyond those three, six other defects compound the impression that Atlas is improvising: wrong-intent routing on portfolio diagnostics, unscoped percentile mixing, evidence/missing field-binding collision, max-token truncation mid-sentence, an LLM fallback that name-drops the wrong portfolio aggregates, and a classifier that is a keyword whack-a-mole.

**Recommendation:** do not put Atlas in front of a real CIO until §8 P0 + P1 ship. The P0 set is small (3 files, ~80 lines of change) and can land in a single day if treated as a hot-fix wave; P1 is a second-day wave; P2 is the structural work.

---

## 1. The 8 prosecution exhibits — validated + file:line evidence

| # | Symptom (observed) | Root cause | Evidence (file:line) | Verdict |
|---|---|---|---|---|
| 1 | "Asterline" appears in an Apex Retail Atlas response; "Abridge" + "missing BAA on clinical-adjacent tool" bleeds in | (a) Atlas LLM retrieval pipeline does not call `normalizeLegacyClientAliases`; (b) `topicChunks` come from un-tenant-scoped namespace `global:ai_governance`; (c) industry chunk source rows still contain "Asterline" in DB | `src/lib/agent/retrieval.ts:182-211, 248-261, 299` (no alias scrub on the lexical-fallback path; topicPromise pulls global namespace); `src/lib/agent/retrieval-format.ts:27-32` (writes raw `c.text` straight into prompt); `src/lib/knowledge/tenant-enterprise-context.ts:1098-1099` (scrub exists, but lives in a different code path) | **CONFIRMED — P0** |
| 2 | Signal-read response shows identical text in `Evidence:` and `Missing:` slots | `compactConsultantChatText` in `response-shape.ts` extracts `Evidence:` (first non-recommendation sentence with a numeric/topical cue) and `Missing:` (first sentence containing 'missing'/'do not have'/'absent') from the **same source text**. When the LLM's prose lacks distinct structural cues (common path for short Atlas replies), both extractors can resolve to the same sentence, or `extractMissingLine` promotes any caveat clause already present in the evidence sentence into a second slot | `src/lib/agent/response-shape.ts:152-160, 350-391, 393-438` (Tower `/tower` is in `shouldCompactSurface` allow-list); `src/lib/atlas/orchestrator.ts:377-380` (every Atlas turn passes through `shapeAgentResponseForSurface('/tower', …)`) | **CONFIRMED — P1** |
| 3 | Same `signal:<UUID>` question yields contradictory interpretations ("critical-severity" vs "93rd-percentile outlier") on consecutive reads | No `temperature` parameter is set on any Anthropic call. Default temperature ≈ 1.0 → high variance. The synthesis cache (`synthesisCache` in `synthesis/route.ts:31`) is keyed by `towerStateHash` so the *first* non-deterministic response gets locked in, but every cache-miss produces fresh variance | `src/lib/atlas/llm.ts:189-205` (no `temperature` field on `client.messages.create`); `src/app/api/tower/synthesis/route.ts:236-241` (no `temperature` on `client.messages.stream`) | **CONFIRMED — P1** |
| 4 | "Show me lagging programs by realized value" returns portfolio-wide value totals, not a ranked list | Classifier keyword-matches `'realized value'` → `intent='roi'` → `buildRoiSummary` returns four portfolio aggregates (`projected`, `tracked attainment`, `tracked active users`, `verified realized`) and never queries a per-program list. There is no `lagging_programs` intent in the catalog | `src/lib/atlas/classifier.ts:69-71`; `src/lib/atlas/scripted-engine.ts:124-142, 238-257` | **CONFIRMED — P2** |
| 5 | "What are others doing in this industry?" ends mid-sentence on first attempt; second attempt sits indefinitely at "Atlas is thinking…" | (a) `max_tokens: 500` in `llm.ts:191` truncates multi-paragraph industry-corpus responses mid-sentence; (b) the Tower hero synthesis route `/api/tower/synthesis` has **no AbortController** on `client.messages.stream` and **no `temperature`** — a slow streaming model can hold the connection open past any reasonable advisor patience window | `src/lib/atlas/llm.ts:189-205` (max_tokens=500, no streaming, no abort); `src/app/api/tower/synthesis/route.ts:236-301` (streams without timeout); `src/components/tower/TowerIndexPage.tsx:2203-2204` (chat panel has an 18s abort, but the synthesis quote does not) | **CONFIRMED — P1/P2** |
| 6 | Every row of the active-programs table shows the same `"Needs validation. / Medium pending evidence."` copy | `extractComparisonItems` provides hardcoded fallbacks for `weakness` and `fit` when the LLM's per-option block does not include explicit `Weakness:` / `Fit:` labels. The fallbacks are not "I don't know" — they are confident-sounding boilerplate strings, which is worse | `src/lib/agent/response-shape.ts:197-220` (lines 209-210 are the literals); `src/lib/agent/response-shape.ts:222-239` (wraps them into the `\| Option \| Strength \| Weakness \| Fit \|` markdown table); `src/lib/agent/response-shape.ts:430-438` (Tower in the compact allow-list) | **CONFIRMED — P0** |
| 7 | "18th percentile" appears alongside "93rd percentile" with no metric label or scale disambiguation | Atlas has at least five orthogonal percentile fields — `adoptionPercentile`, `spendIntensityPercentile`, `valueAttainmentPercentile`, `vendorCountPercentile`, `signal.percentile`, plus `benchmark.apexPercentile`. The scripted ROI/cohort builders mention "the {N}th percentile" with **no metric name attached** (`scripted-engine.ts:117`); the LLM prompt also does not enforce percentile labeling | `src/lib/atlas/types.ts:75`; `src/lib/atlas/repository.ts:149-152, 196, 266, 348` (six independent percentile fields); `src/lib/atlas/scripted-engine.ts:113-122` (renders percentile without metric); `src/lib/atlas/prompt.ts:1-40` (system prompt has no percentile-framing rule) | **CONFIRMED — P2** |
| 8 | "Asterline trails the retail median by 13 points" — wrong tenant identity asserted as fact | Same root as #1 (raw `Asterline` survives in chunk text). On the Tower hero quote, additionally compounded by **synthesis/route.ts:101 hardcoding** the Apex program list and **synthesis/route.ts:195** hardcoding the literal string `Portfolio snapshot for Apex Retail Group` in the user message — independent of which tenant is signed in | `src/app/api/tower/synthesis/route.ts:101-106, 195`; `src/lib/agent/retrieval.ts:182-211` (no scrub on Atlas LLM path); cross-reference Tower audit PR #2525 | **CONFIRMED — P0** |

---

## 2. Atlas architecture map — where every response is composed

Atlas is **two surfaces, three composition modes**, and a confusing classifier in between.

### 2.1 The two surfaces

| Surface | File | Composition mode | LLM call? | Tenant-scoped? |
|---|---|---|---|---|
| Tower hero "synthesis quote" (the under-the-headline one-paragraph read) | `src/app/api/tower/synthesis/route.ts` | LLM streaming with `claude-sonnet-4-6`, max_tokens=350 | yes | **NO — hardcoded to Apex** (line 101) |
| Atlas chat panel (the right-rail conversation) | `src/app/api/v1/atlas/chat/route.ts` → `src/lib/atlas/orchestrator.ts` | classifier → scripted / hybrid / LLM / metric-explanation | sometimes | yes (via `requireAtlasTenancy` in `src/app/api/v1/atlas/_auth.ts:5-22`) |

### 2.2 The three composition modes inside the chat orchestrator

```
runAtlasTurnDetailed (src/lib/atlas/orchestrator.ts:297)
  ├─ classifyAtlasIntent (src/lib/atlas/classifier.ts:12) ── keyword whack-a-mole, 9 hardcoded branches
  ├─ if surfaceContext.metricExplanationRequest → runMetricExplanationTurn  [PURE-CODE]
  ├─ if routeType in (scripted, hybrid) → runScriptedAtlasIntent             [TEMPLATED string interpolation]
  ├─ else → runAtlasLlm                                                       [LLM-CALL claude-opus-4-7, max_tokens=500]
  └─ shapeAgentResponseForSurface('/tower', response.response)                [TEMPLATED — compactConsultantChatText]
```

### 2.3 Classification — file:line + classification of each path

| Path | Mode | File:line |
|---|---|---|
| `morning_summary` / `portfolio_status` | TEMPLATED (`buildMorningSummary`) | `scripted-engine.ts:55-89, 178-195` |
| `shadow_ai_detail` / `signal_detail` | TEMPLATED (`buildShadowAiDetail`) | `scripted-engine.ts:91-109, 197-218` |
| `cohort_position` | TEMPLATED (`buildCohortPosition`) | `scripted-engine.ts:111-122, 220-236` |
| `roi` | TEMPLATED (`buildRoiSummary`) | `scripted-engine.ts:124-142, 238-257` |
| `idle_seats` | TEMPLATED (`buildIdleSeatsSummary`) | `scripted-engine.ts:144-156, 259-272` |
| `strategy_refusal` | HARDCODED-FIXTURE string | `scripted-engine.ts:158-160, 274-287` |
| `llm` / fallback | LLM-CALL with tool context | `llm.ts:77-235` |
| `metric_explanation` | PURE-CODE (`buildMetricExplanation`) | `orchestrator.ts:117-204` |
| Tower hero quote | LLM-STREAM with **Apex-hardcoded** programs | `app/api/tower/synthesis/route.ts:88-312` |
| `shapeAgentResponseForSurface('/tower', …)` | TEMPLATED post-processing | `agent/response-shape.ts:445-458` |

### 2.4 Tenant injection — where it lives, and where it leaks

- **Chat orchestrator:** `requireAtlasTenancy` → `requireTenancy()` resolves `clientId` from Clerk session; `body.clientId` is validated to match (`_auth.ts:12-19`). Defense-in-depth is sound at the auth seam.
- **Inside the orchestrator:** every tool call (`query_portfolio_aggregates`, `query_signals`, etc.) takes `ctx.clientId`. The tenant is propagated correctly down to SQL.
- **Where it leaks:**
  1. **Retrieval pipeline (`src/lib/agent/retrieval.ts`):** `topicPromise` queries Pinecone namespace `'global:ai_governance'` (line 299) with **no tenant filter and no industry filter**. The `clientChunks` query in the Postgres fallback (`queryPostgresContextChunks`, lines 161-263) **is** tenant-scoped via `tenant_key`, but the chunk text is never run through `normalizeLegacyClientAliases`.
  2. **Tower synthesis route:** **does not consult the tenancy at all** for the program list — `APEX_RETAIL_PROGRAM_INSTANCES` is imported and used unconditionally (`synthesis/route.ts:6, 101`).
- **Atlas reasoning trace** (`appendAtlasReasoningTrace`) is correctly tenant-scoped (`repository.ts:464-493`), so the audit trail is clean — but the audit trail logs the *leaked* response.

---

## 3. CXO question taxonomy — ~25 canonical question types, grouped

The catalog below is what a competent CIO/CFO/CDO/CDAO actually asks against a portfolio-tower surface. The "current Atlas behavior" column maps each question to the path it currently takes through §2.

### 3.1 Portfolio diagnostics

| ID | Canonical question | Current routing |
|---|---|---|
| Q1 | "Where do we stand on the AI portfolio today?" | `morning_summary` → scripted |
| Q2 | "What is the biggest issue right now?" | `portfolio_status` → scripted |
| Q3 | "Show me lagging programs by realized value" | **misroutes to `roi` (aggregates)** |
| Q4 | "Which bets are at risk of missing the next gate?" | falls through to `llm` |
| Q5 | "What is the portfolio confidence right now?" | falls through to `llm` |
| Q6 | "Where is value attainment vs commitment?" | `roi` → scripted (aggregates only) |

### 3.2 Peer / industry context

| ID | Canonical question | Current routing |
|---|---|---|
| Q7 | "How do we compare to retail peers on adoption?" | `cohort_position` → scripted |
| Q8 | "What are industry leaders doing on AI governance?" | `llm` |
| Q9 | "Where are we lagging in our cohort?" | falls through to `llm` (no dedicated intent) |
| Q10 | "What percentile are we on AI spend intensity?" | falls through to `llm` (**percentile mixing risk**) |

### 3.3 Spend / cost

| ID | Canonical question | Current routing |
|---|---|---|
| Q11 | "AI spend run-rate vs budget?" | falls through to `llm` (no dedicated cost intent) |
| Q12 | "Concentrated vendor risk?" | partial match (`shadow_ai` if `vendor_concentration` keyword hit) |
| Q13 | "Cost overruns by program?" | no intent; goes to `llm` |
| Q14 | "Idle Copilot seats and dollarized waste?" | `idle_seats` → scripted |

### 3.4 Risk / governance

| ID | Canonical question | Current routing |
|---|---|---|
| Q15 | "Shadow AI exposure?" | `shadow_ai_detail` → scripted/hybrid |
| Q16 | "Governance coverage gaps?" | `llm` |
| Q17 | "Open regulatory items?" | `llm` |
| Q18 | "Which programs have outstanding dissent or stale attestations?" | `llm` |

### 3.5 Decisions

| ID | Canonical question | Current routing |
|---|---|---|
| Q19 | "What should I fund / kill / reshape next, and why?" | `strategy_refusal` (hands off to Sentinel) — **correct posture** |
| Q20 | "Should we consolidate ambient vendors?" | `strategy_refusal` — correct |

### 3.6 Drilldown

| ID | Canonical question | Current routing |
|---|---|---|
| Q21 | "Tell me more about program APX-CDP-2026" | `signal_detail` (hybrid) — but the implementation only knows about signals, not programs |
| Q22 | "Walk me through signal `<UUID>`" | `signal_detail` (hybrid) — works |
| Q23 | "Tell me about vendor `<name>`" | `llm` |

### 3.7 Compare / hypothetical

| ID | Canonical question | Current routing |
|---|---|---|
| Q24 | "If I cut Program X, what's at stake?" | `strategy_refusal` |
| Q25 | "Fund X instead of Y — what changes?" | `strategy_refusal` |

**Coverage assessment:** the classifier has dedicated intents for 8 of 25 canonical questions (~32 %). The remaining 17 (~68 %) fall to the LLM path. Given that the LLM path has the cross-tenant leak (Bug #1), the truncation problem (Bug #5), the non-determinism (Bug #3), and the templated comparison-table boilerplate (Bug #6), **most CXO questions today route through Atlas's worst path**.

---

## 4. Gold-standard response shape — per question type

A CXO answer is built from five required elements. **Every Atlas response, regardless of mode, must satisfy this contract.** The shape is non-negotiable; the words inside it are advisory.

### 4.1 Required elements (the universal contract)

| Element | Rule |
|---|---|
| **Lead (1 sentence)** | The verdict. No setup. No metric dump. Names the tenant. Example: "Apex Retail's portfolio is sequenced but under-measured." |
| **Evidence (2-4 short clauses)** | Each clause cites a program ID, a metric+value, a vendor, a signal ID, or a peer cohort definition. No unsourced claims. |
| **Honesty line (when applicable)** | Names the gap. Example: "Cohort percentile is missing for value attainment — peer panel n=4 of needed 7." |
| **One next step** | A concrete action the CIO can take from this surface. Example: "Approve Renewal Pause for APX-AMS-2026 in Source." |
| **Handoff (when scope-crossing)** | If the question crosses into strategy or program execution, hand off cleanly: "This goes to Sentinel — pattern context required." |

### 4.2 Per-category response shape

| Category | Shape | Word count | Required citations |
|---|---|---|---|
| Portfolio diagnostics (Q1-Q6) | Lead + 3 evidence bullets + 1 next step | 60-110 | program ID × ≥1, KPI × ≥1, signal ID × 0-1 |
| Peer / industry (Q7-Q10) | Lead + cohort definition + percentile (with metric name) + honesty on n | 50-90 | cohort label, metric_name, sample_size |
| Spend / cost (Q11-Q14) | Lead + dollar number + run-rate context + 1 next step | 50-80 | dollar value, program ID, time window |
| Risk / governance (Q15-Q18) | Lead + risk magnitude + evidence chain + handoff to Source if open item | 60-100 | signal ID × ≥1, evidence chain × ≥1 |
| Decisions (Q19-Q20, Q24-Q25) | Lead + scope refusal + handoff to Sentinel | 30-50 | none — refusal is the artifact |
| Drilldown (Q21-Q23) | Headline + evidence rows from query_signal_evidence + recommended actions | 60-120 | signal ID, evidence position numbers |
| Compare / hypothetical | Refusal + handoff (Atlas does not run counterfactuals) | 25-40 | none |

### 4.3 The percentile rule (Bug #7)

Every percentile statement must follow the form:

> "Apex sits at the **{N}th percentile on {metric_name}** in the **{cohort_label}** (n={sample_size})."

Strings like "Apex is at the 18th percentile" without metric / cohort / sample-size are **prohibited**.

### 4.4 The tenant-identity rule (Bug #1, #8)

Every lead sentence must name the **active** tenant. The literal strings `Asterline`, `Heliara`, `Brindlemark` must never appear in a rendered response — anywhere in the pipeline. Regression test must grep the rendered text for these tokens and fail the response build.

---

## 5. CXO-grade quality bar — the contract every response must satisfy

The bar below is **the standard against which fix PRs are measured**. Each row is a binary or 1-5 score; FAILs block demo readiness.

| # | Criterion | Pass condition | Today |
|---|---|---|---|
| C1 | Correct intent | Atlas answers the question the user asked, not a related one | **FAIL** on Q3, Q4, Q9, Q10, Q13, Q16, Q17, Q23 (eight of 25) — these misroute or fall to LLM with no targeted shape |
| C2 | Tenant-correct | Zero cross-tenant content. Any leak = FAIL. Active tenant named in lead | **FAIL** — synthesis route hardcodes Apex; chat LLM path does not scrub legacy aliases; `topicChunks` from un-tenant-scoped namespace |
| C3 | Deterministic | Same input → same output within a tenant-state hash | **FAIL** — no `temperature=0` set; synthesis cache hides this for the first miss only |
| C4 | Evidence-grounded | Every claim cites a program code, metric+value, signal ID, peer cohort definition, or named source | **PARTIAL** — scripted paths cite well; LLM path relies on system-prompt instruction (`prompt.ts:13`) but does not enforce |
| C5 | Honest | Planning ranges labeled, gaps named, no fabricated precise figures | **PARTIAL** — system prompt has the rule; output has no validator; `value-grounding.ts` is good but only fires on the `roi` and `llm` paths |
| C6 | Concise | 3-7 lines for most answers; tables only when comparing entities | **FAIL** — `compactConsultantChatText` (`response-shape.ts:350-391`) reshapes everything into Evidence/Missing/Next/Question bullets, even when prose was the right shape |
| C7 | Actionable | Ends with a concrete next step the CIO can act on | **PARTIAL** — suggestions render below, but the response body often does not embed a next step inline |
| C8 | Operator voice | CIO/CFO vocabulary; no "synergies"/"leverage"/consultant-speak | **PARTIAL** — system prompt has the rule (`prompt.ts:34-39`); no postcondition check; templated paths drift into "is sitting at X% adoption" |

**Threshold for demo readiness:** C1, C2, C3, C4, C5 must all PASS. C6, C7, C8 must score ≥ "PARTIAL with explicit follow-up".

---

## 6. Empirical walk — each canonical question × Apex dataset × quality bar scorecard

> **Note on method:** Tower is gated behind Clerk auth and a real Apex tenant binding. From this audit harness I cannot drive the live `https://app.abarva.ai/tower` UI directly. The walk below is therefore a **code-trace simulation**: for each canonical question I follow the classifier → composition mode → output template, and score the *shape* of the response Atlas would generate. The shape is the binding constraint; the prose varies but the shape is fixed by the template.

| Q | Path | C1 intent | C2 tenant | C3 determinism | C4 evidence | C5 honest | C6 concise | C7 actionable | C8 voice | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| Q1 | scripted `morning_summary` | PASS | **FAIL** (LLM-side leak if user asks follow-up) | PASS (scripted) | PASS | PASS | 4 | PASS | 4 | **FAIL on C2** |
| Q2 | scripted `portfolio_status` | PASS | conditional FAIL | PASS | PASS | PASS | 4 | PASS | 4 | conditional |
| Q3 | scripted `roi` | **FAIL** (returns aggregates, not lagging list) | conditional | PASS | PASS | PARTIAL | 3 | PARTIAL | 3 | **FAIL on C1** |
| Q4 | LLM fallback | uncertain | **FAIL** (LLM path leak) | **FAIL** (temp ≈ 1) | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL on C2, C3** |
| Q5 | LLM | uncertain | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL on C2, C3** |
| Q6 | scripted `roi` | PASS | conditional | PASS | PASS | PASS | 4 | PARTIAL | 4 | conditional |
| Q7 | scripted `cohort_position` | PASS | conditional | PASS | PASS | PARTIAL (percentile unscoped) | 4 | PARTIAL | 3 | **FAIL on C8 (percentile rule)** |
| Q8 | LLM | uncertain | **FAIL** (topic chunks unscoped) | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL on C2, C3, C5** |
| Q9 | LLM | **FAIL** | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL on C1, C2, C3** |
| Q10 | LLM | **FAIL** (percentile unscoped) | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q11 | LLM | **FAIL** (no dedicated cost intent) | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q12 | scripted `shadow_ai_detail` partial | PARTIAL | conditional | PASS | PASS | PASS | 4 | PASS | 4 | conditional |
| Q13 | LLM | **FAIL** | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q14 | scripted `idle_seats` | PASS | conditional | PASS | PARTIAL | PARTIAL | 4 | PARTIAL | 4 | conditional |
| Q15 | scripted `shadow_ai_detail` | PASS | conditional | PASS | PASS | PASS | 4 | PASS | 4 | conditional |
| Q16 | LLM | uncertain | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q17 | LLM | uncertain | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q18 | LLM | uncertain | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q19 | scripted `strategy_refusal` | PASS | PASS | PASS | n/a | PASS | 5 | PASS | 5 | **PASS** |
| Q20 | scripted `strategy_refusal` | PASS | PASS | PASS | n/a | PASS | 5 | PASS | 5 | **PASS** |
| Q21 | hybrid `signal_detail` (mistakenly applied to a program) | **FAIL** (no program-detail intent; only signal-detail) | conditional | PASS | PARTIAL | PARTIAL | 3 | PARTIAL | 3 | **FAIL on C1** |
| Q22 | hybrid `signal_detail` | PASS | conditional | PASS | PASS | PASS | 4 | PASS | 4 | conditional |
| Q23 | LLM | uncertain | **FAIL** | **FAIL** | PARTIAL | PARTIAL | 2 | PARTIAL | 3 | **FAIL** |
| Q24 | scripted `strategy_refusal` | PASS | PASS | PASS | n/a | PASS | 5 | PASS | 5 | **PASS** |
| Q25 | scripted `strategy_refusal` | PASS | PASS | PASS | n/a | PASS | 5 | PASS | 5 | **PASS** |

**Headline scorecard:**

- **Clear PASS:** 4 of 25 (Q19, Q20, Q24, Q25 — all `strategy_refusal`)
- **Conditional PASS** (depends on whether the user's follow-up triggers the LLM path): 7 of 25
- **Clear FAIL:** 14 of 25

The pass set is exactly the catalog where Atlas refuses to answer. The instant Atlas is asked to take a position, the quality bar fails on at least one of C1, C2, C3.

---

## 7. Failure inventory — every observed FAIL with quote + file:line + root cause

### F1 — Cross-tenant leak via un-scrubbed retrieval (P0)

- **Symptom (live):** "Asterline trails the retail median by 13 points" in an Apex Retail response.
- **Quote pattern:** any literal `Asterline | Heliara | Brindlemark` substring in the rendered text.
- **File:line:** `src/lib/agent/retrieval.ts:182-263` (Postgres-fallback chunk fetch); `src/lib/agent/retrieval-format.ts:27-32` (`formatChunk` writes raw `c.text`); `src/lib/agent/retrieval.ts:299` (`topicPromise` un-scoped).
- **Root cause:** the Atlas LLM retrieval pipeline does not call `normalizeLegacyClientAliases`. Four other modules do. The function lives at `src/lib/knowledge/tenant-enterprise-context.ts:1096-1106`.

### F2 — Cross-tenant leak via global topic namespace (P0)

- **Symptom:** "Abridge" and "missing BAA on clinical-adjacent tool" surface inside an Apex Retail Atlas turn.
- **Quote pattern:** any healthcare-specific vendor name (Abridge, Suki, DAX Copilot) or healthcare-specific compliance term (HIPAA, BAA, PHI) in a non-healthcare tenant's response.
- **File:line:** `src/lib/agent/retrieval.ts:299` — `topicPromise = queryNamespace(vector, 'global:ai_governance', args.topKTopic ?? 2)`.
- **Root cause:** the `global:ai_governance` namespace is industry-agnostic by design but contains source-document chunks that reference specific tenants (Meridian deliverables, etc.) when the corpus was built from across the demo dataset. Either the namespace must be re-cut to exclude tenant-bound content, or the retrieval must apply an industry filter.

### F3 — Synthesis route hardcoded to Apex (P0)

- **Symptom:** any non-Apex tenant sees an Apex portfolio quote at the top of Tower.
- **File:line:** `src/app/api/tower/synthesis/route.ts:6, 101-102, 195`.
- **Quote pattern:** the user message constructed at line 195 begins literally with `Portfolio snapshot for Apex Retail Group:`.
- **Root cause:** the route was written against a fixed in-process fixture (`APEX_RETAIL_PROGRAM_INSTANCES`). It does not consult `tenancy.clientId` to load the actual tenant's programs.

### F4 — Templated comparison-row boilerplate (P0)

- **Symptom:** every row in an Atlas-rendered comparison table shows the same `Needs validation. / Medium pending evidence.` strings.
- **File:line:** `src/lib/agent/response-shape.ts:209-210` (the literal fallback strings); `src/lib/agent/response-shape.ts:222-239` (`compactComparisonText` wraps them into a markdown table).
- **Root cause:** the fallback should be `'—'` or `'No weakness extracted'` / `'Fit not stated'`, not a confident-sounding sentence. Atlas is asserting "Medium pending evidence" as if that were a finding.

### F5 — Non-determinism (P1)

- **Symptom:** same input twice → different prose.
- **File:line:** `src/lib/atlas/llm.ts:189-205` and `src/app/api/tower/synthesis/route.ts:236-241` — neither sets `temperature`.
- **Root cause:** Anthropic SDK default temperature is ~1.0. For a CXO advisor surface the determinism contract requires `temperature: 0` (or a very small value with a seeded random for variety only on the suggestion chips).

### F6 — Evidence/Missing field collision (P1)

- **Symptom:** Evidence: and Missing: bullets show identical or near-identical text.
- **File:line:** `src/lib/agent/response-shape.ts:152-160, 350-391`. `extractEvidenceLine` selects the first non-recommendation, non-missing sentence with a numeric/topical cue; `extractMissingLine` selects the first sentence containing 'missing'/'do not have'/'absent'. If the source sentence carries both signals, both extractors land on it.
- **Root cause:** the two extractors share a source string and do not coordinate. The fix is to (a) make `extractEvidenceLine` exclude any sentence already promoted to Missing, and (b) return null rather than duplicate text when no distinct Missing exists.

### F7 — Wrong-intent routing on portfolio diagnostics (P2)

- **Symptom:** "Show me lagging programs by realized value" returns portfolio aggregates instead of a ranked list.
- **File:line:** `src/lib/atlas/classifier.ts:69-71` (matches 'realized value' → `intent='roi'`); `src/lib/atlas/scripted-engine.ts:124-142` (`buildRoiSummary` is aggregates-only).
- **Root cause:** classifier is a keyword whack-a-mole, not an intent model. Needs a `lagging_programs` intent and a `buildLaggingProgramsList` builder.

### F8 — Stuck "Atlas is thinking…" on synthesis route (P2)

- **Symptom:** Tower hero quote sits on the spinner indefinitely on slow LLM calls.
- **File:line:** `src/app/api/tower/synthesis/route.ts:236-301` (streams via `client.messages.stream` with no AbortController and no client-side timeout).
- **Root cause:** the chat panel has an 18s `AbortController` (`TowerIndexPage.tsx:2203-2204`), but the synthesis hero quote is fetched by a separate component without one.

### F9 — Max-token truncation mid-sentence (P2)

- **Symptom:** "What are others doing in this industry?" cuts off mid-sentence.
- **File:line:** `src/lib/atlas/llm.ts:191` (`max_tokens: 500`).
- **Root cause:** 500 tokens ≈ 350-400 words. Industry-context responses with 3-4 corpus chunks routinely exceed this. The fix is either to budget more tokens for industry-corpus questions or to instruct the model to be ruthless about the 110-word target — and to verify the response is not truncated before returning (check `stop_reason !== 'max_tokens'`).

### F10 — Percentile mixing without scale (P2)

- **Symptom:** "18th percentile" and "93rd percentile" appear in adjacent sentences with no metric label.
- **File:line:** `src/lib/atlas/scripted-engine.ts:117` ("around the {N}th percentile" with no metric); `src/lib/atlas/repository.ts:149-152` (four orthogonal percentile fields on the portfolio summary).
- **Root cause:** there is no percentile-rendering helper, and no system-prompt rule enforcing the "{N}th percentile on {metric_name} ({cohort_label}, n={sample_size})" form.

### F11 — Classifier coverage gap (P2)

- **Symptom:** 17 of 25 canonical CXO questions fall through to the LLM path, which is the worst path.
- **File:line:** `src/lib/atlas/classifier.ts:12-104`.
- **Root cause:** the classifier only has eight scripted intents. The fix is structural: add dedicated intents for `lagging_programs`, `cost_runrate`, `vendor_concentration_detail`, `governance_coverage`, `at_risk_gates`, plus a `program_detail` intent distinct from `signal_detail`.

### F12 — LLM fallback uses portfolio aggregates verbatim (low risk, P3)

- **File:line:** `src/lib/atlas/llm.ts:41-75` (`buildFallback`). When the Anthropic call fails or no API key, the fallback prose is a metric dump — the exact anti-pattern the system prompt forbids ("Do not lead broad questions with raw dollar values, counts, or KPI dumps." — `prompt.ts:13`).
- **Root cause:** the fallback was written before the system-prompt rule landed.

---

## 8. Prioritized fix plan — slices ordered by blast radius × likelihood × ease

### P0 — Catastrophic; ship in one wave (Day 1)

| Slice | Files | Contract violation closed | Test that prevents regression |
|---|---|---|---|
| **P0.1 — Untether synthesis from Apex.** Replace `APEX_RETAIL_PROGRAM_INSTANCES` with a tenant-scoped query that loads the signed-in tenant's program instances; replace literal `"Portfolio snapshot for Apex Retail Group:"` with `Portfolio snapshot for ${tenant.name}:`. | `src/app/api/tower/synthesis/route.ts:6, 101-102, 195` (+ a new `loadTenantProgramInstances(tenancy.clientId)` helper) | C2 tenant-correct | Integration test: mock Meridian tenancy → assert response body does not contain "Apex" and does contain "Meridian"; snapshot test of user-message construction per tenant. |
| **P0.2 — Scrub legacy aliases in Atlas retrieval.** Apply `normalizeLegacyClientAliases` to every `RetrievedChunk.text` before it is written to the prompt. Either lift the helper to `src/lib/knowledge/legacy-alias-scrub.ts` (single source of truth) and import it from `retrieval.ts`/`retrieval-format.ts`, or call the existing copy. | `src/lib/agent/retrieval.ts:211-260` (insert scrub at chunk-construction); `src/lib/agent/retrieval-format.ts:27-32` (defense-in-depth scrub at format time); new `src/lib/knowledge/legacy-alias-scrub.ts` | C2 tenant-correct | Unit test: chunk text containing "Asterline Retail" → rendered output contains "Apex Retail" and no "Asterline". Invariant grep test in `__tests__/atlas-eval/` that scans the rendered LLM input for forbidden tokens. |
| **P0.3 — Tenant-scope the topic namespace.** Either re-cut `global:ai_governance` to exclude tenant-bound chunks (audit Pinecone index), or apply an industry filter to `topicPromise` and add a hard reject for chunks whose `metadata.source_key` references a tenant other than the active one. | `src/lib/agent/retrieval.ts:299` + new metadata-filter helper | C2 tenant-correct | Test: vector-space query for "industry context" returns no chunks containing "Abridge", "Meridian", "First Capital" when active tenant is Apex. |
| **P0.4 — Kill the boilerplate fallbacks.** Replace `'Needs validation.'` and `'Medium pending evidence.'` with `'—'` (or omit the column from the rendered row when no data extracted). | `src/lib/agent/response-shape.ts:209-210` | C5 honest, C6 concise | Snapshot test: rendered comparison table on a generic LLM response shows `—` not the boilerplate; invariant grep test that fails the build if either literal string is present in committed source. |

### P1 — Required before any real customer demo (Day 2)

| Slice | Files | Contract violation closed | Test |
|---|---|---|---|
| **P1.1 — Determinism.** Set `temperature: 0` on both Anthropic calls. | `src/lib/atlas/llm.ts:189-205`; `src/app/api/tower/synthesis/route.ts:236-241` | C3 deterministic | Replay test: same input → byte-identical output across two consecutive calls when `temperature=0` and `seed` is set. |
| **P1.2 — Evidence/Missing collision.** Make `extractMissingLine` and `extractEvidenceLine` mutually exclusive: if the same sentence resolves to both, drop Missing; emit Missing only when a distinct caveat sentence exists. | `src/lib/agent/response-shape.ts:141-160, 350-391` | C6 concise, evidence integrity | Snapshot test: LLM response with one evidence sentence + zero missing-data sentence → no Missing bullet emitted; LLM response with both → distinct text in each. |
| **P1.3 — Truncation protection.** Bump `max_tokens` to 800 for industry-context responses; or detect `stop_reason === 'max_tokens'` and append "(response truncated — ask Atlas to continue)". | `src/lib/atlas/llm.ts:189-220` | F9 | Test: trigger an industry-context response, assert no mid-sentence truncation OR explicit truncation flag in response. |
| **P1.4 — Synthesis timeout.** Add a 25s AbortController to the synthesis stream; on abort, return the cache miss as a 504 with a friendly fallback text. | `src/app/api/tower/synthesis/route.ts:236-301` | F8 | Test: mock a slow Anthropic stream → assert response returns within 25s + 2s slack with a timeout indicator. |

### P2 — Structural quality lift (Days 3-7)

| Slice | Files | Contract violation closed | Test |
|---|---|---|---|
| **P2.1 — Intent catalog expansion.** Add `lagging_programs`, `cost_runrate`, `vendor_concentration_detail`, `governance_coverage`, `at_risk_gates`, `program_detail`. Update classifier; add corresponding `build…` functions in `scripted-engine.ts`. | `src/lib/atlas/classifier.ts:12-104`; `src/lib/atlas/scripted-engine.ts`; `src/lib/atlas/types.ts:1-30` | C1 correct intent | Golden-answer test per new intent: assert the response is a ranked list (not aggregates) for `lagging_programs`, etc. |
| **P2.2 — Percentile rendering helper.** Add `renderPercentile({ value, metricName, cohortLabel, sampleSize })` and force every percentile mention through it. | `src/lib/atlas/value-grounding.ts` + new `src/lib/atlas/percentile-render.ts` | F10, C8 voice | Snapshot test: every percentile in a rendered Atlas response includes metric name + cohort + n. |
| **P2.3 — Classifier → intent-model upgrade.** Replace keyword `hasAny` with a small intent classifier (could be a tiny embedding-similarity match against a curated phrase bank, or a deterministic decision tree with confidence). | `src/lib/atlas/classifier.ts` (full rewrite) | C1, F11 | Eval set: ≥90% intent accuracy on a curated 100-question gold set. |
| **P2.4 — Program-detail drilldown.** Q21 needs a distinct path. Add `query_program_detail(ctx, programId)` and a `buildProgramDetail` renderer. | `src/lib/atlas/tool-belt.ts`, `src/lib/atlas/scripted-engine.ts` | C1 for Q21 | Golden test: "tell me about APX-CDP-2026" returns program-shaped detail, not signal-shaped. |

### P3 — Voice/concision polish

| Slice | Files | Contract violation closed |
|---|---|---|
| **P3.1 — LLM-fallback rewrite.** The `buildFallback` prose at `src/lib/atlas/llm.ts:41-75` is the exact pattern the system prompt forbids. Rewrite to lead with the interpretation, not the metric dump. | `src/lib/atlas/llm.ts:41-75` |
| **P3.2 — `compactConsultantChatText` review for Tower.** Tower is the only advisor-class surface still in the compact allow-list (`response-shape.ts:430-438`). Consider removing it, following the precedent set for Source and Intelligence in VOICE.STRAT-2026-05-10f. | `src/lib/agent/response-shape.ts:393-438` |

---

## 9. Eval harness recommendation — how to lock the bar so regressions are caught

The audit's empirical walk in §6 must become a **continuous eval** that runs on every PR touching `src/lib/atlas/**`, `src/app/api/tower/**`, or `src/lib/agent/retrieval*.ts`.

### 9.1 Three test tiers

| Tier | What it checks | Where it runs |
|---|---|---|
| **Tier 1 — Invariant grep tests** (fastest, run on every commit) | The literal tokens `Asterline | Heliara | Brindlemark` MUST NOT appear in the rendered text of any Atlas response across all three demo tenants. The literal strings `'Needs validation.'` and `'Medium pending evidence.'` MUST NOT appear in committed source. The percentile rendering helper MUST be the only place percentiles are interpolated into prose. | `npm run test:atlas-eval` (extend `src/__tests__/atlas-eval/`) |
| **Tier 2 — Golden-answer snapshot tests** | The 25 canonical questions × 3 tenants = 75 fixed inputs. Each has a JSON snapshot of `{intent, toolsUsed, signalId?, response_shape}` — not the prose, but the structural envelope. PR-time diff review. | New `src/__tests__/atlas-eval/golden-answers/` |
| **Tier 3 — Quality bar scorecard** (nightly, model-graded) | The 25 canonical questions × 3 tenants → run Atlas → score each response on C1-C8 using a separate grading model (claude-opus-4-7 with a strict rubric). PR cannot merge if any tenant's overall pass rate drops below 80%. | Nightly GitHub Action; results posted to a dashboard |

### 9.2 The first golden set (commit alongside fix PRs)

Build the golden set from the 25 questions in §3, ×3 tenants (Apex, Meridian, First Capital). 75 snapshots. Each snapshot pins:

- Classifier output: `intent`, `routeType`
- Tool calls made (ordered list): `toolsUsed`
- Citation count
- Response shape: `{has_lead: true, evidence_bullet_count: 3, has_honesty_line: true, has_next_step: true}`
- Forbidden-token check (no Asterline/Heliara/Brindlemark, no cross-tenant program IDs)

### 9.3 Continuous monitoring (post-launch)

Tap the existing `appendAtlasReasoningTrace` infrastructure (`src/lib/atlas/repository.ts:464-493`) to emit a daily report:

- % of turns routing to LLM (target: < 30% once intent catalog is expanded)
- % of turns with `interpretationConfidence === 'low'` (target: < 15%)
- Top 20 user questions that fell through to LLM (drives the next intent backlog)

---

## 10. The demo-ready definition — what "good enough to put in front of a CIO" means

Atlas is demoable to a real CIO when **every one** of the following is true:

1. **All P0 slices have shipped and the Tier 1 invariant tests pass on main.** Cross-tenant content does not leave the tenant. Period.
2. **All P1 slices have shipped.** Determinism is mechanical; evidence/missing collision is impossible; truncation is detected and disclosed.
3. **Golden-answer snapshot tests are green** for at least Apex + one other tenant.
4. **The classifier covers at least 80% of the canonical question set** (today: 32%). The fall-through-to-LLM rate on the eval set is below 30%.
5. **Synthesis quote names the active tenant** and is regenerated per tenant.
6. **Atlas can be asked the same question twice and produce the same answer** — verified by replay test.
7. **A live walk** of 10 questions, scripted by the founder, returns answers that satisfy C1-C5 on every turn. No "Asterline". No "Medium pending evidence." in a row. No portfolio aggregates served when a ranked list was asked for.
8. **The "what are others doing" question** returns a complete answer (no mid-sentence cut) or an explicit "more — ask Atlas to continue" affordance.
9. **The synthesis hero quote** has a fallback if the LLM stream takes more than 25s, and never sits indefinitely on the spinner.

When all nine hold, schedule the CIO conversation. Until then, treat Atlas as an internal-demo surface only.

---

### Appendix A — files visited

- `src/lib/atlas/orchestrator.ts`
- `src/lib/atlas/classifier.ts`
- `src/lib/atlas/scripted-engine.ts`
- `src/lib/atlas/llm.ts`
- `src/lib/atlas/prompt.ts`
- `src/lib/atlas/tool-belt.ts`
- `src/lib/atlas/repository.ts`
- `src/lib/atlas/tower-grounding.ts`
- `src/lib/atlas/value-grounding.ts`
- `src/lib/atlas/rendered-response.ts`
- `src/lib/atlas/types.ts`
- `src/lib/agent/retrieval.ts`
- `src/lib/agent/retrieval-format.ts`
- `src/lib/agent/response-shape.ts`
- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/lib/azure-search/tenant-context-retriever.ts`
- `src/lib/programs/transformers.ts`
- `src/lib/admin/release-ledger.ts`
- `src/app/api/v1/atlas/_auth.ts`
- `src/app/api/v1/atlas/chat/route.ts`
- `src/app/api/v1/atlas/ask/route.ts`
- `src/app/api/tower/synthesis/route.ts`
- `src/components/atlas/AtlasChatPanel.tsx`
- `src/components/atlas/AtlasRail.tsx`
- `src/components/atlas/AtlasSignalDetailPanel.tsx`
- `src/components/atlas/EvidenceChainCard.tsx`
- `src/components/tower/TowerIndexPage.tsx`
- `src/app/(maestro)/tower/page.tsx`

### Appendix B — auth-gated surface caveat

Tower lives behind Clerk auth and a real tenant binding. From this audit harness, I cannot drive the live `https://app.abarva.ai/tower` UI to reproduce each prosecution exhibit at the screen. The audit is therefore a **codebase-grounded** validation: every exhibit is anchored to a file:line that demonstrates the failure mode, and the §6 walk is a code-trace simulation of each canonical question against the active Atlas pipeline. Where the live transcript's symptom and the code path diverge — for instance, the "stuck Atlas is thinking…" indefinitely state in Bug #5 — I have noted the two most likely code-resident causes (synthesis-route no-abort + chat-route 18s abort) and named both for the fix PR to triage.
