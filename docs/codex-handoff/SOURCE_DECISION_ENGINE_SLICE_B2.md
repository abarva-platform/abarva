# Codex Handoff — Source Decision Engine · Slice B2

**Source → orchestrator bridge ("Produce board pack", premium quality dial)**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. **Depends on Slice B.**

---

## 0 · Why this slice (the gap it closes)

PR #3531 added the quality dial `ABARVA_DOCGEN_QUALITY_PROFILE`
(standard ~66k / real_engagement ~132k / premium_final ~456k across a 6-pass Opus flow). The
policy registry **already classifies Source artifacts** at tier3/tier4
(`d01_strategy_memo`, `rfp_package` → `tier4_large_package` in
`src/lib/ai/document-generation-policy.ts`).

**But no Source route calls the orchestrator.** Source generation uses only the fast single-shot
path and never imports the policy. So flipping `premium_final` today **does nothing to a Source
RFP**. This slice is the bridge: an explicit **"Produce board pack"** action that routes a Source
artifact through the deliverables orchestrator at its registered tier + the active quality profile.

This is a **deliberate human click**, never an auto-fire (the board path is slow/expensive).

---

## 1 · Build tasks

### 1.0 — VERIFIED wiring (read first — saves a wrong turn)
A pre-flight trace pinned the contract. The key finding:

> **Do NOT reuse `runOrchestratedMoveDeliverable` / `buildMoveDeliverableRequest`.** They
> **hard-code `module: 'moves'`** (`build-request.ts:~295`) and assemble Move-shaped evidence from
> a `MoveBusinessCaseInput`. `DeliverableModule` already accepts `'source'`
> (`orchestrator/types.ts:~20`). So build your **own** `DeliverableIntelligenceRequest` with
> `module: 'source'` and a Source-shaped `governedEvidenceBundle`, then call the **module-agnostic
> core directly**: `runDeliverableOrchestration(request, modelCaller, { enforcePlanGate: true,
> enforceQualityGate: true })` (`src/lib/deliverables/orchestrator/orchestrator.ts:~117`).

The Move runner is your **reference for shape only** (how it calls `assertDeliverablePolicy`,
builds the request, then `runDeliverableOrchestration`, then renders) — not code to import.

### 1.1 — Source board-pack runner
New `src/lib/source/board-pack/run-source-board-pack.ts`:
- Input: `{ eventId, clientKey, artifactCode }` (e.g. `d09_rfp_pack`).
- `assertDeliverablePolicy(artifactCode)` at entry (`document-generation-policy.ts:~345`) — Source
  codes are in `DELIVERABLE_TIER` (`d09_rfp_pack` → `tier4_large_package`, `d05_scope_memo` →
  tier3, `d01_strategy_memo` → tier4), so this resolves cleanly and rejects chat-tier misuse.
- Build the Source generation context (`buildSourceGenerationContext` + `collectUpstreamBodies`)
  and assemble it into a `DeliverableIntelligenceRequest` with **`module: 'source'`** and a
  Source-shaped `governedEvidenceBundle` (the upstream artifact bodies + event facts the fast path
  already binds). Let `runDeliverableOrchestration` resolve model + per-pass budgets from
  `ABARVA_DOCGEN_QUALITY_PROFILE`.
- **Persistence — reuse, pick the right stack:**
  - HTML-only board pack → `renderDeliverableHtml`
    (`programs/deliverables/orchestrated/render-html.ts`) + persist like the Move route does
    (`persistBoardGradeMoveArtifact` → `generated_artifacts`).
  - DOCX/XLSX board pack (e.g. RFP pack, evaluation workbook) → the **native multi-format stack**:
    `renderDeliverableDocx` / `renderDeliverableExcelCompanion` / `renderDeliverableHtml`
    (`src/lib/deliverables/orchestrator/renderers.ts`) + `persistDeliverable`
    (`orchestrator/persistence.ts`). Source already has `.../artifacts/[code]/render-docx` and
    `render-xlsx` routes — reuse, do not fork either renderer.
  - Land the result on the **existing per-event artifact row** (`updateArtifactBody`) so it renders
    in the workspace like any other artifact.

### 1.2 — "Produce board pack" action (route + UI)
- New route `src/app/api/v1/source/events/[eventId]/artifacts/[artifactCode]/board-pack/route.ts`
  (POST) → calls the runner. Same auth as other Source generation routes. **Mirror the Move board
  route's shape** (`board-artifacts/orchestrated-move-route.ts` `maybeRenderOrchestratedMoveArtifact`):
  own tenant flag, fall back to the deterministic/fast renderer when the flag is off or
  orchestration blocks, emit `x-deliverable-engine: orchestrated` + persistence headers.
- **Long-running gotcha:** the Move route is fully synchronous and just relies on the request
  surviving — but Source generation already wraps long Anthropic calls in `streamJsonHeartbeat`.
  Either wrap the board-pack call in a heartbeat stream (preferred, matches the Source generate
  route) or move it to a job. Do **not** block a plain JSON response for the multi-pass duration.
- `DocumentTab.tsx`: add a **"Produce board pack"** button on tier3/tier4 artifacts, distinct from
  the fast "Generate" button. Show run state (`Producing board pack…` / `Board pack ready`). Make
  clear this is the deliberate, heavier action.

---

## 2 · Tests
1. The runner adapts Source context into the orchestrator input shape correctly (unit, mocked
   orchestrator) for at least `d09_rfp_pack`.
2. Tier resolution: `d09_rfp_pack` → `tier4_large_package`; with `premium_final` the resolved
   per-pass budget matches the premium table (assert via `resolvePassTokenBudget`).
3. The result persists onto the existing per-event artifact row (mocked adapter).
4. Auth parity with other Source generation routes (forbidden without rights).

Plus standing validation (OVERVIEW).

---

## 3 · Browser verification (the hard gate) — THE point of this slice
This slice exists to make the dial reach Source. **Prove it:**
1. Set `ABARVA_DOCGEN_QUALITY_PROFILE=real_engagement` (or `premium_final`) on the test env.
2. SkyHarbor Air event → open the RFP artifact → click **"Produce board pack"**.
3. Confirm it ran the **board path**, not the fast path: evidence is (a) wall-clock is multi-pass
   (not a single ~30s Sonnet call), (b) the output is materially longer/deeper than the
   fast-path draft, (c) if pass telemetry/logs are available, all 6 passes ran on an Opus-class
   model. Capture whatever telemetry the orchestrator exposes.
4. Confirm the board pack persists + renders on the existing artifact row (and File Cabinet if wired).
5. Confirm the fast "Generate" button still produces the quick Sonnet draft (two speeds coexist).

> The acceptance test that was FAILING before this slice: generate a Source RFP with
> `premium_final` on and confirm it is NOT the Sonnet/4000 stub. After this slice, it passes.

Label `click-verified` or `code-complete` honestly. If you cannot run the orchestrator in your
env (no Anthropic key / async infra), say so and give the exact steps + the telemetry to check.

---

## 4 · Out of scope / boundaries
- **Do NOT auto-fire** the board path on stage entry. It is a human action only.
- **Do NOT** implement section-batched 50-slide deck generation (that's the named *Slice F*).
  If the orchestrator's single `render_package` pass can't hold a very large package, **report
  the limit** — do not silently truncate.
- Reuse the existing orchestrator + renderers + File-Cabinet persistence; do not fork them.
- No OpenAI for reasoning. Opus-class via the policy only.
- Branch: `codex/source-decision-engine-slice-b2` ·
  PR title: `Source Decision Engine · Slice B2: route Source artifacts through the board-pack orchestrator`
