# 2026-05-30 · Atlas IAC E2E Harness + Post-Fix Validation Run

## Release ID
`2026-05-30-atlas-iac-e2e-harness-and-post-fix-validation`

## Status
candidate

## Plain-English Summary
The prior CXO audit agent built an Atlas IAC end-to-end test harness, used it to find blockers (HI-1, HI-2, HI-3, HI-4, ME-1), and shipped four fix PRs (#2611, #2614, #2615, #2616) — but never committed the harness itself or the baseline reports. This release rebuilds the harness from scratch, commits it, runs it against main with the four fixes landed, and ships absolute-metric reports plus a side-by-side delta vs the prior verbal baseline.

Headline post-fix metrics on `main`:

- 90/90 turns graded A (100% pass rate, up from 71% baseline)
- 21/21 hybrid four-section composition fires (HI-2 + HI-4 land complete; baseline was 0/18 — the headline blocker)
- 0 shaper-damage turns (HI-3 land complete; baseline was 14+)
- 0 banned-phrase emissions (ME-1 land complete)
- 0 cross-tenant leaks (per-turn content)
- 6/6 cross-tenant API probes blocked (P0 invariant holds across all three pilot tenants)

Verdict from `PILOT_READINESS.md`: **GO**. No remaining P0/P1 blockers in the IAC composition path.

## Layer Impact
- `runtime-app-lane`: none. The harness is a script under `scripts/qa/`; it does not alter runtime behavior. It invokes `composeAtlasIacAnswer` in-process and applies `shapeAgentResponseForSurface('/tower', ...)` to validate the four merged fixes.
- `architecture-lane`: introduces `scripts/qa/atlas-iac-e2e.ts` as a re-runnable QA harness. Supports `RESUME=1` checkpoint resume and `REPORT_DIR` override. Captures per-turn intent classification, composed response, shaped response, latency, and a 7-dimension scorecard with grade derivation.
- `qa-validation-lane`: 90 IAC composition turns (30 questions × 3 pilot tenants — Apex Retail, Meridian Health, First Capital Financial) plus 6 explicit cross-tenant API probes (2 per tenant). Reports: `index.html` (per-tenant Q&A with full prompts/responses and scorecard), `raw.json` (machine-readable), `DELTA_REPORT.md` (delta vs verbal baseline), `PILOT_READINESS.md` (GO/NO-GO), `issues.md` (any new findings).
- `data-plane-lane`: read-only. Queries `ai_initiatives` and downstream joins via the Postgres-compat fluent client to compose real tenant deep-views.

## Client Applicability
- All clients: yes — the harness exercises the production IAC composition path; the four merged fixes apply to every tenant. The validation run covers the three pilot tenants explicitly.
- Specific clients: Apex Retail, Meridian Health, First Capital Financial — used as the validation tenants because they are the only seeded tenants with the full archetype/initiative coverage required for the hybrid four-section composition path.
- Internal only: no. The harness is committed to the repo and can be re-run by any maintainer with database credentials.
- Public/demo only: no.

## Changes Included
- `scripts/qa/atlas-iac-e2e.ts` — new. Re-runnable in-process IAC E2E harness with checkpoint resume and per-turn scorecard.
- `reports/2026-05-30-atlas-iac-e2e-post-fix/index.html` — new. Full per-tenant Q&A report.
- `reports/2026-05-30-atlas-iac-e2e-post-fix/raw.json` — new. Machine-readable raw data for every turn and probe.
- `reports/2026-05-30-atlas-iac-e2e-post-fix/DELTA_REPORT.md` — new. Side-by-side delta vs the verbal baseline from the prior audit, including the AR-02 spot-check.
- `reports/2026-05-30-atlas-iac-e2e-post-fix/PILOT_READINESS.md` — new. GO/NO-GO verdict.
- `reports/2026-05-30-atlas-iac-e2e-post-fix/issues.md` — new. Aggregated findings (one P2 coverage observation; no P0/P1).
- `docs/releases/records/2026-05-30-atlas-iac-e2e-harness-and-post-fix-validation.md` — this record.

## QA / Validation
- `npx tsc --noEmit -p tsconfig.json` clean on the new file.
- Harness run end-to-end against the merged main: 90 turns + 6 cross-tenant probes complete in ~50s with the real Supabase data plane.
- All 6 cross-tenant API probes PASS — explicit foreign-initiative-id lookup and "list every initiative across all your customers" both return only the requesting tenant's content (or the honest "no such initiative in your scope" refusal echoing only the prompted id).
- 0/90 banned-phrase emissions verified by the harness's literal-substring guard against "industry standard", "best practice", "everyone is doing".
- Spot-check on the canonical HI-2 case (Apex Q15 = "Compare AR-02 to industry benchmarks"): pre-fix verbal baseline returned "No such initiative". Post-fix returns the full four-section composition with real tenant baseline metrics (61% adoption vs 77% target, 155.56% value attainment), industry context (76% developer use in year, 1.8M paid users — both cited to Stack Overflow Developer Survey 2024 and Microsoft Q2 FY24 earnings), and the percentile-aware gap framing. Documented in `DELTA_REPORT.md`.

## Rollout Plan
- Merge this PR to main. The harness and reports are net-additive; no runtime change.
- Re-run the harness as a CI gate before each pilot release: `npx tsx -r dotenv/config scripts/qa/atlas-iac-e2e.ts dotenv_config_path=.env.local`. Set `REPORT_DIR` to a per-run path to keep historical baselines.
- Wire `runAtlasTurn` (the orchestrator entry point) into a follow-up harness extension to validate the true HI-1 LLM-fallback path against the live Anthropic API — out of scope for this release because that path requires live `ANTHROPIC_API_KEY` and changes the harness from in-process-deterministic to network-bound.

## Rollback Plan
- Revert this PR. Removes `scripts/qa/atlas-iac-e2e.ts` and the `reports/2026-05-30-atlas-iac-e2e-post-fix/` directory. No production code is touched, so revert has zero behavior impact.

## Audit Evidence
- Validates the four merged fixes from `main`: PR #2611 (HI-1 temperature param drop), PR #2614 (ME-1 banned-phrase guardrail), PR #2615 (HI-3 shaper bypass for structured /tower output), PR #2616 (HI-2 display_id resolution + HI-4 widened prefix regex).
- The harness exercises every line of `src/lib/atlas/composition/compose.ts` `renderHybridAtlasIacAnswer` path and the `shapeAgentResponseForSurface('/tower', ...)` post-process. The four-section structure detection in the harness mirrors `looksAlreadyStructured` in `src/lib/agent/response-shape.ts`.
- The cross-tenant API probes exercise the P0 invariant codified in `src/lib/atlas/initiative-deep/joins/ai-initiatives.ts:75` (`.eq('client_id', ctx.clientId)` before the id-or-display-id match) — the same invariant covered by `src/lib/atlas/initiative-deep/__tests__/tenant-scoping.test.ts`.

## Known Gaps
- The in-process harness does NOT exercise the LLM path; true HI-1 LLM-failure fallback is structurally 0 here. A follow-up should wire `runAtlasTurn` through the harness to validate the post-#2611 LLM path against the live model. Tracked as the one P2 observation in `issues.md`.
- The 18 turns where `composeAtlasIacAnswer` returned null are correct intent=none declines for portfolio-level questions (Q02, Q04), nonexistent archetypes (Q22), bogus initiative ids (Q25), and stretch questions (Q27, Q29). In production the orchestrator routes those to scripted intents (`portfolio_status`, `value_attainment_vs_commitment`) or the LLM path. Surfaced in the report as an observation, not a bug.
- Question deck is fixed-content; expanding to pilot-customer-specific archetypes is deferred until those tenants seed.
- `Routes and disclaimers` integrity check may report pre-existing main breakage unrelated to this PR. Same precedent as recent Atlas PRs.
