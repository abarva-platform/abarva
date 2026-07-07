# Codex Handoff — Source Decision Engine · Slice B

**Auto-draft on stage entry (fast path)**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first — standing anchors, validation,
> verification gate, reporting contract, boundaries apply verbatim. Pairs with Slice A.

---

## 0 · Why this slice

The artifact generators already exist but are **manual button triggers** — nothing fires on
stage entry. The CXO promise ("a draft is waiting when you arrive") needs the draft to be
**queued/generated the moment the event enters a stage**, on the **fast path** (Sonnet,
single-shot — NOT the expensive orchestrator; that's Slice B2).

Closes the known P0 gap: when Strategy is waived at P0 approval, **no strategy memo is
generated**, so the event enters Scope with no written strategy record.

---

## 1 · Architecture decision (made — do not re-litigate)

- **Fast path only.** Use the existing `src/lib/source/agent-generation/` flow
  (`getPromptTemplate` → `buildSourceGenerationContext` → server generate). Sonnet, ~4000
  tokens, single-shot. Do NOT route through the deliverables orchestrator (Slice B2).
- **Idempotent.** A stage entry generates each in-scope artifact draft **once**. Re-entry /
  refresh does NOT duplicate. **Verified idempotency signal:** the per-event artifact row's
  **`body != null`** (equivalently `body_updated_at != null`) — NOT `status`. The manual generate
  route writes only the `body_*` columns and does not change `status`, so `status` is the wrong
  signal. Skip if `body != null`, and also skip if `status ∈ {locked, superseded}` (the generate
  route already refuses those). Field defs: `canvas-substrate/types.ts:36` (`body`), `:39`
  (`body_updated_at`).
- **Best-effort.** A generation failure never breaks the stage advance or the page. Record the
  failure + retry availability on the artifact row; the existing manual "Generate" button stays
  as the regeneration fallback.
- **Only templated codes.** The registry currently supports `d01`, `d05`, `d09`. Auto-draft
  only those on entry; for stages whose artifact has no template yet, do nothing (and `log`
  which were skipped — no silent gaps). Extending template coverage is a follow-on, not this slice.

---

## 2 · Build tasks

### 2.1 — Stage-entry draft trigger
New `src/lib/source/stage-entry-autodraft.ts`:
```ts
autoDraftOnStageEntry(input: {
  eventId: string; clientKey: string; enteredStage: SourceStageKey;
}): Promise<{ generated: string[]; skipped: string[]; failed: string[] }>
```
- Resolve which artifact codes belong to `enteredStage` from `stage-canvas-config.ts`
  (`artifactIds`) ∩ `listSupportedGenerationCodes()` (templated only).
- For each: load the per-event artifact row; if it already has a body → `skipped`. Else build
  context (`buildSourceGenerationContext`), check `findMissingUpstreamCodes` (if a required
  upstream is missing, the template already surfaces the gap — that's fine, still draft), call
  the existing generation server, persist via `updateArtifactBody`/`updateArtifactStatus`.
- Wrap each in try/catch → push to `failed` with reason; never throw out of the function.

### 2.2 — Wire triggers (VERIFIED — there are exactly TWO stage-commit points)

A pre-flight trace pinned every place a stage transition commits (`updateStage` writes
`current_stage_key` + `lifecycle_state`). There are **two competing entries into a stage** — hook
**both**, ideally via one shared helper `onStageEntered(eventId, clientKey, enteredStage)` so the
logic isn't duplicated:

1. **Canonical UI promote path — `src/app/api/v1/source/[eventId]/stage/route.ts:~284`**
   (`PATCH /api/v1/source/:eventId/stage`). This is what `UniversalCanvasShell.tsx`
   `handlePromoteStage` (and the "Next Move" advance) calls. Inject `onStageEntered` **after the
   successful `stageWrite.ok` check, before the `Response.json`**. The entered stage is the
   `stageKey` argument.
2. **Strategy-at-P0 path — `src/app/api/v1/source/events/[eventId]/approve/route.ts:~193`**
   (only when `source_strategy_at_p0` flag on). This sets `current_stage_key='scope'` and waives
   the strategy gates — a **second, competing entry into `scope`**. If you hook only path 1, a
   P0-approved event lands in Scope with no auto-draft. Hook here too, and **also generate the
   strategy memo (`d01`)** as the written strategy record (since Strategy is skipped). This block
   is already try-caught/non-fatal — keep auto-draft non-fatal.

> **CRITICAL — do NOT await generation inside the route response.** Source artifact generation is a
> **60–240s** Anthropic call; the manual generate route survives only because it wraps the call in
> `streamJsonHeartbeat` to beat ACA's ~150s ingress timeout. The `stage` PATCH has **no** heartbeat.
> If you `await autoDraftOnStageEntry()` inline, the promote response hangs for minutes and times
> out. **Fire auto-draft as a non-awaited background job / queued handoff AFTER the stage commit**
> (return the PATCH response immediately; let generation run detached and surface status via §2.3).
> This corrects any "awaited but non-fatal" reading — non-fatal is not enough; it must be non-blocking.

### 2.2b — Reuse the manual generate path (do not duplicate the 9-step sequence)
The manual "Generate" button is `POST /api/v1/source/[eventId]/artifacts/[artifactCode]/generate`
(core fn `generateArtifact`). It runs: `getPromptTemplate` → `ensurePersistedSourceEventForClient`
→ `buildSourceGenerationContext` → `findMissingUpstreamCodes` → fetch artifact row (refuse
locked/superseded) → `collectUpstreamBodies` → `template.buildUserMessage` →
`preflightAnthropicDirectClient` + `messages.create` (deterministic fallback if no
`ANTHROPIC_API_KEY`) → `completeD09RfpGovernanceSections` → persist via `updateArtifactBody`
(+ `registerSourceArtifactUpload` for the Documents shelf + activity log). **Best reuse:** have
`autoDraftOnStageEntry` POST that same generate route per target code (or extract `generateArtifact`
into a callable server fn) — do NOT re-implement the sequence.

### 2.3 — Surface generation status (compact — obey OVERVIEW §UX density contract)
`DocumentTab.tsx` (and/or the workspace shelf): **one row per artifact**, status as a single
marker + one action — never a verbose card per artifact. Layout:

```
● Scope memo                Draft ready for review        [Open] [Regenerate]
● Application inventory      Generating…
● Decision authority log     Generation failed            [Retry]
```

- A single status marker per row (color/word): `Draft ready for review` / `Generating…` /
  `Generation failed`. Don't stack a badge + sentence + label.
- One action set per row, revealed inline (`Open` / `Regenerate` / `Retry`). The manual "Generate"
  button stays as the regeneration fallback.
- Use the existing artifact status enum; do not invent a parallel state store. Detail (generation
  metadata, timestamps, failure reason) lives on expand/hover, not in the row.

---

## 3 · Tests
`src/lib/source/__tests__/stage-entry-autodraft.test.ts` (mock generation server + adapter):
1. Stage entry with an empty templated artifact → generation called once, body persisted.
2. **Idempotency:** artifact already has a body → generation NOT called (skipped).
3. Stage with no templated artifact → no-op, code listed under `skipped`.
4. Generation throws → artifact under `failed`, function resolves (no throw), stage advance unaffected.
5. **P0 approval path:** approving with Strategy-at-P0 on → `d01` strategy memo generated +
   persisted (the gap test). Assert a strategy record now exists on the event.

Plus standing validation (OVERVIEW).

---

## 4 · Browser verification (the hard gate)
SkyHarbor Air event:
1. **P0/strategy memo gap:** on an event approved via the P0 path, open the workspace →
   confirm a **Strategy Memo draft exists** (it didn't before). Screenshot.
2. **Scope entry:** enter Scope → without clicking Generate, confirm a **Scope Memo draft
   appears** with `Draft ready for review`. Screenshot.
3. **Idempotency:** reload / re-enter Scope → confirm the draft is **not duplicated** (still one).
4. **Fallback intact:** the manual "Generate" button still regenerates on demand.
5. Confirm the draft is the **fast path** (Sonnet) — it should be a working draft, generated in
   seconds, not a multi-minute board pack. (Board-grade is Slice B2.)

Label `click-verified` or `code-complete` honestly.

---

## 5 · Out of scope / boundaries
- Do NOT call the deliverables orchestrator or read `ABARVA_DOCGEN_QUALITY_PROFILE` here — fast
  path only. (That bridge is Slice B2.)
- Do NOT extend template coverage beyond d01/d05/d09 in this slice.
- Do NOT fabricate when upstream is missing — the templates already say "surface the gap";
  preserve that.
- Branch: `codex/source-decision-engine-slice-b` ·
  PR title: `Source Decision Engine · Slice B: auto-draft on stage entry (fast path) + P0 strategy memo`
