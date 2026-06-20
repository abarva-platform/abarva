# Codex Lane Closeout — current state + remaining tasks

**Date:** 2026-06-20 · refreshes [CODEX_KICKOFF.md](./CODEX_KICKOFF.md). Goal: close out the Codex lane so both lanes finish together. Founder priority: **complete all SCB backlogs first; the Surekha/Lakeshore demo comes after.**

## What is already on `main` (your foundations — consume, don't rebuild)

- **Contracts (frozen):** `src/lib/intelligence/answer/agent-answer.ts` (`AgentAnswer` + `contributingExperts`), `src/lib/intelligence/expert-pack/expert-pack.ts` (`ExpertPack` v2, `EXPERT_PACK_DEPTH_MINIMUMS`, `successModel`).
- **Quality gate:** `src/lib/intelligence/expert-pack/quality-gate.ts` — `gateExpertPack(pack)` (defensive; pass = 0 blockers). **Your W2.3 validator should call this**, not re-implement it.
- **Faculty:** **35 ExpertPacks** in `src/lib/intelligence/expert-pack/packs/`, all registered in `registry.ts` (`EXPERT_PACKS`), all gate-PASS. Use as loader/validator fixtures.
- **Engine + routing:** `answer/engine.ts` (`answerWithSharedBrain`, DI deps), `answer/router.ts` (`routeQuestion`), `answer/expert-grounding.ts` (`summonExpertsForQuery`).
- **Flag:** `scb_shared_engine_intelligence` (default OFF, tenant opt-in) already in `features/registry.ts` — this is the FIRST of your W6.1 exposure flags. Add the rest per-surface in the same shape.

## Your remaining tasks (refreshed acceptance criteria)

| Task | Status | What's left / note |
|---|---|---|
| **W2.2** pgvector | in-progress (#3731) | Finish: extension + `embedding_vector` column + HNSW live in the private VNet; a signed-in retrieval cites a chunk via the vector path. Mark done only with that live proof. |
| **W2.3** ExpertPack loader + validator | not-started | Ingest `EXPERT_PACKS` (35 today) into a retrievable store (`expert_packs` table or extend `genome_patterns`), index by `{industry, functionKey, crossCuttingDomain}`. Validator MUST call `gateExpertPack`. **Note:** the live Intelligence wiring v1 uses the in-code registry, so this is for scale/retrieval, not blocking v1. Acceptance: all 35 load + pass; a sub-bar pack is rejected. |
| **W2.4** CI truth-gates | not-started | Fail on: files-but-no-rows · embedded-but-null-vector · authored-but-not-retrievable. |
| **W4.1** chart renderer | not-started — **start now** | Render `AnswerChart` by injecting the board-grade SVG strings from `expert-kernel/exports/board-grade/svg-charts.ts`. Needed so the experts' `outputRecipes` (cost-stack / value-bridge / etc.) actually draw. |
| **W4.2** typed `<DataTable>` | not-started — **start now** | For `AnswerTable` (columns/rows/format + citation links). recharts is installed-but-unused; pick SVG-injection vs recharts and note it. |
| **W1.4** surface wiring | not-started | Wire Home / Tower(server-side) / Source / Moves to the shared engine. **Claude is wiring the Intelligence ask route itself** (route-injection of `summonExpertsForQuery` behind `scb_shared_engine_intelligence`) — coordinate so you don't double-wire Intelligence. |
| **W5.1** eval harness | not-started | Runner that executes golden-question fixtures per expert and captures the `AgentAnswer`. Claude supplies the golden sets + scoring (W5.2). |
| **W5.3** crawl-metric fix | not-started | The Intelligence "citation-depth" P1 is a FALSE signal — fix the extractor `scripts/crawl/post-deploy-harness.ts:375` (count ≥2 concrete facts $/dates/named-sources, or off the `sources` NDJSON event), NOT the engine. Gate at `src/lib/crawl/baseline-compare.ts:297-315`. |
| **W6.1** exposure flags + readiness/parity | partial | `scb_shared_engine_intelligence` exists. Add the other per-surface flags + per-pack readiness (exposable only if `gateExpertPack` PASS + eval pass) + the parity-gate hook in the eval harness. |

## Coordination
- Both agents update `docs/build/SCB_EXECUTION_TRACKER.md` (pull → in-progress → commit → done + proof; Handshake Log for blockers). Merge to `main` keeps the shared base (avoid long-lived branches off old commits — that caused merge pain; branch off latest `origin/main`, keep linear, `--admin --squash`).
- The deploy + per-tenant flag flip + signed-in Lakeshore proof is the JOINT final step (the deferred demo) — not a blocker for landing flag-gated, dormant code.
