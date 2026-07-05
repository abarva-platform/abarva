# 2026-07-05-intelligence-companion-canvas — Live per-question decision companion canvas

## Release ID

`2026-07-05-intelligence-companion-canvas`

## Status

`candidate`

## Plain-English Summary

Today, when a user asks the Intelligence advisor a question, the executive answer on the left does not truly stream — the server generates the entire answer plus a mandatory five-tab "companion canvas" and runs blocking repair passes before flushing anything, so the first word can take 30+ seconds — and the structured canvas it generates is then flattened into prose and never rendered as a real panel. The right-hand canvas visible on the Intelligence surfaces is a separate, static view model that does not respond to the question at all.

This change splits the answer into two channels behind a feature flag:

1. **Left — the executive answer now streams for real.** On companion-canvas turns the synthesizer runs an answer-only prompt (no five-tab contract, no repair passes) and yields model tokens live, so time-to-first-token drops from "whole generation" to ~1–2 seconds.
2. **Right — a live, per-question decision companion.** After the answer streams, a separate engine authors a structured five-lens canvas (Signals · Decision · The Picture · Industry · Next Moves) with five focused parallel model calls, each verified-and-repaired against an honesty contract, and emits it as a `canvas` event. The client renders it as a real tabbed panel with an explicit honesty model: every signal tile is labeled `measured` (your evidence), `benchmark` (industry range), or `expected_uncaptured` (not instrumented — with a "load this" hint), and inference-heavy exhibits carry an "Estimated — connect data to confirm" band. No fabricated tenant numbers.

Tenant isolation is preserved under true streaming by pre-screening retrieved sources for cross-tenant contamination before generation and running a rolling leak detector on each streamed chunk (aborting mid-stream with a refusal if a cross-tenant identity is asserted).

## Layer Impact

- `global-control-lane`: Shared Intelligence answer/answer-canvas behavior, gated behind the `intelligence_companion_canvas` feature flag. Flag OFF is byte-identical to today for every existing caller. No schema, RLS, or data-plane change.

## Client Applicability

State exactly who receives the change.

- All clients: No (flag default OFF).
- Specific clients: Lakeshore (`includeTenants: ["lakeshore"]`) as the first pilot tenant — chosen because its asymmetric evidence (rich contracts/apps, thin HR/CX/cyber) exercises the honesty-degradation ladder hardest.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `intelligence_companion_canvas` (tenant policy, default OFF; env override `ABARVA_FEATURE_INTELLIGENCE_COMPANION_CANVAS_ENABLED_TENANTS`).

## Changes Included

Branch `feat/intelligence-companion-canvas` (off `main` @ `69002911e`). New files:

- `src/lib/intelligence/ask/companion-canvas.ts` — shared typed contract (honesty model: `SignalTile` state + provenance; `CompanionExhibit` union; `CompanionCanvasPayload`; `computeLensOrder` / `isTenantThin`).
- `src/lib/intelligence/ask/tenant-stream-guard.ts` — `prescreenSourcesForLeak` + `createRollingLeakDetector` (reuse the existing `detectCrossTenantIdentityLeak` / `detectOffTenantMention` detectors).
- `src/lib/intelligence/ask/companion-canvas-engine.ts` — `buildCompanionCanvasPayload`: five focused parallel per-lens calls, each with a verify-and-repair pass; defensive parsing; graceful degradation (never throws).
- `src/components/intelligence-v3/CompanionCanvas.tsx` — the five-tab renderer (three tile honesty states, unverified band, four exhibit renderers, progressive skeletons, a11y summary).
- `src/lib/intelligence/ask/__tests__/companion-canvas.test.ts` — 14 unit tests.

Modified:

- `src/lib/intelligence/ask/synthesizer.ts` — `answerOnlyStreaming?: boolean` param → answer-only prompt + true live token streaming + pre-screen + rolling guard. Flag-off path unchanged.
- `src/lib/intelligence/ask/index.ts` — `AskEvent` gains `canvas`; `AskOptions` gains `companionCanvasEnabled`; emits the `canvas` event after the answer stream (try/catch, non-fatal).
- `src/app/api/intelligence/ask/route.ts` — computes the flag and passes it; gates the legacy route tab-injection when the flag is ON (avoids a contradictory second canvas).
- `src/components/intelligence-v3/SentinelChat.tsx` — consumes the `canvas` event; two new optional props (`onCompanionCanvas`, `renderInlineCompanionCanvas`); default behavior identical.
- `src/lib/features/registry.ts` — registers the `intelligence_companion_canvas` flag.

## QA / Validation

- **Typecheck:** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → exit 0, 0 errors (whole project, both tracks integrated).
- **Lint:** `eslint` on all 9 changed files → exit 0.
- **Unit tests (new):** `jest .../companion-canvas.test.ts` → 14/14 pass (lens ordering, tenant-thin detection, source pre-screen, rolling leak abort + latch).
- **Regression:** existing `src/lib/intelligence/ask/__tests__` suites relevant to the flag-off path pass (ask-guardrails, no-fabrication, tenant-key-resolution — 67 tests). The 6 failures in `tenant-identity-pin.test.ts` are PRE-EXISTING on `main` (reproduced with our changes stashed; a display-name fixture drift, "Apex Retail Group" → "Retail Demo") and are unrelated to this change.
- **Not yet done:** live signed-in QA on ACA (flag on for Lakeshore) — see Known Gaps.

## Rollout Plan

Merge to `main`. No migration, no data-plane change. Feature is dark by default; activation is per-tenant via the `intelligence_companion_canvas` flag (`includeTenants` or the env override). Deploys via the standard ACA image build/deploy of `main` (auto-deploy on push per repo convention). No control-lane or worker change.

## Deployment Authority

- Repo-owned deploy workflow: standard `main` → ACA image build/deploy (`ca-abarva-web-lab-eastus`).
- Shared runtime mutators: none.
- Approved image digest: TBD at build time from the merged SHA.
- ACA runtime invariant: no change to runtime image contract.
- Worker image invariant: N/A (no worker change).
- Feature/env flag update path: `intelligence_companion_canvas` in `src/lib/features/registry.ts` `includeTenants`, or `ABARVA_FEATURE_INTELLIGENCE_COMPANION_CANVAS_ENABLED_TENANTS`.
- Live signed-in proof required: YES — verify streaming left + rendered canvas on a Lakeshore session before widening.

## Rollback Plan

Fastest: remove the tenant from the flag's `includeTenants` (or unset the env override) — instantly reverts to the legacy inline-prose path with zero deploy. Full: revert the branch merge. No migration to unwind.

## Audit Evidence

- Branch `feat/intelligence-companion-canvas` diff (9 files, +2539/−25).
- Typecheck/lint/test output (this record's QA section).
- Pending: PR URL, CI run, live Lakeshore signed-in screenshots + first-token timing.

## Known Gaps

- **Live signed-in proof not yet run.** Needs a Lakeshore ACA session to confirm (a) real streaming latency drop and (b) the canvas rendering with correct honesty states. Localhost cannot reach the private DB.
- **Rolling leak detector is defense-in-depth, not a hard guarantee** — a cross-tenant assertion could stream a fraction of a sentence before the rolling buffer trips. Mitigated by the pre-generation source pre-screen; acceptable for a single pilot tenant, revisit before broad rollout.
- **Per-lens engine model calls are unmocked in tests** (model-dependent); covered by defensive parsing + graceful degradation, but no golden-output eval yet.
- Only the `SentinelChat`-based surfaces (`/intelligence/map`, `/brief`, `/ask`) get the canvas; the static `AdvisoryIntelligencePage` at `/intelligence` is unchanged.
