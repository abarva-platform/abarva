# Codex Handoff — Source Decision Engine · Slice A2

**Persist evidence-based auto-assessment as a durable audit record**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first — standing anchors, validation,
> verification gate, reporting contract, and boundaries apply here verbatim.
> **Depends on Slice A** (the derive-at-read assessment must be merged and verified first).

---

## 0 · Why this slice

Slice A derives the auto-assessment at render time (read-only, safe, but ephemeral). For
pilot rigor and audit, when a criterion is auto-met from evidence we want a **durable record**:
who/what assessed it, from which evidence, at what readiness level, when. This slice persists
that — **without ever overriding a human decision**.

This is deliberately separate from A because it introduces **writes** and must be safe.

---

## 1 · The model

- A criterion's persisted state is the source of truth. Auto-assessment may **only** write a
  criterion whose current persisted state is `pending`. If a human persisted `met`/`not_met`/
  `waived`, the writer **skips it** (human always wins). This is the override-protection invariant.
- The write is **best-effort and audited**: a failure never breaks the page or the stage advance.
- The write stamps provenance so the UI can show `Auto-assessed from evidence` vs `Manual`.

## 2 · No migration — the columns already exist

`source_event_gate_criterion_states` already has `notes` (text) and `evidence_artifact_ids`
(text[]). The only gap: `updateGateCriterion` in the write adapter writes `state`,
`reviewer_user_id`, `reviewed_at`, `updated_at` — but **not** `notes` / `evidence_artifact_ids`.

So the persistence story is **code-only**:
- `reviewer_user_id = 'system:auto-evidence'` → the sentinel marking machine provenance
  (a real personId = manual; `null` = pending). Verify this string is accepted (the column is
  free-text in the substrate; if an FK constraint exists, fall back to `notes`-only provenance
  and report it).
- `notes` → human-readable assessment reason (e.g. `Auto-met: EVID-SRC-SCOPE-APP-INV at
  'Usable Evidence' ≥ minimum 'Usable Evidence'`).
- `evidence_artifact_ids` → the satisfying evidence row IDs.

**If you find yourself writing a SQL migration, stop** — confirm the columns first
(`\d source_event_gate_criterion_states`); they exist.

---

## 3 · Build tasks

### 3.1 — Extend the write adapter
`src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`
- Add optional `notes?: string | null` and `evidenceArtifactIds?: string[]` to
  `GateCriterionUpdate`.
- Update BOTH adapter implementations' `updateGateCriterion` SQL/builder to write the two
  columns when provided (leave them untouched when omitted — the manual PATCH route keeps its
  current behavior). Keep the `RETURNING *` shape.

### 3.2 — Auto-assessment persistence function
New `src/lib/source/gate-auto-assessment-persist.ts`:
```ts
persistAutoAssessment(input: {
  eventId: string; clientKey: string; fromStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];      // current persisted states
  evidence: SourceEventEvidence[];
}): Promise<{ written: string[]; skipped: string[]; failed: string[] }>
```
- Reuse `assessStageGate()` from Slice A (do not re-implement the logic).
- For each criterion whose **persisted** state is `pending` AND assessment is `met_auto_evidence`:
  call `selectSourceWriteAdapter(undefined, clientKey).updateGateCriterion({ criterionRowId,
  state: 'met', reviewerUserId: 'system:auto-evidence', reviewedAtIso: <now>, notes,
  evidenceArtifactIds, updatedAtIso: <now> })`.
- Never touch a criterion already `met`/`not_met`/`waived`. Record it under `skipped`.
- Idempotent: re-running produces zero new writes (already `met` → skipped). Confirm in a test.

### 3.3 — Trigger point
Call `persistAutoAssessment` at **stage entry** (after a successful `updateStage` in the approve
route / stage-transition path) — best-effort, wrapped so a failure logs and continues. Do NOT
call it on every render (that's Slice A's job, read-only). One audited write per stage entry.

### 3.4 — UI provenance
`GateTab.tsx`: a criterion with `reviewer_user_id === 'system:auto-evidence'` shows the badge
**`Auto-assessed from evidence`** with the `notes` reason on hover/expand; a human reviewer shows
**`Manual`** / `Manual override`. (Slice A may have shown this from derived state; now it reads
from the persisted row.)

---

## 4 · Tests
`src/lib/source/__tests__/gate-auto-assessment-persist.test.ts` (mock the write adapter):
1. `pending` + evidence above threshold → one `updateGateCriterion` call with state `met`,
   `reviewer_user_id='system:auto-evidence'`, populated `notes` + `evidenceArtifactIds`.
2. **Override protection:** persisted `not_met` + evidence above threshold → **no write** (skipped).
3. **Idempotency:** already `met` → no write.
4. Adapter failure → function returns the criterion under `failed`, does not throw.
5. Adapter unit test: `updateGateCriterion` persists `notes` + `evidence_artifact_ids` when provided,
   leaves them unchanged when omitted.

Plus standing validation (OVERVIEW).

---

## 5 · Browser verification (the hard gate)
On the SkyHarbor Air event (ensure one Scope evidence row is at/above threshold, as in Slice A):
1. Enter the Scope stage fresh (trigger a stage entry).
2. **Reload** the Gate tab and confirm the auto-met criterion is now **persisted** `met` with the
   `Auto-assessed from evidence` badge + reason — it survives reload (proves it's written, not derived).
3. Manually `Reopen` a different criterion, set it `not_met`, re-trigger entry → confirm it stays
   `not_met` (human wins; no auto-override). Screenshot both.
4. Check the Log/audit tab shows the system-actor entry if one is surfaced.

Label `click-verified` or `code-complete` honestly.

---

## 6 · Out of scope / boundaries
- Do NOT auto-assess anything but `met_auto_evidence` on `pending` criteria. No auto-`not_met`,
  no auto-`waived`.
- No migration. No new tables/columns (the two columns exist).
- Branch: `codex/source-decision-engine-slice-a2` ·
  PR title: `Source Decision Engine · Slice A2: persist evidence auto-assessment (audited, override-safe)`
