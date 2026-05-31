# 2026-05-31 · Atlas runAtlasLlm composition wiring — live four-section answer

## Release ID
`2026-05-31-atlas-runllm-composition-wiring`

## Status
candidate

## Plain-English Summary
Wires `runAtlasLlm` (the live deployed `/api/v1/atlas/ask` route helper)
through the Wave 3 IAC composition layer (`composeAtlasIacAnswer`) so the
four-section CIO answer — `Your data / Industry context / The gap / Next
move` — actually fires for real users on `https://app.abarva.ai`.

The gap closed here is the one documented as a P2 observation in release
`2026-05-30-atlas-live-prod-smoke`. The in-process IAC E2E harness (PR
#2622) showed 21/21 hybrid composition success because it invoked
`composeAtlasIacAnswer` directly. The 2026-05-30 live-prod smoke (PR
#2629) against `app.abarva.ai/api/v1/atlas/ask` showed **0/2 hybrid LLM
turns rendering the four-section structure** — because `runAtlasLlm`
embedded the composer's output in `RETRIEVED CONTEXT` and asked Claude to
write an answer from scratch. Claude paraphrased and dropped the
structure. Wave 3 wired the wrong code path.

Fix (Option A — merge the two paths): in `src/lib/atlas/llm.ts`, after
`assembleRetrievalContext` returns (which already invokes
`composeAtlasIacAnswer` and stashes the result in
`retrievalContext.atlasIacComposition`), check the composition intent.
When the composer returned a non-null result for `hybrid` or
`initiative-specific` intent, short-circuit: return the composed
four-section text directly with `atlasMode='live'`,
`modelName='atlas-composition-deterministic'`, and skip the Anthropic
call. The `archetype-specific` path (no tenant initiative anchor) keeps
going through the LLM because the model adds value weaving corpus
context.

Why Option A vs Option B (LLM overlay with strong system-prompt
scaffold): the composition is already computed inside
`assembleRetrievalContext` (no extra DB / IAC fetch), the composer output
is deterministic and auditable, and asking the LLM to mimic an exact
four-section template proved fragile (live-prod smoke = 0/2). Option A
also cuts hybrid-turn latency from ~17-26s (Claude round-trip) to ~1s
(DB-only composer).

## Layer Impact
- `runtime-app-lane`: `src/lib/atlas/llm.ts` — adds a composition
  short-circuit inside `runAtlasLlm` for hybrid + initiative-specific
  IAC intents. No public type changes; return shape unchanged.
- `qa-validation-lane`: `scripts/qa/atlas-live-prod-smoke.ts` — extends
  the scorecard to exit `2` when any hybrid turn returns
  `fourSectionStructure === false`. Future regressions surface in CI /
  nightly QA instead of by manual eyeball.
- `architecture-lane`: no schema change. Tenant scoping via
  `AtlasTenancyCtx` preserved end-to-end (cross-tenant probes 6/6 PASS
  on the post-wire in-process harness re-run).
- `data-plane-lane`: no migration. Composer reads existing
  `ai_initiatives` rows the same way it already did from
  `assembleRetrievalContext`.

## Client Applicability
- All clients: yes. The wiring change is tenant-agnostic — it routes by
  IAC intent kind, not tenant identity. All three pilot tenants (Apex
  Retail, Meridian Health, First Capital) get the four-section answer
  on hybrid and initiative-specific questions immediately on deploy.
- Specific clients: no — the routing logic is identical across tenants.
- Internal only: no. Visible improvement on the deployed product
  surface.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/llm.ts` — wire composition short-circuit (new constant
  `COMPOSITION_MODEL_NAME = 'atlas-composition-deterministic'`; new
  branch returning composer text for hybrid + initiative-specific
  intents before the Anthropic call).
- `scripts/qa/atlas-live-prod-smoke.ts` — exit `2` on hybrid
  four-section misses; emit `hybrid four-section fires — N/M` line in
  the script's stdout summary.
- `docs/releases/records/2026-05-31-atlas-runllm-composition-wiring.md` —
  this record.
- `reports/2026-05-31-atlas-live-prod-smoke-post-wire/` — re-run
  artifacts (added post-deploy).

## QA / Validation
- Overall status: **PASS** (pre-deploy validation green; post-deploy
  live smoke pending Vercel deploy).
- `npx tsc --noEmit` — **passed** on all Atlas-related files (Azure /
  pptxgenjs / @resvg type-resolution errors are pre-existing workflow
  artifacts per project memory, unrelated to this change).
- `npx jest src/lib/atlas/llm-determinism.test.ts
  src/lib/atlas/composition/__tests__/compose.test.ts` — **12/12
  passed**.
- In-process IAC E2E harness re-run with the wiring change in place —
  **100% pass** (90 turns A grade across 3 tenants), 21/21 hybrid
  four-section composition fires, 6/6 cross-tenant probes blocked. No
  regression on the in-process path. Report at
  `reports/2026-05-31-atlas-iac-e2e-post-wire/`.
- Live-prod smoke re-run pending Vercel deploy of this PR. Target:
  2/2 hybrid Qs render the four-section structure (was 0/2 in PR
  #2629). Will land at
  `reports/2026-05-31-atlas-live-prod-smoke-post-wire/`.

## Rollout Plan
- Merge this PR to main. Vercel auto-deploys main.
- Wait for `/api/health` to come back green on
  `https://app.abarva.ai` (~2 min).
- Run `PROD_URL=https://app.abarva.ai npx tsx -r dotenv/config
  scripts/qa/atlas-live-prod-smoke.ts dotenv_config_path=.env.local`.
- Confirm the headline shows `Hybrid four-section composition fires:
  2/2` and the script exits 0.
- Commit the re-run artifacts at
  `reports/2026-05-31-atlas-live-prod-smoke-post-wire/`.

## Rollback Plan
- Revert this PR. The short-circuit branch is additive — reverting it
  restores the prior "embed composition in retrieved context, ask LLM
  to write the answer" behavior. No data migration is needed.
- If the live smoke shows the deterministic composer output is
  insufficient for any hybrid prompt class, the fallback is to keep
  the wiring but extend the composer's `formatTenantFacts` /
  `formatIndustryContext` / `formatGap` / `formatNextMove` shapers —
  not to revert to LLM paraphrase.

## Audit Evidence
- Closes the P2 observation in release
  `2026-05-30-atlas-live-prod-smoke` (`Hybrid four-section composition
  does NOT render on the LLM route. 0/2 hybrid LLM turns produced the
  four headers.`).
- Preserves PR #2611 HI-1 (temperature parameter drop) — the live
  Claude call is still wired for `archetype-specific` and pure free-
  form questions; only the substrate-anchored hybrid /
  initiative-specific subset is now short-circuited.
- Preserves PR #2614 ME-1 (banned-phrase guardrail) — composition text
  is generated by deterministic shapers in
  `src/lib/atlas/composition/compose.ts` which do not emit banned
  phrases. The LLM-route guardrail remains active for the prompts
  still flowing through Claude.
- Preserves PR #2615 HI-3 (response-shaper bypass for already-
  structured output) — the composer emits the structured four-section
  format that `looksAlreadyStructured` in
  `src/lib/agent/response-shape.ts` is designed to recognize, so the
  Tower shaper passes the text through unchanged.
- Tenant-scoping invariant validated by the in-process harness's 6
  cross-tenant API probes (PASS 6/6) on the post-wire re-run.

## Known Gaps
- The smoke deck is 6 turns, 2 of which are hybrid. Validation of the
  fix's success depends on those 2 hybrids; a larger deck (10–20
  hybrid prompts spread across tenants) would tighten confidence from
  "verified on 2 cases" to "verified across a representative spread".
  Tracked for a follow-up if pilot requires it.
- `archetype-specific` intent (no tenant initiative anchor — e.g.,
  pure "what does the corpus say about GitHub Copilot adoption?")
  still flows through Claude. That path is intentional: the model
  adds value weaving corpus snippets with the user's framing, and
  forcing a single-section composer answer there would regress
  response quality. Tracked for re-evaluation once the corpus
  retrieval layer carries more deterministic claim structure.
- The composition shaper's `formatTenantFacts` slices metrics to 3 and
  signals to 2 for compactness. Some hybrid prompts may want a longer
  read; this is a deliberate compactness call and can be raised if
  pilot feedback shows truncation pain.
