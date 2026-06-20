# Shared Context Brain — Execution Tracker

**Single source of truth for cross-agent progress.** Claude and Codex BOTH read and update this file. It lives in git, so each side sees the other's progress on every pull.

## Protocol (both agents follow this)

1. `git pull` (or rebase) before starting any task — get the other agent's latest status.
2. Before working a task, set its **Status** to `in-progress` with your handle + timestamp, commit, push.
3. On completion, set **Status** to `done` and put a **proof link** (PR, file path, run id, or signed-in proof) in Notes.
4. If blocked, set **Status** to `blocked` and write a line in the **Handshake Log** addressed to the other agent.
5. Keep commits small and message them clearly (`scb(W2.1): manifest regenerated 17→1303`). Never edit the other agent's rows except to read.
6. **Contracts are frozen** (`agent-answer.ts`, `expert-pack.ts`). Changing them requires a Handshake Log entry + the other agent's ack.

**Status values:** `not-started` · `in-progress` · `blocked` · `done`
**Handles:** `@claude` · `@codex`

## Lane ownership

- **@claude** — W0 contracts, W1 engine design, W3 expert-pack authoring, W5 eval design + adversarial review, quality-gate logic
- **@codex** — W2 retrievability + pgvector, W1 surface wiring, W4 renderers, schema validators + CI gates, W5 eval-runner harness

---

## Status board

| WS   | Task                                                                                         | Owner   | Status      | Updated    | Proof / Notes                                                                                                                                                                          |
| ---- | -------------------------------------------------------------------------------------------- | ------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W0.1 | `AgentAnswer` contract                                                                       | @claude | done        | 2026-06-20 | `src/lib/intelligence/answer/agent-answer.ts` — tsc exit 0                                                                                                                             |
| W0.2 | `ExpertPack v2` contract                                                                     | @claude | done        | 2026-06-20 | `src/lib/intelligence/expert-pack/expert-pack.ts` — tsc exit 0                                                                                                                         |
| W0.3 | Extend `critic.ts`/`qa-rubric.ts` to gate ExpertPacks                                        | @claude | not-started | —          | reads `EXPERT_PACK_DEPTH_MINIMUMS`                                                                                                                                                     |
| W1.1 | Dimensional router `{domain,industry,function,vendor,outputShape}`                           | @claude | not-started | —          | replaces 1-D `it_productivity\|general` gate                                                                                                                                           |
| W1.2 | Wire `/api/intelligence/ask` through `AgentContextBroker`                                    | @claude | not-started | —          | broker currently orphaned (0 imports)                                                                                                                                                  |
| W1.3 | Engine emits `AgentAnswer`; keep confident-synthesis (NO blocking gate)                      | @claude | not-started | —          | cross-tenant fence stays                                                                                                                                                               |
| W1.4 | Surface wiring: Home → Tower(server) → Source → Moves onto shared engine                     | @codex  | not-started | —          | needs W1.1–W1.3                                                                                                                                                                        |
| W2.1 | Close manifest gap 17 → all authored (~1,300)                                                | @codex  | in-progress | 2026-06-20 | @codex starting manifest audit/regeneration; before/after counts to be logged on completion                                                                                            |
| W2.2 | pgvector migration (ADR-001 steps 1–4)                                                       | @codex  | not-started | —          | run in private VNet                                                                                                                                                                    |
| W2.3 | ExpertPack loader + depth-bar validator                                                      | @codex  | not-started | —          | consumes W0.2                                                                                                                                                                          |
| W2.4 | CI truth-gates (files-but-no-rows / authored-but-not-retrievable / embedded-but-null-vector) | @codex  | not-started | —          |                                                                                                                                                                                        |
| W3.1 | Author exemplar ExpertPack (Healthcare Revenue Cycle / Epic)                                 | @claude | done        | 2026-06-20 | `src/lib/intelligence/expert-pack/packs/healthcare-revenue-cycle.ts` — tsc exit 0; depth bar PASS (11/6/5/4/4/7/4/5, all archetypes have valueMechanism). Schema validated end-to-end. |
| W3.2 | Author ~210 expert packs (multi-agent, adversarial-gated)                                    | @claude | not-started | —          | needs W3.1 proof + W0.3 gate                                                                                                                                                           |
| W4.1 | SVG-string chart injection into React answer surface                                         | @codex  | not-started | —          | reuse `svg-charts.ts` builders                                                                                                                                                         |
| W4.2 | Typed `<DataTable>` for `AnswerTable`                                                        | @codex  | not-started | —          | recharts unused; decide SVG vs recharts                                                                                                                                                |
| W4.3 | Output recipes (question-pattern → exhibit)                                                  | @claude | not-started | —          | per-expert `outputRecipes`                                                                                                                                                             |
| W5.1 | Eval-runner harness + golden-question fixtures                                               | @codex  | not-started | —          |                                                                                                                                                                                        |
| W5.2 | Expert eval design + adversarial scoring                                                     | @claude | not-started | —          | Epic, supply-chain, sourcing, AI-gov first                                                                                                                                             |

---

## Handshake Log

_Blockers, handoffs, and questions between @claude and @codex. Newest on top._

- `2026-06-20 @claude → @codex`: START HERE → `docs/codex-handoff/CODEX_KICKOFF.md` (paste-prompt + full work packet with per-task acceptance criteria). Reference pack to validate against: `src/lib/intelligence/expert-pack/packs/healthcare-revenue-cycle.ts` (tsc-clean, depth-bar PASS).
- `2026-06-20 @claude → @codex`: BRANDING CANON locked. Agent voice = **Ava** (all surfaces); brain = **Consilium** (the ~210-expert faculty); model = unified voice + named specialists. Contract updated: `AgentAnswer` now carries `contributingExperts: ExpertRef[]` (the named Consilium experts shown in trace) alongside `expertId`. Still tsc-clean. When you wire surfaces (W1.4) and renderers (W4), use "Ava" as the agent label and surface `contributingExperts` in trace/audit. See plan "Branding canon".
- `2026-06-20 @claude → @codex`: W0 contracts are locked + tsc-clean. W2 brief is ready at `docs/codex-handoff/SHARED_CONTEXT_BRAIN_W2_RETRIEVABILITY.md`. You're cleared to start W2.1–W2.4 in parallel; they depend only on the frozen contracts. Flag here if any contract field blocks you.
