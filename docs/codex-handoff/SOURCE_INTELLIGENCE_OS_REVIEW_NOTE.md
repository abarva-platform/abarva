# Source Intelligence OS Spec — Review Note

**Reviewer:** Claude (Opus 4.8) · **Date:** 2026-06-19 · **Branch verified against:** `docs/source-intelligence-os-spec` (spec commit `cb2f17cd9`)
**Spec was grounded on:** `codex/corpus-wave-24` · **Method:** §2 verification commands + read-only code audit of the live generate path and the dormant analytical modules.

> **Verdict:** The spec is **well-grounded and load-bearing-accurate.** Every ground-truth claim in §4 of the handoff brief re-verifies on the current branch. Three real drifts and three residuals need small, surgical grounding patches (listed in §C; applied with a changelog in `_REVIEW_PUNCHLIST.md`). None of the corrections change the spec's thesis or roadmap.

---

## A. Claims CONFIRMED (re-verified on the current branch)

| Claim | Result |
|---|---|
| Live pipeline seams exist (`context-binder.ts`, `prompt-registry.ts`, `server.ts`) | ✅ present |
| **3 of 33** prompt templates live — `d01_strategy_memo`, `d05_scope_memo`, `d09_rfp_pack` | ✅ exactly these three (`DEFAULT_MODEL = claude-sonnet-4-6`, `DEFAULT_MAX_TOKENS = 4000`) |
| `render-pdf/route.ts` returns **200** (`@react-pdf`), wired for **d05/d09/d24/d27**, **404** for unwired — never 501 | ✅ confirmed; coverage is actually d05/d09/d24/d27 **+ dx0/dx1/dx6b** via `isPdfGeneratable` |
| `text-parser.ts` is **text/first-mile only** (no `mammoth`/`pdf-parse`/`exceljs`) | ✅ header says "does not replace the async binary/parser/vector/graph pipeline"; accepts only `markdown/txt/csv/html` |
| Canonical counts: gate criteria + evidence requirements | ✅ **39 criterion entries (38 GATE ids)** in `gate-criteria.ts`; **21** in `evidence-requirements.ts` |
| Archetype seam = `classifier/category-classifier.ts:classifySourcingEvent()` + `estimateEventShouldCost`, called inside **dormant** `source-answer-engine.ts` — not `source-shape-resolver.ts` | ✅ both symbols live in `source-answer-engine.ts`; should-cost **is** imported there |
| `should-cost-model.ts` **is imported** by `source-answer-engine.ts` (its "NOT wired" header comment is stale) | ✅ imported at line 21 |
| `disclosure-flag/` is a **legal-privilege classifier** (attorney_client/work_product, downstream inheritance) — **not** evidence-refusal | ✅ `PRIVILEGED_CLASSIFICATIONS = ['attorney_client','work_product']`; no refusal logic |
| `voice-doctrine` real path = `src/lib/agent/voice-doctrine/{sentinel,atlas,nexus,steward}.ts` (NOT under `source/`) | ✅ confirmed |
| Feature flag key = `retrieval_azure_search` (`tenant-context-v1` only in the description string) | ✅ confirmed |
| Dormant analytical modules exist (should-cost, delivery-model gate, proposal-normalization) and run only via the chat path | ✅ all three execute only inside `source-answer-engine.ts` → `nexus-api.ts` → live `nexus/ask` route; **absent from the generate path** |

**Net:** every §4 "DO NOT regress" fact holds. The spec's current-state scorecard is trustworthy.

---

## B. Claims now STALE / needing a grounding patch

| # | Spec says | Reality on this branch | Patch |
|---|---|---|---|
| **B1** | The `Event → ContextBinder → PromptRegistry → Claude → Deliverable` pipeline is "invoked through `…/artifacts/generate/route.ts`" (Vol2 §5.1, Vol1 future-state, Vol4 §16.2) | **Both routes exist, but the spec names the wrong one.** `…/artifacts/generate/route.ts` is a **persistence-only** endpoint (it stores agent-supplied markdown into the registry — header: "Persists an agent-generated Source work product"; it never calls context-binder/prompt-registry/Claude). The pipeline that *does* bind context, build the prompt, and stream Claude is **`…/artifacts/[artifactCode]/generate-from-claude/route.ts`** (`POST` @ line 55; `messages.stream` @ ~218–235). The reasoning-stage insertion seam is in **that** file, lines **181–185** (`collectUpstreamBodies(ctx, …)` → `template.buildUserMessage(ctx, upstreamBound)`). | Correct the **pipeline-describing** references (Vol2 §5.1, Vol1 future-state, Vol4 §16.2) to `generate-from-claude/route.ts`; note `generate/route.ts` is the persistence endpoint. Grounding-map inventory cells that merely list `generate/route.ts` are not wrong (it exists). **(seam refs applied)** |
| **B2** | Vol 1 Ch2 + `_GROUNDING_MAP.md` cite **"57 gate criteria / 28 evidence requirements"** | Repo has **38 GATE ids (39 entries) / 21 evidence requirements**. Vol4 §16.5 and Ch15 already say 38 — so the spec is internally inconsistent. | Patch Vol1/grounding-map to **38 / 21** to match Vol4. **(applied)** |
| **B3** | The "Source Event Archetype Framework (4 archetypes, two-axis resolver, 10-method library)" is described as **DORMANT** | On this branch the **dedicated framework code is absent from `src/`** — it exists only as a 2026-06-10 release record + git refs. The only live archetype seam is `classifier/category-classifier.ts` (`classifySourcingEvent`), reached only via the chat path. The master outline Ch2 still points at `source-shape-resolver.ts` for the archetype framework (Vol2 §5.6 already corrects this). | Note in the spec that the framework is **absent-from-this-branch, not merely dormant**; the live seam is `category-classifier.ts`. Fix the outline Ch2 reference. **(noted; outline ref patched)** |

---

## C. Residuals to clean (surgical; from `_REVIEW_PUNCHLIST.md` + this review)

| # | Item | Location | Action |
|---|---|---|---|
| **C1** | Typo "wrestructures" → "restructures" | Vol3 Ch14 §14.1, Principle 4 ("Format follows intent") | fix **(applied)** |
| **C2** | Ch9↔Ch12 Contract Agent input-list mismatch: Ch9 ingests **d23 BAFO + d16 scorecard commitments + d25 risk attestation**, but Ch12 §12.4 Contract Agent inputs list **only d23 + d25** — the **d16 scorecard-commitment input is missing** (the canonical "tier-1 SLA claimed in evaluation, best-effort in contract" catch depends on it) | Vol3 Ch12 §12.4 | add d16/scorecard commitments to the Ch12 Contract Agent input list **(applied)** |
| **C3** | Fragile exact line-number / LOC citations (e.g. `scorecard.ts` "39 LOC"; `composePrimaryVoice() line 282`; many `*.ts (NNN lines)` in the grounding map) — brittle the moment a file changes | `_GROUNDING_MAP.md`, Vol2 Ch6, Vol3 Ch12 §12.5/§12.6 | **Not auto-patched** (would touch dozens of cites). Recommend a follow-up pass that replaces line/LOC cites with `file:function` references. Flagged in punchlist. |
| **C4** | Code-doc drift: `should-cost-model.ts:13` header still says "NOT wired into source-answer-engine.ts" — it now IS | `src/lib/source/should-cost/should-cost-model.ts` (live code) | **Not touched** (guardrail: no code changes during review). Recommended 1-line comment fix when Phase-1 work opens that file. |

---

## D. Clarifications for the build plan (not errors — sharpenings)

1. **No quality gate on the live generate path.** `generate-from-claude/route.ts` is a **single streamed Sonnet pass** persisted directly — there is *no* draft→review→rewrite loop and *no* quality gate on this route. The governed multi-pass authoring with quality gates is the separate **Deliverable Intelligence Orchestrator**, which is *not* wired into this route. So Phase 1's "make the Reasoning Envelope the gate" is **net-new on this path**, not an upgrade of an existing gate. The Phase-1 plan accounts for this.
2. **The analytical brains consume a different context type.** `should-cost`, `delivery-model-gate`, `proposal-normalization`, and `category-classifier` execute today only inside `source-answer-engine.ts` and consume a `SourceAgentContextBundle`; the generate path has only `SourceGenerationContext`. The connective tissue Phase 1 must add is an **adapter** from `SourceGenerationContext` (or `ctx.event` directly) into the inputs these frameworks need. This is the single most important integration detail and is sliced explicitly in the Phase-1 plan.
3. **"One definition, two callers."** The frameworks must remain callable from both the dormant answer engine (chat) and the new Analysis stage (generation) — do not fork the logic.

---

## E. Bottom line

The spec passes review. Its thesis (`Context → Analysis → Recommendation → Deliverable`, with reasoning carried in a canonical Reasoning Envelope) maps cleanly onto real, present seams. The corrections are cosmetic/path-level, not structural. **Proceed to build** per the Phase-1 plan (`SOURCE_INTELLIGENCE_OS_PHASE1_BUILD_PLAN.md`) and the 7-phase backlog (`SOURCE_INTELLIGENCE_OS_BACKLOG_AND_MATRIX.md`). Grounding patches applied are logged in `_REVIEW_PUNCHLIST.md` (changelog section).
