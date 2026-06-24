# Semantic2 / Home KNOW — Reconciliation (converge, don't fork)

## Verdict
**`origin/main` is canonical.** It already ships a more complete Home KNOW engine than this session's spike. Stand the spike's *duplicate code* down; keep its *docs + methodology*; pursue exactly **one** surgical improvement if (and only if) a quality check says it's needed.

## What main already has (discovered 2026-06-24)
- `src/lib/home/know/home-know-engine.ts` (2,056 lines) — reads **live Azure materialized views**: `mv_home_it_org_view`, `mv_home_application_ownership_view`, `mv_home_vendor_landscape_view`, `mv_home_budget_by_portfolio_view`, `mv_home_gap_register_view`, `mv_home_conflict_register_view` (+ `enterprise_context_records/relationships`). These **are** the `home_*_view` semantic read models the DB review specified — built and materialized. The substrate-proof is moot: the substrate exists.
- `src/lib/home/know/home-know-contract.ts` — `HomeKnowResponse` (mode, intent, answerStatus, prose, dimensionsUsed, facts, tables, charts, graphs, gaps, conflicts, citations, handoff, safety).
- `src/components/home/HomeSurface.tsx` — renders `HomeKnowAsk` with a chat pane + **conversation history**.
- `src/components/home/know/HomeKnowAsk.tsx` + `HomeKnowAnswerRenderer.tsx` + `__tests__/` — the UI, tested.
- `src/app/api/home/know/ask/route.ts` — `resolveTenant` → `buildHomeKnowResponse` → `validateHomeKnowResponse`.
- Prose is **deterministic/template** (`homeKnowProse`), gap-aware, sanitized (`templatePrefix`/`BLOCKED_PUBLIC_TEXT`/`INTERNAL_CODE_RE`/`DECISION_RE` handoff). **No LLM synthesis.**

## This session's spike vs main
| | main (canonical) | this session's spike |
|---|---|---|
| Retrieval | **live Azure `mv_home_*` views** | local v4 dataset files |
| Prose | deterministic template | **opus-4-8 executive synthesis (proven board-grade)** |
| Contract | `HomeKnowResponse` (home-know-contract) | `Semantic2AnswerPacket` (semantic2/contract) — **parallel/duplicate** |
| UI | `home/know/*` (with history) | `home/know/*` (my parallel copies — **same paths, collide**) |
| Route | `/api/home/know/ask` (live engine) | `/api/home/know/ask` (audited generator) — **duplicate path** |
| Integration | wired into HomeSurface, tested | not wired |

**Conclusion:** the spike reinvented main's feature. Main is more complete on every axis except *prose quality* (template vs LLM).

## Disposition — this session's artifacts
| Artifact | Disposition |
|---|---|
| `src/lib/semantic2/golden/*`, `src/lib/semantic2/contract.ts`, `compose-golden`, `semantic-query`, `generate` | **Discard** — duplicate of main's `home-know-engine`/contract. |
| `src/components/home/know/HomeKnowAsk.tsx` + `HomeKnowAnswerRenderer.tsx` (this session) | **Discard** — collide with main's superior versions. |
| `src/app/api/home/know/ask/route.ts` (this session) | **Discard** — main's route is canonical. |
| `semantic2_home_know` flag (registry.ts edit) | **Discard** — don't introduce a parallel flag. |
| `scripts/context-packs/verify-semantic2-golden-substrate.cjs`, `Dockerfile.substrate-proof` | **Keep as optional** — still a useful read-only check that the `mv_home_*` views carry the golden-question fields; harmless. |
| `tests/semantic2-answer/golden-five.test.ts` | **Repurpose** — the methodology (golden-question + row-count-lead-fails gate) is valuable; point it at main's engine output, not the spike. |
| `docs/build/BRAIN_CONTRACT*.md`, `docs/semantic2-answer-synthesis/*` (audit, DB review, results, before/after, this note) | **Keep** — durable design record. |

## The one improvement worth a PR (conditional)
Main's prose is template-based. If it reads mechanical, add an **optional LLM phrase-only step** to main's engine:
- Input: main's already-retrieved live packet (its `mv_home_*` facts/gaps/metrics — no new retrieval).
- Step: opus-4-8, phrase-only, the librarian/advisor prompt pattern proven this session (system constraints: no row-count lead, no raw IDs, gap-specific, phrase-only). Returns only the prose fields.
- Output: replace/augment `homeKnowProse`'s lead; keep main's tables/charts/gaps/citations/safety/contract/wiring untouched.
- Gate it behind a flag; fall back to the template on LLM failure.
This reuses **all** of main's substrate + integration + tests and adds only the synthesis quality the spike proved. It is a small surgical PR, **not** a parallel build.

## Deciding quality check (operator/CI — needs the live engine)
Run main's engine on the 5 golden questions for SkyHarbor and compare its template prose to the spike's synthesis ([GOLDEN_5_RESULTS.md](GOLDEN_5_RESULTS.md)):
1. In a DB-connected env (ACA or VNet), POST each golden question to `/api/home/know/ask` for SkyHarbor.
2. Read the `prose` per answer.
3. If it leads with business meaning, is gap-specific, and reads executive → **no graft needed; done.** If it reads mechanical/row-county → **do the LLM-synthesis PR above.**

## Branch hygiene
- This session's spike code lives on `codex/azure-deployment-lane-guard` (a feature branch about the Azure deploy lane, with unrelated dirty changes). **Do not merge the spike code.**
- The divergent Home variants — `EnterpriseLandscapeHome` (this branch), the `/api/home/v2-frame` iframe (the `scb` clone) — are **feature-branch artifacts; don't merge them.** Main already converged on `HomeSurface` + `home-know`.
- "Delete all old Home" = **don't merge the feature-branch Homes**, not delete main's Home (which is the converged, live one with real sub-routes `/home/decision|learn|queue`).
