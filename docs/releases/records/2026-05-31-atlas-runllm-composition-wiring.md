# Atlas runAtlasLlm composition wiring — 2026-05-31

## Summary

Wires `runAtlasLlm` (the live deployed `/api/v1/atlas/ask` route helper)
through the Wave 3 IAC composition layer (`composeAtlasIacAnswer`) so the
four-section CIO answer — `Your data / Industry context / The gap / Next
move` — actually fires for real users on `https://app.abarva.ai`.

## Gap closed

The 2026-05-30 in-process IAC E2E harness (PR #2622) reported 21/21 hybrid
composition success because it invoked `composeAtlasIacAnswer` directly.
The companion 2026-05-30 live-prod smoke (PR #2629) against
`app.abarva.ai/api/v1/atlas/ask` reported **0/2 hybrid LLM turns rendering
the four-section structure** — because `runAtlasLlm` (the production
route) didn't surface the composer's output; it embedded the composed
answer in `RETRIEVED CONTEXT` and asked Claude to write an answer from
scratch. Claude paraphrased and dropped the structure.

Two Atlas code paths existed:

- `composeAtlasIacAnswer` (Wave 3): deterministic four-section render from
  Tower / Source ledger + IAC archetype catalog. Validated 21/21 in the
  in-process harness.
- `runAtlasLlm` (deployed): tool-grounded Claude call. Production hit
  routeType=llm whenever the scripted classifier missed; the composer's
  output was buried in context and not surfaced as the answer.

Wave 3 wired the wrong one.

## Fix — Option A (merge the two paths)

In `src/lib/atlas/llm.ts`, after `assembleRetrievalContext` returns (which
already invokes `composeAtlasIacAnswer` and stashes the result in
`retrievalContext.atlasIacComposition`), check the composition intent.
When the composer returned a non-null result for `hybrid` or
`initiative-specific` intent, short-circuit: return the composed
four-section text directly with `atlasMode='live'`, `modelName='atlas-
composition-deterministic'`, and skip the Anthropic call. The
`archetype-specific` path (no tenant initiative anchor) keeps going
through the LLM because the model adds value weaving corpus context, and
forcing a one-section composer answer would regress.

Why Option A vs Option B (LLM overlay):

- The composition is **already computed** inside `assembleRetrievalContext`
  — no extra DB / IAC fetch.
- Composer output is **deterministic + auditable** — the same input
  produces the same four-section answer; no LLM drift.
- Asking the LLM to mimic an exact four-section template is fragile (the
  live-prod smoke proved 0/2 retention).
- Saves an Anthropic call for the hybrid / initiative-specific subset.
- Cuts latency for these turns from ~17-26s (Claude round-trip) to
  ~1s (DB-only composer).

## Tenant-scoping / safety

The composer keys on tenant `clientId` and uses the standard
`AtlasTenancyCtx` already enforced upstream (`requireAtlasTenancy`).
Tenant scoping invariant is preserved (verified by the in-process
harness's cross-tenant probes, 6/6 PASS post-wire). `x-atlas-mode: live`
header still emitted because composer-grounded answers are live, not
fallback.

## Validation

- `npx tsc --noEmit` — clean on all atlas files
- `npx jest src/lib/atlas/llm-determinism.test.ts src/lib/atlas/composition/__tests__/compose.test.ts` —
  12/12 pass
- In-process IAC E2E harness re-run — 100% (21/21 hybrid composition,
  6/6 cross-tenant probes blocked); no regression
- Live-prod smoke re-run post-deploy — see
  `reports/2026-05-31-atlas-live-prod-smoke-post-wire/LIVE_SMOKE.md`

The live-prod smoke scorecard was extended to fail (exit 2) when any
hybrid turn returns `fourSectionStructure === false`, so future
regressions are caught in CI / nightly QA.

## Files

- `src/lib/atlas/llm.ts` — wire composition short-circuit
- `scripts/qa/atlas-live-prod-smoke.ts` — fail on hybrid four-section miss
- `docs/releases/records/2026-05-31-atlas-runllm-composition-wiring.md` — this record
- `reports/2026-05-31-atlas-live-prod-smoke-post-wire/` — re-run artifacts
