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

### 1.1 — Study the existing orchestrator call
Read `src/lib/programs/deliverables/orchestrated/run-orchestrated-move-deliverable.ts` and
`src/lib/programs/board-artifacts/orchestrated-move-route.ts` to learn the exact input contract
(deliverable type/code, bound context, tenant, persistence of the result). **Reuse this
machinery — do not fork a second orchestrator.**

### 1.2 — Source board-pack runner
New `src/lib/source/board-pack/run-source-board-pack.ts`:
- Input: `{ eventId, clientKey, artifactCode }` (e.g. `d09_rfp_pack`).
- Build the Source generation context (`buildSourceGenerationContext` + `collectUpstreamBodies`)
  and adapt it into the orchestrator's input shape (the same upstream artifact bodies + event
  facts the fast path uses, but handed to the 6-pass flow).
- Resolve tier from the policy (`DELIVERABLE_TIER` already maps the Source codes) and let the
  orchestrator resolve model + per-pass token budgets from `ABARVA_DOCGEN_QUALITY_PROFILE`.
- Persist the result through the **same path Source artifacts already use**
  (`updateArtifactBody`/`updateArtifactStatus`) so the board pack lands on the existing artifact
  row and renders in the workspace. If the orchestrator emits DOCX/XLSX/HTML + File-Cabinet
  persistence (tier3/4 `requiresFileCabinet`), wire that through the existing renderer/persist
  path; do not reinvent it.

### 1.3 — "Produce board pack" action (route + UI)
- New route, e.g. `src/app/api/v1/source/events/[eventId]/artifacts/[artifactCode]/board-pack/route.ts`
  (POST) → calls the runner. Same auth as other Source generation routes. Long-running: follow
  the existing async/long-call pattern the orchestrator route uses (do not block past the
  function budget — reuse whatever durable/async mechanism the Moves orchestrated route uses).
- `DocumentTab.tsx`: add a **"Produce board pack"** button on tier3/tier4 artifacts, distinct
  from the fast "Generate" button. Show the run state (`Producing board pack…` / passes
  progress if surfaced / `Board pack ready`). Make clear this is the deliberate, heavier action.

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
