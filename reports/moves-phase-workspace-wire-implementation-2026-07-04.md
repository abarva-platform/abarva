# Moves — Phase Workspace live mount (increment 3 implementation report)

**Date:** 2026-07-04 · **Slice:** mount the catalog-driven phase-workspace guidance into the live Moves phase page, behind a tenant flag, driven by **real** data (the governed phase-template catalog keyed on the actual phase). Builds on increments 1 (#4557) and 2 (#4559).

## 1. Executive verdict

Wired the phase-workspace UI into the real Moves phase page (`StrategicMovePhaseClient`) behind `moves_phase_workspace_v2` (tenant policy, off by default; **Lakeshore** opted in for live proof). The mount is **purely additive and presentational** — when the flag is off the workspace is byte-for-byte the previous behavior. The panel renders the two cards that are honestly driven by **real catalog data** for the current phase (P2–P5): "How to complete this phase" and "Sessions and templates for this phase". The data-hungry cards (assessment map, options, workstreams, upload mapping) are **deliberately not** mounted live yet — a real move doesn't carry that data, and rendering the Lakeshore fixture on a live page would fabricate content, which the governance rules forbid. Those wire in as their real sources come online (Pattern Assembly = increment 4).

## 2. What was implemented

- **New flag** `moves_phase_workspace_v2` in `src/lib/features/registry.ts` (policy `tenant`, `includeTenants: ["lakeshore"]`, env allowlist supported).
- **New component** `src/components/strategic-moves/phase-workspace/MovePhaseWorkspacePanel.tsx` — maps the app's numeric phase (2→P2 … 5→P5; 0/1 render nothing) to `templatesForPhase(code)` and renders the two guidance cards. Keeps the **app's own phase label authoritative** (passed in, not overridden by the module's labels) to avoid dual-label confusion.
- **Mount** in `StrategicMovePhaseClient.tsx`: one `useFeature("moves_phase_workspace_v2")` hook + a flag-gated panel wrapped into the existing `workspace` prop (a fragment above both the workbench and canvas branches). No CharterWorkflow internals touched.

## 3. UX changes

When the flag is on for a tenant, the current-phase workspace gains a guidance panel at the top: a "How to complete this phase" card (steps + recommended-session and template counts) and a "Sessions and templates for this phase" card (each template with its session type + format), styled in the approved design system (scoped `.pw` tokens, no Tailwind coupling). When off: no change.

## 4. Data / intelligence layer changes

None. Pure presentation over increment 1's catalog. The panel reads `templatesForPhase(phaseCode)` — real governed catalog data — and authors no numbers.

## 5. Governance held

- **Additive + reversible:** flag off ⇒ identical prior behavior; revert = delete the flag opt-in.
- **No fabrication:** only the two cards backed by real catalog data are mounted; fixture-only cards are excluded from the live page by design.
- **Client-friendly only:** raw block keys / dev terms never reach the DOM (asserted by test).
- **App label authoritative:** the module does not rename the app's phases on screen.

## 6. Files changed

`src/lib/features/registry.ts` (+flag), `src/components/strategic-moves/phase-workspace/MovePhaseWorkspacePanel.tsx` (new), `src/components/strategic-moves/phase-workspace/index.ts` (+export), `src/components/strategic-moves/StrategicMovePhaseClient.tsx` (+import, +hook, +gated mount), `__tests__/phase-workspace.test.tsx` (+3 panel tests). Proof: `proof/moves-phase-workspace-wire-2026-07-04/phase-workspace-panel-p2-render.html`.

## 7. Tests / validation run

- **Jest — 15/15** (`src/components/strategic-moves/phase-workspace`): +3 mount tests (P2 renders guidance+templates with the app label; 0/1 render null; 3/4/5 map to the right catalog phases).
- **esbuild parse** of the edited 2,884-line client — **exit 0** (JSX balanced; the only class of error that breaks the build, since `next.config.ts` sets `typescript.ignoreBuildErrors: true`).
- **Scoped strict `tsc`** (components + lib) — **exit 0**.
- **ESLint** on all changed files — **exit 0**.
- **Feature registry test** — passes (my flag is well-formed). One unrelated features test (`neo4j-gate`) fails identically with my changes stashed — pre-existing, env-gated, not mine.
- **Panel render proof** — real component → static HTML, content self-checks pass.
- **Live signed-in proof (Lakeshore)** — captured after deploy (main auto-deploys to ACA on merge); see the release record / PR.

## 8. Known gaps / non-claims

- Only the two catalog-backed cards are live; the assessment/options/workstream/upload cards await real data (Pattern Assembly, increment 4) and persisted per-phase state.
- The panel is guidance only — no interactive upload→classify wiring in this increment (the existing upload route is untouched).
- Full-project `tsc --noEmit` remains red from the unrelated merge; it does not block build/deploy (`ignoreBuildErrors: true`) and does not affect this self-contained change.

## 9. Recommended next backlog

1. Increment 4: wire the live Pattern Assembly loop and render the assessment/options cards from validated output.
2. Route real uploads through `classifyUpload` (Move-scoped) and surface the UploadMappingSummaryCard live.
3. Persist per-phase findings + feed-forward Inputs Packs so the readiness pack renders from real state.
4. Once proven for Lakeshore, widen `includeTenants` or flip to platform policy.
