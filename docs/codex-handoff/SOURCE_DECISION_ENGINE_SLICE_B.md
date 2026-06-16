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
  refresh does NOT duplicate. Detect by checking the per-event artifact row already has a
  non-empty `body` (or a `generated`/`drafted` status) — if so, skip.
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

### 2.2 — Wire triggers
- **P0 approval (the gap):** in `src/app/api/v1/source/events/[eventId]/approve/route.ts`,
  after the existing `updateStage` to `scope` (Strategy-at-P0 path), call
  `autoDraftOnStageEntry({ enteredStage: 'scope' })` **and** generate the **strategy memo
  (`d01`)** as the written strategy record (since Strategy is skipped). Both best-effort,
  awaited but non-fatal. Mirror the existing best-effort pattern in that route.
- **Generic stage entry:** wherever a stage advance is committed (the gate-promote path /
  stage transition), fire `autoDraftOnStageEntry` for the new stage. If a single shared
  transition point doesn't exist, add the call at the promote handler; do not scatter it.

### 2.3 — Surface generation status
`DocumentTab.tsx` (and/or the workspace shelf): show per-artifact draft status —
`Draft ready for review` / `Generating…` / `Generation failed · Retry`. Use the existing
artifact status enum; do not invent a parallel state store. The manual "Generate" button stays.

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
