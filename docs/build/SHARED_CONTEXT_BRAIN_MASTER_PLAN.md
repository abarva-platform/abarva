# Shared Context Brain — MASTER PLAN

**Status:** Authoritative. This is the single reference for the program.
**Date:** 2026-06-20 · **Reasoning:** Claude (Opus 4.8), grounded in 3-way codebase audit
**Live status board:** [SCB_EXECUTION_TRACKER.md](./SCB_EXECUTION_TRACKER.md) (Claude + Codex both update)
**Companions:** [ADR-001 Substrate](../architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md) · [W2 Codex brief](../codex-handoff/SHARED_CONTEXT_BRAIN_W2_RETRIEVABILITY.md) · contracts in `src/lib/intelligence/{answer,expert-pack}/`

> Supersedes the summary in `SHARED_CONTEXT_BRAIN_BUILD_PLAN.md`. Where they differ, this master plan wins.

---

## 1. North star

One server-side answer engine. Every surface — Home, Intelligence, Tower, Source, Moves — sends a question through the same pipeline:

```
question → dimensional router → context bundle → expert kernel → AgentAnswer → renderer → citations/proof
```

No browser-side answer logic. No per-page shallow agents. The product answers like an expert who knows the client's private facts, the industry corpus, and the difference between _we know_, _we infer_, and _we have no proof_ — rendering prose, tables, charts, graphs, or next actions as the question demands.

**This is convergence, not greenfield.** ~70–80% of the hard parts already exist, siloed across three engines. The work is to connect them and scale corpus depth from ~1,300 patterns (only 17 retrievable) to **~210 deep, retrievable virtual industry experts.**

## 2. Branding canon

- **Ava** — the single agent voice across all five surfaces (derived from AbarVa). Surfaces are _focuses_ of Ava, not separate characters. Retires Sentinel/Atlas/Nexus as user-facing brands.
- **Consilium** — the brain: the reasoning engine + the faculty of ~210 named virtual experts (the ExpertPacks). Ava reasons over Consilium.
- **Named specialists** — model = _unified voice + named specialists_. The user talks only to Ava; each answer surfaces the contributing Consilium expert(s) by name in trace/audit (`AgentAnswer.contributingExperts[]`).

Story: _"Ava is your AI partner; behind her stands Consilium, a faculty of 200+ industry experts."_

## 3. Decisions log (locked 2026-06-20)

| #   | Decision                                          | Implication                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Grounding = confident synthesis**               | Engine answers from expertise even on thin evidence; marks how it knows (`groundingMode`) and hedges (`limits`); does NOT refuse. Only hard block = cross-tenant leak. Citation gate stays observe-only. **Do not build a blocking evidence gate.** |
| D2  | **~210 experts, AI-gate only**                    | 15 industries × ~12 functions + ~30 cross-cutting. No human SME tier even for regulated domains. Mitigation = strong adversarial gate (critic + rubric + benchmark plausibility).                                                                   |
| D3  | **W0 contracts first**                            | Lock `AgentAnswer` + `ExpertPack v2` as the dependency root, then parallelize. ✅ Done.                                                                                                                                                             |
| D4  | **Branding: Ava / Consilium / named specialists** | Single voice; brain named; contributors surfaced by name.                                                                                                                                                                                           |

## 4. Current-state reality (the convergence map)

| Capability     | Today                                                                                                     | Target                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Answer engine  | 3 separate: Intelligence (prose stream), Source (`source-answer-engine.ts`, typed), Tower (browser regex) | One engine; Source's typed output generalized to `AgentAnswer`                          |
| Context bundle | `AgentContextBroker.assemble()` typed but **orphaned** — `/api/intelligence/ask` bypasses it (0 imports)  | Live path wired through broker; +benchmarks/gaps/persona/permitted-output-types         |
| Router         | 1-D (`it_productivity\|general` + 9-way model-select enum)                                                | Dimensional `{domain, industry, function, vendor, outputShape}` → summons ExpertPack(s) |
| Output         | prose-only, prompted _against_ structure                                                                  | `AgentAnswer` (prose + tables + charts + graphs + citations + gaps + actions)           |
| Grounding gate | observe-only; refusal disabled                                                                            | Keep confident synthesis (per D1)                                                       |
| Renderers      | 21 SVG charts + 10 diagrams + DOCX/PDF/XLSX/PPTX/HTML in expert-kernel; recharts unused                   | Reuse SVG generators (HTML-injected) + new typed `<DataTable>`                          |
| Corpus         | ~1,300 authored, **17 retrievable**                                                                       | ~210 experts, all retrievable; pgvector live                                            |
| Expertise      | ~37 FunctionPacks (8 layers) in expert-kernel/domain                                                      | Promoted to ~210 addressable `ExpertPack v2`                                            |

## 5. The unit — ExpertPack v2

One ExpertPack = one virtual expert. **Composes** the existing `FunctionPack` layer types (no rebuild) and adds the five missing layers. Schema: `src/lib/intelligence/expert-pack/expert-pack.ts`.

Layers: identity · domain (operatingMetrics, painThemes, aiUseCaseArchetypes, referenceSolutionPatterns, valueModel, vocabulary, evidenceAnchors) · diagnostics · sourcing · evidenceRules · hedgeRules · outputRecipes · regulatoryFrame · provenance.

**Depth bar** (`EXPERT_PACK_DEPTH_MINIMUMS`): ≥10 metrics, ≥6 pain themes, ≥5 AI use-cases, ≥4 reference solutions, ≥4 evidence anchors, ≥6 discovery questions, ≥4 red flags, ≥4 output recipes.

## 6. Corpus scale target

- ~15 industries (existing 4 + insurance, manufacturing, pharma/life-sciences, telecom, media, energy & utilities, public sector, transport & logistics, hospitality, professional services, technology/SaaS).
- ~15 × ~12 functions = ~180 industry×function experts + ~30 cross-cutting (sourcing categories cluster ~20; + AI-governance, model-risk, cybersecurity, data-platform, cloud-FinOps, ERP, M&A) = **~210 experts.**
- Count is secondary to **depth + retrievability**.

---

## 7. Phases W0–W5 (detailed)

Task IDs match the [tracker](./SCB_EXECUTION_TRACKER.md).

### W0 · Contracts — Claude — _blocks everything_

**Objective:** lock the two seams every other workstream depends on.
| Task | Owner | Status | Exit criteria |
|---|---|---|---|
| W0.1 `AgentAnswer` contract | @claude | ✅ done | `agent-answer.ts`, tsc exit 0 |
| W0.2 `ExpertPack v2` contract | @claude | ✅ done | `expert-pack.ts` + depth minimums, tsc exit 0 |
| W0.3 Extend `critic.ts`/`qa-rubric.ts` to gate ExpertPacks | @claude | ⬜ | Validator rejects a pack below `EXPERT_PACK_DEPTH_MINIMUMS`; passes a compliant one |
**Risk:** schema churn after Codex starts consuming → mitigated by freezing + Handshake-Log change protocol.

### W1 · Engine spine — Claude (design) · Codex (wiring)

**Objective:** one engine, fed by the broker, emitting `AgentAnswer`, keeping confident synthesis.
| Task | Owner | Depends | Exit criteria |
|---|---|---|---|
| W1.1 Dimensional router | @claude | W0 | Router returns `{domain,industry,function,vendor,outputShape}` + summoned expertIds for a test question set |
| W1.2 Wire `/api/intelligence/ask` → `AgentContextBroker` | @claude | W0 | Live path imports broker; bundle carries facts/graph/chunks/corpus + new fields |
| W1.3 Engine emits `AgentAnswer` (confident synthesis, cross-tenant fence only) | @claude | W1.1–1.2 | Endpoint returns valid `AgentAnswer`; cross-tenant probe still blocks; no refusal on thin evidence |
| W1.4 Surface wiring: Home → Tower(server) → Source → Moves | @codex | W1.3 | All five surfaces call the shared engine; Tower no longer answers in-browser |
**Risk:** Source/Moves have their own engines → migrate behind the `AgentAnswer` adapter, don't break existing flows.

### W2 · Retrievability — Codex — _parallel with W1/W3_

**Objective:** make all authored content reachable; light pgvector. Full brief: [W2 Codex brief](../codex-handoff/SHARED_CONTEXT_BRAIN_W2_RETRIEVABILITY.md).
| Task | Owner | Exit criteria |
|---|---|---|
| W2.1 Close manifest gap 17 → ~1,300 | @codex | Regenerated manifest count ≈ authored count (logged before/after) |
| W2.2 pgvector migration (ADR-001 steps 1–4) | @codex | Extension enabled, `embedding_vector` + HNSW live, embed script writes vectors, broker queries pgvector first — signed-in retrieval cites a chunk via vector path |
| W2.3 ExpertPack loader + depth validator | @codex | Sample W3 pack loads + indexes; sub-bar pack rejected |
| W2.4 CI truth-gates | @codex | Fails on seeded violations (files-but-no-rows / authored-but-not-retrievable / embedded-but-null-vector) |

### W3 · Corpus authoring — Claude — _parallel with W2_

**Objective:** author ~210 deep experts, adversarially gated.
| Task | Owner | Depends | Exit criteria |
|---|---|---|---|
| W3.1 Exemplar pack (Healthcare Revenue Cycle / Epic) | @claude | W0.2 | Compiles against `ExpertPack v2`, meets depth bar, passes W0.3 gate |
| W3.2 Author ~210 packs (multi-agent, adversarial-gated) | @claude | W3.1 + W0.3 | Each pack passes critic (CFO/evidence/domain) + rubric + benchmark-plausibility; loaded + retrievable (W2.3) |
**Note:** W3.2 is a Workflow-shaped, billed orchestration run — founder greenlights scale after W3.1 proves the unit.

### W4 · Rendering — Codex (build) · Claude (recipes)

| Task                                                      | Owner   | Depends | Exit criteria                                                 |
| --------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------- |
| W4.1 SVG-string chart injection into React answer surface | @codex  | W0.1    | An `AnswerChart` renders via an existing `svg-charts` builder |
| W4.2 Typed `<DataTable>` for `AnswerTable`                | @codex  | W0.1    | Renders columns/rows/format; citations link                   |
| W4.3 Output recipes (question-pattern → exhibit)          | @claude | W3.1    | Each expert's `outputRecipes` map to a real builder           |

### W5 · Expert evals — joint

| Task                                                | Owner   | Depends   | Exit criteria                                                           |
| --------------------------------------------------- | ------- | --------- | ----------------------------------------------------------------------- |
| W5.1 Eval-runner harness + golden-question fixtures | @codex  | W1.3      | Harness runs golden questions per expert, captures `AgentAnswer`        |
| W5.2 Expert eval design + adversarial scoring       | @claude | W1.3 + W3 | Epic / supply-chain / sourcing / AI-gov golden sets pass the proof gate |

## 8. Sequencing

```
W0 ──┬──> W1 (engine: W1.1→1.2→1.3 Claude, then W1.4 Codex)
     ├──> W3 (W3.1 exemplar → W3.2 scale)        ┐ run in parallel
     └──> W2 (W2.1–W2.4 Codex)                    ┘ after W0
W0.1 ──> W4 (W4.1/W4.2 Codex) ; W1.3+W3 ──> W4.3, W5
```

Critical path: **W0 → W1 → W5.** W2 and W3 ride alongside.

## 9. Claude / Codex split

| Lane       | Owns                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude** | W0 contracts · W1 engine design (router, broker wiring, confident-synthesis gate) · W3 expert authoring · W4.3 recipes · W5.2 eval design · quality-gate logic |
| **Codex**  | W2 retrievability + pgvector · W1.4 surface wiring · W4.1/W4.2 renderers · schema validators + CI gates · W5.1 eval harness                                    |
| **Joint**  | Contract review · proof-gate sign-off · parity gates                                                                                                           |

Division: **Codex builds the factory and conveyor (ingest, validate, index, render, test); Claude produces the goods (expert packs, reasoning engine) and runs the QC line (critic + rubric + evals).**

## 10. Cross-agent execution protocol

Both agents use [SCB_EXECUTION_TRACKER.md](./SCB_EXECUTION_TRACKER.md):

1. `git pull` before any task.
2. Set your task row to `in-progress` (handle + date), commit, push, before working it.
3. On `done`: add a proof link in Notes.
4. Blocked / question for the other agent → Handshake Log entry.
5. Small commits, clear messages (`scb(W2.1): manifest 17→1303`).
6. **Contracts frozen** — changes need a Handshake Log entry + the other agent's ack.

---

## 11. Consolidated Codex instructions

> This is the full standing brief for Codex. The per-workstream detail lives in `docs/codex-handoff/`; this section is the entry point.

**Mission.** You are the second of two agents (with Claude) building AbarVa's Shared Context Brain — one server-side answer engine ("Ava") reasoning over a faculty of ~210 virtual experts ("Consilium"). You own the deterministic plumbing; Claude owns the reasoning engine and expert authoring.

**Read in order:** (1) this master plan, (2) [ADR-001](../architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md), (3) [W2 brief](../codex-handoff/SHARED_CONTEXT_BRAIN_W2_RETRIEVABILITY.md), (4) [tracker](./SCB_EXECUTION_TRACKER.md).

**Your lanes:** W2 (retrievability + pgvector), W1.4 (surface wiring), W4.1/W4.2 (renderers), schema validators + CI gates, W5.1 (eval harness).

**Frozen contracts — consume, never modify without a Handshake Log entry + Claude's ack:**

- `src/lib/intelligence/answer/agent-answer.ts` (`AgentAnswer`, incl. `contributingExperts: ExpertRef[]`)
- `src/lib/intelligence/expert-pack/expert-pack.ts` (`ExpertPack`, `EXPERT_PACK_DEPTH_MINIMUMS`)

**Tracking protocol:** see §10. Pull → set row in-progress → commit/push → do work → set done + proof. Blockers go in the Handshake Log addressed to `@claude`.

**Start now with W2.1–W2.4** — they depend only on the frozen contracts and run fully parallel to Claude's W1/W3.

**Standing rules:**

- Honor the repo truth standard — report _authored ≠ indexed ≠ retrieved ≠ proven_ as separate states; never collapse to "loaded."
- Run DB/index work inside the private VNet (localhost can't reach private Postgres; use the ACA VNet job recipe).
- UI work uses **"Ava"** as the agent label and surfaces `contributingExperts` by name in trace/audit.
- Release discipline: classify the lane, add/update a release record under `docs/releases/records/`, run `npm run release:check` before any PR.

## 12. Quality + proof gates

A capability is not "real" until: private facts available · corpus patterns/packs retrieved · citations present + usable · chart/table data validated (no invented figures) · no cross-tenant leakage · hedge behaves per D1 · signed-in answer proof captured · golden expert questions pass. Report each state separately.
