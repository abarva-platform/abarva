# 2026-07-05-intelligence-companion-canvas — Rich 2-zone decision canvas + true streaming

## Release ID

`2026-07-05-intelligence-companion-canvas`

## Status

`candidate`

## Plain-English Summary

The live Intelligence surface (`/intelligence` → `IntelligenceV2Surface`) already streamed an answer and rendered a per-question canvas, but with two weaknesses: the executive answer did not truly stream (a "Working…" spinner for up to ~30s), and the canvas could be thin/generic and had only a coarse Known/Assumed/Missing honesty model.

This change lands three things together, on the live v2 surface:

1. **A rich-data mandate** in the canvas contract — every answer must produce at least four *specific* Signals and a substantive exhibit, tied to the question and to named tenant systems or specific industry benchmarks, with a hard self-check that regenerates thin or generic output. Richness is explicitly bounded by honesty: never fabricate a tenant number.
2. **A structured Signals honesty model** rendered as a lean two-zone canvas — ZONE 1 *Signals* (per-metric tiles that are visually unmistakable: `measured` = your real number, `benchmark` = an industry range, `expected_uncaptured` = "not instrumented → load to Source"), ZONE 2 *The Picture* (the existing exhibit, with an "Estimated — connect data to confirm" band when inference-heavy). Decision and next-moves fold into the streamed answer; industry benchmarks fold into Signals tiles. Fewer surfaces, consistent quality.
3. **True main-answer streaming** — the executive answer streams token-by-token (~1–2s to first word) up to the first canvas tab marker, then the canvas resolves. The final answer text is byte-identical to before; only *when* tokens are emitted changed.

## Layer Impact

- `global-control-lane`: Shared Intelligence answer + canvas behavior on the live v2 surface. NOT feature-flagged — these are default quality improvements for every tenant (the renderer degrades gracefully to the prior companion cards when an answer lacks structured signals; the streaming change keeps the final answer byte-identical). No schema/RLS/data-plane change.

## Client Applicability

- All clients: Yes — default behavior change on `/intelligence` (quality improvement; graceful degradation; byte-identical final answer text under streaming).
- Specific clients: Pilot proof on Lakeshore first.
- Internal only / Public/demo only: No.
- Feature flag: none for the shipped v2 reconcile. (A separate, superseded `intelligence_companion_canvas` flag remains OFF/dormant — see Known Gaps.)

## Changes Included

Branch `feat/intelligence-companion-canvas` off `main` @ `69002911e`. Reconcile commits:
- `f75639e7e` — tabbed-response.ts DATA RICHNESS/RELEVANCE/HONESTY mandate; flag off.
- `99094184f` — structured Signals spine (cxo-canvas/canvasTypes.ts + canvasSchemas.ts zod + honesty guard; tabbed-response.ts signals mandate/example); IntelligenceV2Surface.tsx two-zone renderer; ask/synthesizer.ts true main-answer streaming (`reconcileStreamRemainder`); ask-guardrails test updated.
- (`93aba9386` — earlier v3 SentinelChat companion-canvas experiment; now dormant/flag-off, see Known Gaps.)

## QA / Validation

- **Typecheck:** `tsc --noEmit` (8GB heap) → exit 0, 0 errors (whole project, all changes integrated).
- **Lint:** eslint on all changed files → clean.
- **Unit tests:** 66 pass across cxo-canvas, tabbed-response, ask-guardrails, companion-canvas, feature-flag suites. Includes the honesty-guard (values stripped off non-measured tiles) and the streaming source-path assertion updated to the new reconcileStreamRemainder emit.
- **Regression:** flag-off / plain-text / answerOnly paths verified untouched by design; the 6 `tenant-identity-pin.test.ts` failures are PRE-EXISTING on `main` (display-name fixture drift, reproduced with changes stashed) and unrelated.
- **Not yet done:** live signed-in Lakeshore QA on ACA (see Known Gaps).

## Rollout Plan

Merge to `main`; ACA image build/deploy of the merged SHA carries it (auto-deploy on push per repo convention). No migration, no data-plane change, no worker change.

## Deployment Authority

- Repo-owned deploy workflow: standard `main` → ACA build/deploy (`ca-abarva-web-lab-eastus`).
- Shared runtime mutators / worker image invariant: none / N/A.
- Approved image digest: TBD from merged SHA.
- Feature/env flag update path: N/A for the shipped reconcile (default behavior).
- Live signed-in proof required: YES — Lakeshore session on ACA before declaring success.

## Rollback Plan

Revert the merge commit (code-only, no migration). Because the streaming change keeps the final answer byte-identical and the renderer degrades gracefully, blast radius is contained; revert is clean.

## Audit Evidence

- Branch `feat/intelligence-companion-canvas` diff.
- Typecheck/lint/test output (QA section).
- Pending: PR URL, CI run, live Lakeshore signed-in screenshots + first-token timing.

## Known Gaps

- **Live signed-in Lakeshore proof not yet run** — needs an ACA session (localhost can't reach the private DB). This is the one remaining step to declare user-visible success.
- **Dormant v3 code** — the earlier `intelligence_companion_canvas` experiment (v3 `CompanionCanvas.tsx`, `companion-canvas-engine.ts`, `answerOnlyStreaming`, v3 SentinelChat wiring) ships flag-OFF and unused on the live path. Harmless but should be removed in a cleanup PR.
- **Amber literal** — the v2 Signals tiles use `#b45309` amber vs the file's own `#A66A1F` var; reconcile in visual QA.
- **Streaming divergence edge** — if a repair pass rewrites the pre-tab prefix already streamed, the client resyncs from the longest common prefix (no content lost) and a `live_main_answer.repair_diverged` trace fires; rare in practice.
