# Lakeshore Capital Corpus — Autonomous Execution Brief

**For:** Codex (full-privilege autonomous run)
**Mission:** Generate, QA, load, and evaluate a 10,000-pattern Chicago-private-holdings corpus end-to-end, with no human-in-loop except on explicit escalation gates.
**Budget envelope:** ~$75 in model spend (OpenAI primary, higher-reasoning OpenAI model on high-ground waves), ~6-12 hours wall-clock.
**Output:** Corpus loaded into Azure AI Search + Postgres + graph, evaluated against 100-question harness, with a final readiness report.

> 2026-06-05 execution override: use **OpenAI only** for corpus generation, critique, retry, gap audit, embeddings, and eval grading. Do not call Anthropic for this build lane. Production runtime may later use Claude for dry-run demos, but this corpus-completion execution must remain OpenAI-only.

## Current Continuation State — 2026-06-05

The non-corpus Lakeshore demo lane is complete and live-proven. Corpus work resumes last from the current live substrate:

- Postgres `corpus_patterns`: `8,987` published Lakeshore patterns.
- All `8,987` published patterns have `search_doc_id`.
- Vector store: native Azure AI Search index `lakeshore-patterns-v1`, not Pinecone.
- Remaining target gap: approximately `1,013` patterns to reach 10,000.
- Before loading any new batch, refresh the Azure AI Search count if `AZURE_SEARCH_ENDPOINT` / `AZURE_SEARCH_SERVICE_NAME` and `AZURE_SEARCH_ADMIN_KEY` / `AZURE_SEARCH_QUERY_KEY` are available. If those env vars are absent, use Postgres as the source-of-truth baseline and mark Azure count refresh as blocked.

---

## Mission

Lakeshore Capital is a new tenant being seeded for the Nexus platform — a Chicago-based diversified private holdings company modeled on Morgan Street Holdings. The corpus you generate becomes the institutional intelligence layer the Lakeshore-tenant agent reasons over.

You execute autonomously. Do not pause to ask questions unless an explicit escalation gate fires.

---

## Prerequisites — verify before kick-off

Before generating, confirm all of these exist. If any is missing, halt and surface as `BLOCKED_PRECONDITION`.

| # | Item | How to verify |
|---|---|---|
| 1 | Master prompt | `docs/build/codex-handoff/2026-06-04-LAKESHORE_CORPUS_MASTER_PROMPT.md` — paste this content from the prior chat into that file if not present |
| 2 | OpenAI API key | `process.env.OPENAI_API_KEY` set; test `GET https://api.openai.com/v1/models` returns 200 |
| 3 | Postgres connection | Existing genome corpus loader works against `corpus_patterns` / `corpus_pattern_content`; confirm Lakeshore rows can be read and upserted |
| 4 | Azure AI Search index | `lakeshore-patterns-v1` index exists OR create via `scripts/load-genome-wave.ts --ensure-index-only`; if Azure Search env is missing, stop before load and surface `BLOCKED_PRECONDITION` |
| 5 | Graph store | Postgres `pattern_nodes` + `pattern_edges` tables exist (or Neo4j connection healthy) |
| 6 | Loader script | `scripts/load-genome-wave.ts` (reuse the existing pattern from Waves 18-24) — confirm it handles JSONL input |
| 7 | Working tree | Clean checkout off `main` at `/private/tmp/lakeshore-corpus-build/` (fresh worktree pattern Codex used for the surge) |

---

## The 9-wave loop — execute exactly this rhythm

For each wave `n` in [1..9], execute the following steps. Do not skip any. Do not parallelize across waves (sequence matters because later waves reference earlier wave IDs).

### Step 1 — GENERATE

```
OpenAI call:
  model: gpt-4o (waves 1-4, 8, 9)
         o3 / strongest available OpenAI reasoning model (waves 5, 6, 7 — high-ground domains)
  system: <full content of MASTER_PROMPT.md>
  user:   "MODE=GENERATE WAVE=<n> DOMAINS=<per the wave plan>"
  max_tokens: 32000
  temperature: 0.4
```

Stream the response. As JSONL pattern lines arrive, append to `reports/lakeshore-corpus-build/wave-<n>/raw.jsonl`. Stop when `WAVE_COMPLETE` signal received.

**Failure handling:** If the call returns less than 50% of target pattern count, retry once with a stronger nudge in the user message (`"Continue from where you stopped. Generate the remaining <N> patterns."`). If still under, mark wave as `INCOMPLETE_GENERATION` and proceed to critique with what you have — the critic will surface the gap.

### Step 2 — CRITIQUE (first pass, same model)

```
OpenAI call:
  model: same as Step 1
  system: <MASTER_PROMPT.md>
  user:   "MODE=CRITIQUE WAVE=<n>\n\n<paste contents of wave-<n>/raw.jsonl>"
  max_tokens: 32000
  temperature: 0.1
```

Capture verdicts. Append to `wave-<n>/critique-pass-1.jsonl`. Extract:
- `approved_ids` (verdict APPROVE)
- `refine_ids` (verdict REFINE — with remedy notes)
- `kill_ids` (verdict KILL — with reasons)
- `go_no_go` from CRITIQUE_SUMMARY

### Step 3 — CRITIQUE (second pass, fresh context) — waves 5, 6, 7 only

For high-ground waves, run a second critique with a **fresh chat session** (new conversation, no Step 2 context):

```
Same call shape as Step 2 but a brand-new OpenAI conversation with no prior messages beyond the master prompt and critique payload.
```

Compare the two critiques. Any pattern flagged KILL by the fresh critic that the same-model critic APPROVED → override to KILL. Disagreements on REFINE → take the stricter verdict. Write reconciled verdicts to `wave-<n>/critique-final.jsonl`.

### Step 4 — RETRY refines and kills

For every pattern in `refine_ids` and `kill_ids`, run:

```
OpenAI call:
  model: same as Step 1
  system: <MASTER_PROMPT.md>
  user:   "MODE=GENERATE WAVE=<n> RETRY=<comma-separated ids>\n\nFailing patterns with critic remedies:\n<inline the failing pattern JSON + remedy text per pattern>"
  max_tokens: 32000
  temperature: 0.5  ← slightly higher to escape the prior frame
```

Append regenerated patterns to `wave-<n>/raw.jsonl`, replacing the originals at the same id (overwrite-by-id). If a kill_id can't be replaced (the generator says "no replacement possible"), accept the gap.

### Step 5 — CRITIQUE (retry pass)

Re-critique only the regenerated patterns (efficient):

```
OpenAI call:
  user: "MODE=CRITIQUE WAVE=<n> RETRY=<retry_ids>\n\n<paste regenerated patterns>"
```

Apply the same verdict logic. After this pass:
- If `approval_rate >= 70%` for the retry slot → wave is GO
- If `approval_rate < 70%` → wave is RETRY (run Step 4 + 5 ONCE more; cap retries at 2 total)
- If still failing after 2 retries → wave is KILL_WAVE → escalate

### Step 6 — GAP AUDIT

```
OpenAI call:
  user: "MODE=GAPS WAVE=<n>"
  (provide the finalized wave output as context)
```

Write `wave-<n>/gaps.json` — these become "known gaps" for the final readiness report, not blockers.

### Step 7 — LOAD to data stores

Only when wave verdict is `GO`. Execute in order:

**7a. Postgres relational:**
```bash
npx tsx scripts/load-genome-wave.ts \
  --tenant lakeshore \
  --wave <n> \
  --file reports/lakeshore-corpus-build/wave-<n>/raw.jsonl
```
Expect: row count matches approved-pattern count. Validate every row has `id`, `tenant_scope='lakeshore'`, `domain`, `vintage='2026-Q2'`.

**7b. Azure AI Search:**
Embed `embedding_text` via `text-embedding-3-large` (or your project's standard embedding model). Push to the `lakeshore-patterns-v1` index. Use existing genome-wave embedding pipeline. Confirm document count matches.

**7c. Graph (Postgres pattern_nodes/pattern_edges OR Neo4j):**
For each pattern: create one node tagged with `domain`. For each entry in `graph_relationships`: create one typed edge. If target pattern doesn't exist yet (forward references to later waves), buffer the edge in `wave-<n>/buffered-edges.jsonl` for resolution after the final wave loads.

**7d. Resolve buffered edges** — after all 9 waves load, replay buffered edges. If targets still don't exist, log as `dangling_edge` and leave unresolved (don't fabricate target patterns).

### Step 8 — Wave checkpoint

Write `wave-<n>/checkpoint.json`:

```json
{
  "wave": <n>,
  "domains": [...],
  "generated_count": N,
  "approved_count": N,
  "killed_count": N,
  "final_emitted": N,
  "loaded_postgres": true,
  "loaded_azure_search": true,
  "loaded_graph": true,
  "buffered_edges": N,
  "wave_status": "GO|RETRY|KILL_WAVE",
  "elapsed_seconds": N,
  "model_spend_estimate_usd": N.NN
}
```

Commit the wave output to the build worktree on a branch `lakeshore-corpus/wave-<n>`:
```
git add reports/lakeshore-corpus-build/wave-<n>/
git commit -m "feat(corpus): Lakeshore wave <n> — <domains> (<count> patterns)"
```

Do not push to remote between waves. Push only after all 9 waves complete or on escalation.

---

## Escalation gates — STOP if any of these fire

Halt the autonomous loop and surface to Anand with a `ESCALATE` marker:

| Gate | Condition | Action |
|---|---|---|
| **G1** | Any wave returns `go_no_go=KILL_WAVE` after 2 retry attempts | Stop. Write `ESCALATE_KILL_WAVE.md` with the wave's critique summary, the failing patterns, and the critic's specific concerns. |
| **G2** | High-ground waves (5, 6, 7) approval rate < 80% after retries | Stop. The credibility-load-bearing domains failed. Surface to Anand for hand-authored exemplars. |
| **G3** | Total model spend exceeds **$150** | Stop. Cost discipline check before proceeding. |
| **G4** | Total wall-clock exceeds **18 hours** | Stop. Investigate why this is taking longer than expected. |
| **G5** | Loader script returns non-zero exit code on any wave | Stop. Data integrity is non-negotiable. |
| **G6** | Azure AI Search index returns < 95% of expected document count | Stop. Indexing pipeline broken. |
| **G7** | Any wave produces zero `lakeshore_specificity: chicago_local` patterns | Stop. Means the model has drifted to generic finance and the corpus has no local anchor. |

For each escalation, write the corresponding `ESCALATE_*.md` file with full context and STOP. Do not retry without human input.

---

## The 100-question evaluation harness

After all 9 waves load successfully (no KILL_WAVE escalations), run the agent-quality evaluation.

### Building the question set

Author 100 questions across the 18 domains. Split:
- 40 questions: factual recall (does the agent know what the corpus says?)
- 30 questions: applied reasoning (can it apply doctrine to a novel scenario?)
- 20 questions: tradeoff judgment (can it weigh conflicting patterns?)
- 10 questions: anti-pattern recognition (will it correctly reject a bad idea?)

Per domain quota (rough):
- D01 (Investment Strategy): 8 questions
- D02 (Deal Sourcing): 5
- D03 (Due Diligence): 7
- D04 (Valuation): 7
- D05 (Term Sheet): 6
- D06 (Post-close): 4
- D07 (Portfolio Ops): 7
- **D08 (Treasury): 10** — high-ground, more questions
- D09 (Tax): 5
- D10 (Legal): 4
- **D11 (Governance): 8** — high-ground
- D12 (Family Office): 4
- D13 (Exit): 5
- **D14 (IT Financials): 8** — high-ground
- D15 (Risk): 4
- D16 (Vendor): 3
- D17 (Sector): 7
- D18 (Chicago): 3
- **Total: 100**

Author these questions yourself per the master prompt's domain depth. Each question must be answerable from a specific pattern in the loaded corpus. Record the expected supporting pattern_ids per question — these are the ground truth.

Write to `reports/lakeshore-corpus-build/eval/questions.jsonl`:

```json
{
  "qid": "Q-D08-001",
  "domain": "D08",
  "type": "factual",
  "question": "What is Lakeshore's discipline for the daily cash position pre-walk?",
  "expected_pattern_ids": ["PAT-LSH-D08-00037"],
  "grading_rubric": "Answer must mention pre-walking by 9am Central, before the auto-feed lands; reference the >5% variance same-day reconciliation rule; cite the relevant pattern."
}
```

### Running the harness

For each question:

1. Hit the actual Lakeshore agent endpoint (or simulate by running retrieval + answer-engine inline if endpoint isn't yet wired)
2. Capture the response, retrieved pattern_ids, and citations
3. Auto-grade via a separate LLM call:

```
Grader call:
  model: o3 / strongest available OpenAI reasoning model  (judgment task — use the strongest OpenAI critic available)
  system: "You are grading a Lakeshore agent's answer against a known-good rubric. Score 0-10 on: factual accuracy, citation presence, doctrine alignment, vernacular fit, anti-hallucination. Return JSON."
  user:   <question + agent response + expected pattern_ids + rubric>
```

Save each grade to `eval/answers/Q-<id>.json`.

### Eval summary

After all 100 questions graded, produce `eval/SUMMARY.md` with:

- Overall score (avg across all 100, weighted)
- Per-domain score (highlight D08/D11/D14)
- Per-type score (factual / applied / tradeoff / anti-pattern)
- Citation rate (% of answers that cite specific pattern_ids)
- Hallucination rate (% of answers that contain claims not in the corpus)
- Top 10 failures (questions where score < 5/10) with diagnosis
- Top 5 strengths

### Eval pass/fail criteria

| Metric | Pass bar |
|---|---|
| Overall avg score | ≥ 7.5/10 |
| D08/D11/D14 avg | ≥ 8.0/10 (high-ground bar) |
| Citation rate | ≥ 80% |
| Hallucination rate | ≤ 5% |
| Anti-pattern recognition | ≥ 8/10 correct rejections |

If all pass: declare corpus production-ready.
If any fail: write `EVAL_REMEDIATION.md` with specific gaps and recommended next-wave additions or hand-authoring requests.

---

## Final deliverables

When the autonomous run completes (success or escalation), commit and surface:

1. **Pattern files**: `reports/lakeshore-corpus-build/wave-*/raw.jsonl` (9 files) + `final/all-patterns.jsonl` (consolidated)
2. **Critique trail**: `wave-*/critique-pass-*.jsonl` + `wave-*/critique-final.jsonl`
3. **Gap audit**: `wave-*/gaps.json` consolidated into `final/known-gaps.md`
4. **Load proofs**: `wave-*/checkpoint.json` + final consolidated load report
5. **Eval harness**: `eval/questions.jsonl` + `eval/answers/*.json` + `eval/SUMMARY.md`
6. **Final readiness report**: `LAKESHORE_CORPUS_READINESS.md` with:
   - Total patterns shipped (target 10,000)
   - Per-domain breakdown
   - High-ground waves health (D08/D11/D14)
   - Eval score
   - Known gaps (from gap audits)
   - Recommended next batch
   - Total cost + wall-clock

Push the branch `lakeshore-corpus/full-build-<date>` to origin. Open a draft PR titled:
```
feat(corpus): Lakeshore Capital — initial 10K-pattern build + eval (<eval_score>/10)
```

---

## Tactical execution notes

1. **Seed the early waves with exemplars.** Before invoking GENERATE for wave 1, hand-author 10-15 exemplars (you can use the gold-standard from the master prompt). Paste them at the top of the user message. The first wave anchors the voice for every subsequent wave; without seeds the model drifts to textbook.

2. **Streaming + checkpoint every 100 patterns.** For long generations, don't wait for `WAVE_COMPLETE` to flush. Stream and checkpoint to JSONL every 100 patterns. If the connection dies, you can resume with `RETRY=<next_id_after_last_checkpoint>`.

3. **Model selection by wave:**
   - OpenAI `gpt-4o` for waves 1-4, 8, 9 unless a newer approved OpenAI production model is configured in `OPENAI_MODEL`.
   - **OpenAI `o3` or the strongest available OpenAI reasoning model for waves 5, 6, 7** (high-ground; judgment + voice quality matters more than throughput).
   - Use the same OpenAI high-ground critic twice for waves 5, 6, 7: one same-context critique and one fresh-context critique.
   - Use the strongest available OpenAI reasoning model for the eval grader.

4. **Embedding pipeline:** every approved pattern's `embedding_text` gets embedded BEFORE pushing to Azure AI Search. Batch embeddings in groups of 100 for throughput.

5. **Idempotency:** every operation should be safe to re-run. Load scripts should use `ON CONFLICT (id) DO UPDATE` semantics on the Postgres pattern table; Azure AI Search uses `mergeOrUpload` action.

6. **Telemetry:** log model spend after every API call. Update the running total in `state.json`. The $150 gate (G3) fires if this exceeds threshold.

7. **Vault credentials:** OpenAI key, Azure Search admin/query key, Postgres connection string — all from environment variables. Do not log them.

8. **No-prompt-bleed:** the master prompt is the single source of truth. Do NOT add your own prompt augmentations between waves — that drifts the voice. If the model is drifting, it's because the seeds aren't strong enough; fix the seeds, not the prompt.

---

## Definition of done

The run is complete when ALL of the following are true:

- [ ] 9 waves generated, critiqued, and loaded (no KILL_WAVE escalations)
- [ ] ≥ 7,500 patterns in `pattern_corpus` table with `tenant_scope='lakeshore'`
- [ ] Azure AI Search `lakeshore-patterns-v1` index has matching document count
- [ ] Graph store has nodes + edges; dangling edges < 5% of total
- [ ] 100-question eval run, SUMMARY.md written
- [ ] Eval score ≥ 7.5/10 overall AND ≥ 8.0/10 on high-ground domains
- [ ] Citation rate ≥ 80%, hallucination rate ≤ 5%
- [ ] PR opened with full report attached
- [ ] Total spend ≤ $150
- [ ] Total wall-clock ≤ 18 hours

If any check fails, write the appropriate ESCALATE_*.md and stop. The user will decide next steps.

---

## What NOT to do

- Do NOT skip critique passes to save time. The corpus is one bad set of generations away from being unusable.
- Do NOT lower the eval bar to make the run "succeed." A failed eval is a real signal.
- Do NOT push to main. The branch is a draft PR for human review.
- Do NOT delete intermediate files. Every wave's raw + critique + gaps is the audit trail.
- Do NOT continue past an escalation gate. The gates exist because past that point, you'd be burning budget on a doomed run.
- Do NOT swap to a different model mid-wave. Voice continuity matters.

---

## Headline

This is a multi-million-token autonomous run with three distinct judgment loops (generate → critique → eval) and three data-store destinations. The escalation gates are how the run protects itself from compounding errors. Trust the gates; don't override them.

When the run completes, the deliverable is not "10,000 patterns loaded." The deliverable is **a Lakeshore tenant whose agent can answer a Chicago private holdings managing partner's questions with the same voice and discipline that partner would use.**

Anything less is a build, not a corpus.
