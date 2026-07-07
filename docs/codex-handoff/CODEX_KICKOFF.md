# Codex Kickoff — Shared Context Brain

**This is the single artifact to hand Codex.** Part 1 is the copy-paste prompt. Part 2 is the work packet (tasks + acceptance criteria). Everything else is linked.

---

## PART 1 — Paste this to Codex

```
You are Codex, the second of two build agents (with Claude) building AbarVa's
"Shared Context Brain": one server-side answer engine ("Ava") reasoning over a
faculty of ~210 virtual industry experts ("Consilium"). You own the
deterministic plumbing; Claude owns the reasoning engine and expert authoring.

READ IN THIS ORDER (repo: this project root):
1. docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md   (authoritative plan; your
   standing brief is section 11)
2. docs/architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md  (substrate)
3. docs/codex-handoff/SHARED_CONTEXT_BRAIN_W2_RETRIEVABILITY.md  (your first
   detailed brief)
4. docs/build/SCB_EXECUTION_TRACKER.md   (shared status board — YOU UPDATE THIS)

YOUR LANES: W2 (retrievability + pgvector), W1.4 (surface wiring), W4.1/W4.2
(renderers), schema validators + CI gates, W5.1 (eval harness). Claude owns W0
contracts, W1 engine design, W3 expert authoring, W4.3 recipes, W5.2 evals.

FROZEN CONTRACTS — consume, do NOT modify (a change needs a Handshake Log entry
in the tracker + Claude's ack):
- src/lib/intelligence/answer/agent-answer.ts      (AgentAnswer, incl.
  contributingExperts: ExpertRef[])
- src/lib/intelligence/expert-pack/expert-pack.ts  (ExpertPack v2,
  EXPERT_PACK_DEPTH_MINIMUMS)
There is a reference pack already authored + verified you can load/validate
against: src/lib/intelligence/expert-pack/packs/healthcare-revenue-cycle.ts

CROSS-AGENT TRACKING (both agents do this every task):
1. git pull before starting.
2. Set your task row in docs/build/SCB_EXECUTION_TRACKER.md to in-progress
   (handle @codex + date), commit, push, BEFORE you work it.
3. On done: set done + a proof link (PR / run id / signed-in proof) in Notes.
4. Blocked or a question for Claude? Add a line to the Handshake Log (newest on
   top), addressed to @claude.
5. Small commits, clear messages: scb(W2.1): manifest 17 -> 1303.
6. Never edit Claude's rows except to read them.

START NOW with W2.1–W2.4 — they depend only on the frozen contracts and run
fully in parallel with Claude's W1/W3.

STANDING RULES:
- Truth standard: report authored != indexed != retrieved != proven as separate
  states. Never collapse to "loaded."
- Run DB/index work INSIDE the private VNet (localhost cannot reach private
  Postgres; use the ACA VNet job recipe).
- UI work uses "Ava" as the agent label and surfaces contributingExperts by name
  in trace/audit.
- Release discipline: classify the lane, add/update a record under
  docs/releases/records/, run `npm run release:check` before any PR.
```

---

## PART 2 — Work packet (tasks + acceptance criteria)

### Lane: W2 · Retrievability + pgvector _(start here, fully parallel)_

| Task                                   | What to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Acceptance criteria (proof)                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **W2.1** Close manifest gap            | The generator that produced `pattern-manifest.json` emits only 17 patterns. Make it enumerate ALL authored patterns from the seed files / `genome_patterns`. Regenerate `pattern-manifest.json`, `runtime-pattern-index.ts`, `pattern-manifest.ts`.                                                                                                                                                                                                                           | Regenerated `patternCount` ≈ authored `id:` count (expect ~1,300, not 17). Log before/after in the commit + tracker Notes.                                              |
| **W2.2** pgvector migration            | New migration: `CREATE EXTENSION IF NOT EXISTS vector`; add `embedding_vector vector(1536)` to `enterprise_context_chunks` (keep JSONB for rollback); HNSW index `WHERE embedding_vector IS NOT NULL`. Update `src/scripts/embed-pending-chunks.ts` `--postgres-only` path to write the vector column (status values: `pending\|skipped\|embedded\|failed`). Update broker semantic retrieval to query pgvector first (`ORDER BY embedding_vector <=> $q`), keyword fallback. | Extension enabled + column + index live (run in private VNet). A signed-in retrieval cites a chunk via the vector path. Pinecone `DisabledVectorClient` stays disabled. |
| **W2.3** ExpertPack loader + validator | Build the loader that ingests `ExpertPack` objects into a retrievable store (new `expert_packs` table or extend `genome_patterns`) and indexes by `{industry, function, crossCuttingDomain}`. Build a deterministic validator asserting each pack against `EXPERT_PACK_DEPTH_MINIMUMS`.                                                                                                                                                                                       | The reference pack (`healthcare-revenue-cycle.ts`) loads + indexes + passes the validator. A deliberately sub-bar pack is rejected.                                     |
| **W2.4** CI truth-gates                | Add release gates that FAIL when: a tenant has `datasets/` files but zero `enterprise_context_records`; a chunk is `embedding_status='embedded'` but `embedding_vector IS NULL`; a pattern/pack is authored but absent from the retrievable manifest/index.                                                                                                                                                                                                                   | Each gate fails on a seeded violation and passes when clean.                                                                                                            |

### Lane: W1.4 · Surface wiring _(after Claude ships W1.3 engine)_

Wire Home → Tower(server-side) → Source → Moves to call the shared engine and consume `AgentAnswer`. **Blocked until** tracker rows W1.1–W1.3 are done — watch the tracker. Acceptance: all five surfaces hit the shared engine; Tower no longer answers in-browser.

### Lane: W4.1 / W4.2 · Renderers _(needs W0.1 — available now)_

- **W4.1**: render `AnswerChart` by injecting the existing board-grade SVG strings from `expert-kernel/exports/board-grade/svg-charts.ts` (e.g. `valueBridge`, `costStack`). Acceptance: an `AnswerChart` renders end-to-end via a named builder.
- **W4.2**: build a typed `<DataTable>` for `AnswerTable` (columns/rows/format, citation links). Decide SVG-string-injection vs recharts (recharts is installed but unused — pick and note the call). Acceptance: an `AnswerTable` renders with formatting + citations.

### Lane: W5.1 · Eval harness _(after W1.3)_

Build the eval-runner that executes golden-question fixtures per expert and captures the returned `AgentAnswer`. Claude supplies the golden sets + scoring (W5.2). Acceptance: harness runs a golden set and records structured results.

### Definition of done (every task)

Compiles/typechecks · runs in the right environment (VNet for DB) · proof captured and linked in the tracker · truth states reported separately · release record + `release:check` green before PR.
