# Codex Handoff — Source Decision Engine · Slice A

**Evidence → Gate Auto-Assessment + Stage Decision Status**

> One slice. One PR. Read-only derivation. Verified in a real browser before you report done.

---

## 0 · The contract you are building toward

Source today is a stage/artifact workflow where a human manually checks every gate
criterion box. The target is a **decision engine**: the system reads evidence,
assesses gate readiness, and presents the CXO with one decision —
**approve / reject / request changes** — backed by an evidence explanation.

The promise, in the user's words: **"every click is a decision, not form-fill."**

This slice builds the first and most load-bearing wire of that loop:

```
Per-event evidence state  ──▶  Gate criterion auto-assessment  ──▶  Stage Decision Status panel
   (already in the DB)            (NEW — this slice)                  (NEW — this slice)
```

Nothing else. Auto-draft-on-entry, approval routing, archetype RFP branching, and
vendor ingestion are **explicitly out of scope** (see §7). Do not start them.

---

## 0.5 · VERIFIED pre-flight — the evidence→criterion mapping is already done

A pre-flight analysis read both canonical catalogs in full and produced the join. **You do not
have to discover the mapping — validate and encode this.** Across 39 criteria: **15 clean**
(auto-assessable from readiness alone), **12 fuzzy** (evidence informs but a human act/signature
remains — surface as "evidence ready, confirm", do NOT auto-flip), **12 manual-only** (no backing
evidence — stays manual).

**Build the join with these six rules (each is a real gotcha found in the catalogs):**
1. **Do NOT key on ID prefix.** `EVID-SCOPE-01` (in `gate-criteria.ts`) is a *criterion*, not an
   evidence requirement. Evidence requirements are `EVID-SRC-<STAGE>-<SLUG>`. Key the map on the
   full ID, never on the `EVID-` prefix.
2. **Tolerate cross-stage evidence.** `GATE-SCOPE-02` (scope→rfp) is satisfied by
   `EVID-SRC-STR-SPONSOR-COMMIT` (a *strategy*-stage requirement). The join must allow an evidence
   requirement whose `stage` differs from the criterion's `fromStage` — **no `stage===` guard**.
3. **Per-requirement thresholds for multi-evidence criteria.** `GATE-PRICE-01` needs BOTH
   `EVID-SRC-PRICE-VENDOR-PRICING` (≥Available) AND `EVID-SRC-PRICE-ASSUMPTIONS` (≥Usable Evidence).
   Encode a list of `{requirementId, minState}`; ALL must reach their own threshold (strictest wins).
4. **Recommended-level evidence must not hard-block.** e.g. `EVID-SRC-RFP-VENDOR-INTEL` is
   `level: 'recommended'` — map it but never let it block promotion.
5. **Ignore the legacy `ART-AMS-*` / `GATE-AMS-*` scheme** in `artifact-gate-map.ts` — those IDs
   exist in neither canonical catalog (old `PAT_SRC_AMS_001` fixtures). Reuse its *shape*, not its IDs.
6. **No dangling refs to fix** — zero gate criteria point at a missing evidence id. Four evidence
   requirements are unconsumed (`EVID-SRC-SCOPE-ORG`, `EVID-SRC-SCOPE-FY-CONTRACT`, and two
   fuzzy/recommended ones); tag them "informational, no gate" in the map.

**Cover these stages first (most clean mappings = best positive-path demo):**
- **`scope → rfp`** (hero demo): `GATE-SCOPE-01` ↔ `EVID-SRC-SCOPE-APP-INV` (≥Usable Evidence) and
  `EVID-SCOPE-01` ↔ `EVID-SRC-SCOPE-TICKET-HISTORY` (≥Available) — the most literal label-matches
  in the catalog, and the canonical example.
- **`responses → evaluation`** (proves a no-manual-residue stage): `GATE-RESP-01` ↔
  `EVID-SRC-RESP-PROPOSALS` (≥Available), `GATE-RESP-03` ↔ `EVID-SRC-RESP-CLARIFICATIONS` (≥Loaded);
  zero manual-only criteria in this transition.
- **`transition → value`**: `GATE-TRAN-02` ↔ `EVID-SRC-TRAN-MILESTONES`, `GATE-TRAN-03` ↔
  `EVID-SRC-TRAN-KT-EVIDENCE`.

Encode at minimum `scope → rfp` + one other clean stage in this slice; `log`/comment which
criteria are intentionally left manual (no silent gaps).

---

## 1 · Why this is the right first slice

The substrate already exists. The only thing missing is the wire between two tables
that use **different ID schemes and have no join key**:

- `source_event_evidence_states` rows carry `requirement_id` (e.g. `EVID-SRC-SCOPE-APP-INV`)
  and a 7-state `current_state` ramp.
- `source_event_gate_criterion_states` rows carry `criterion_id` (e.g. `GATE-SCOPE-01`,
  `EVID-SCOPE-01`) and a `state` (`pending | met | not_met | waived | deferred`).

There is **no mapping** from an evidence requirement to the gate criterion it satisfies.
Building that mapping, deriving the assessment from it, and rendering the result is the
entire slice.

The precedent already in the repo: `src/lib/source/artifact-gate-map.ts` maps
artifact-family → criterion IDs and flips a criterion when an artifact is uploaded.
You are building the **evidence** analogue.

---

## 2 · Architecture decision (already made — do not re-litigate)

**Derive-at-read. Do NOT persist. No migration.**

- The auto-assessment is computed **at render time** from the real evidence rows the
  canvas already loads. It is a display overlay, not a DB write.
- This makes the slice **read-only** — it cannot corrupt data, cannot clobber a manual
  action, needs no migration, and is idempotent by construction.
- **Precedence rule (critical):** auto-assessment may only overlay a criterion whose
  **persisted** state is `pending`. If a human has persisted `met` / `not_met` / `waived`,
  that human action always wins and the overlay yields. A human decision is never
  overridden by the machine.
- Persisting the auto-met state as a durable audit record is a **named follow-on slice
  (Slice A2)**, not this one.

If you find yourself writing a migration, adding a DB column, or calling
`updateGateCriterion` from the assessment path — **stop**. That is out of scope.

---

## 3 · Codebase anchors (exact — read these before writing anything)

**Catalogs (canonical specs — read-only inputs):**
- `src/lib/source/canonical-specs/evidence-requirements.ts` — `SourceEvidenceRequirement`:
  `requirementId`, `stage`, `minimumState` (`Loaded|Parsed|Available|Usable Evidence`),
  `level` (`required|recommended`). `evidenceForStage(stage)` returns the list.
- `src/lib/source/canonical-specs/gate-criteria.ts` — `SourceGateCriterion`: `criterionId`,
  `fromStage`, `toStage`, `severity` (`hard|soft|informational`), `required`,
  `linkedArtifactCodes`, `ownerRole`. `criterionById(id)` exists.
- `src/lib/source/canonical-specs/index.ts` — barrel; export new helpers here.

**Per-event state (the real data, view-model types):**
- `src/lib/source/canvas-substrate/types.ts` —
  `SourceEventEvidence` (`requirementId`, `stage`, `currentState`) and
  `SourceEventGateCriterion` (`criterionId`, `fromStage`, `toStage`, `state`,
  `evidenceArtifactIds`). The 7-state ramp type is `SourceEventEvidenceCurrentState`.
- `src/lib/source/canvas-substrate/queries.ts` — **the join point.**
  `getStageSubstrate(eventId, stageKey)` returns `{ artifacts, criteria, evidence }`
  already filtered to the stage. `countGateProgress(criteria, fromStage)` is the existing
  met/total derivation — your recommendation builder extends this pattern.

**The auto-flip precedent (mirror its shape):**
- `src/lib/source/artifact-gate-map.ts` — `ARTIFACT_GATE_MAP` +
  `getCriterionIdsForArtifactFamily(family)`.

**UI surfaces (where the result renders):**
- `src/components/source/canvas/UniversalCanvasShell.tsx` — loads `stageCriteria` +
  `stageEvidence` (already in scope here, see lines ~163–226) and passes
  `states={stageCriteria}` to `<GateTab>` (~line 574). This is where you compute the
  assessment + recommendation and pass them down.
- `src/components/source/canvas/workspace-tabs/GateTab.tsx` — renders the criteria
  checklist, met/total header, and blocker list. Add the provenance badge per row and
  the Stage Decision Status panel here.

**Do NOT touch in this slice:**
- The PATCH write route `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`
  (manual flips keep working untouched — your overlay is read-side only).
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts` (no writes this slice).

---

## 4 · Build tasks

### 4.1 — `evidence-gate-map.ts` (new)
`src/lib/source/canonical-specs/evidence-gate-map.ts`

The missing join. Map each gate criterion → the evidence requirement IDs that satisfy it.
Mirror `artifact-gate-map.ts` in shape (a typed const record + a lookup function).

- Cover the criteria where evidence readiness is the real gate — start with Scope, RFP,
  Responses, Evaluation, Pricing. You do not need 100% coverage of all 11 stages in this
  slice; cover at minimum **Scope and one other stage**, and `log`/comment which criteria
  are intentionally unmapped (no silent gaps).
- A criterion with no evidence mapping is simply never auto-assessed — it stays manual.
  That is correct and safe.
- Export `evidenceRequirementsForCriterion(criterionId): string[]`.

### 4.2 — `gate-auto-assessment.ts` (new, pure)
`src/lib/source/gate-auto-assessment.ts`

A pure function, no I/O:

```ts
assessStageGate(input: {
  fromStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];   // persisted per-event criterion states
  evidence: SourceEventEvidence[];        // persisted per-event evidence states
}): GateAssessment
```

For each criterion:
- If persisted state is `met`/`not_met`/`waived` → `displayState` reflects the human
  action (`'met_manual' | 'not_met_manual' | 'waived'`); provenance = `manual`.
- If persisted state is `pending`:
  - Look up its evidence requirements (4.1). For each, find the matching
    `SourceEventEvidence` row and compare `currentState` against the requirement's
    `minimumState` using the 7-state ramp order. `Stale` and `Low Confidence` are
    **failure modes**, never satisfying.
  - All **required** evidence at/above threshold → `displayState = 'met_auto_evidence'`,
    provenance = `auto-evidence`, with the satisfying evidence requirement IDs + their
    readiness levels recorded in the result.
  - Otherwise → `displayState = 'blocked_evidence'` (if required evidence is missing/below
    threshold) or `'pending_review'` (if the criterion has no evidence mapping at all),
    with a human-readable `reason`.

Return per-criterion results plus the data the recommendation builder needs.

**Do not add confidence scores.** Confidence is retrieval-scoped (the GroundedAnswer
contract) and is out of scope. Do not invent a confidence number.

### 4.3 — `buildStageRecommendation()` (new, pure)
Same file or `stage-recommendation.ts`. Compose the assessment into:

```ts
{ status: 'ready' | 'ready_with_warnings' | 'blocked' | 'needs_review',
  reasonCodes: string[],
  requiredMet: number, requiredTotal: number,
  autoMetCount: number, manualMetCount: number,
  blockers: { criterionId, title, reason }[] }
```

- `ready` — all **hard required** criteria met (manual or auto).
- `ready_with_warnings` — hard required all met, but soft criteria unmet.
- `blocked` — one or more hard required criteria unmet with no satisfying evidence.
- `needs_review` — criteria are met-auto but unverified by a human, or evidence is
  `Stale`/`Low Confidence` (surface, don't silently pass).

### 4.4 — Wire into the shell + render
- In `UniversalCanvasShell.tsx`, compute `assessStageGate(...)` and
  `buildStageRecommendation(...)` from the already-loaded `stageCriteria` + `stageEvidence`,
  and pass both into `GateTab`.
- The met/total count and Promote-button gating must use the **derived** state (manual-met +
  auto-met), so an auto-assessed-ready stage actually shows as promotable.
- Manual **Mark met / Reopen** buttons keep working unchanged.

**UX language (use verbatim — reinforces the contract):**
`Ready to advance` · `Blocked by missing evidence` · `Ready with warnings` ·
`Auto-assessed from evidence` · `Manual override` · `Needs human review` ·
`Draft ready for review`. Avoid adding new manual checkboxes.

### 4.5 — §UX · The compact gate panel (MANDATORY layout — applies to EVERY stage)

The founder rejected a first draft that rendered the same criteria three times (blocker summary +
"N hard blockers" list + full cards) with an always-open approval textarea on every card. **Build it
this way instead** — and the same panel renders at every stage (Scope, RFP, Evaluation…), so this
layout is reused, not Scope-only. Obey the six rules in OVERVIEW §UX density contract.

Structure (one header + one list + one footer — nothing repeated):

```
┌──────────────────────────────────────────────────────────────────┐
│ ● Scope → RFP gate    Blocked · 0 of 5 cleared        [Promote ↗] │  header: dot=overall status,
├──────────────────────────────────────────────────────────────────┤        one count line, promote
│ ● Application portfolio inventoried + tiered            ea council │  ONE row per criterion:
│   Application inventory · not requested → needs usable evidence    │  - dot = status color
│                                                       [Mark met]   │  - title (one line)
├──────────────────────────────────────────────────────────────────┤  - ONE gap/action line
│ ● L2/L3 ticket history parsed              sentinel   [Mark met]   │  - owner chip (quiet)
│   Ticket history · not requested → needs available                │  - single action button
├──────────────────────────────────────────────────────────────────┤
│ ● Sponsor commitment letter on record       sponsor  [Mark met]   │  amber dot = needs review:
│   Needs human review · sponsor sign-off                           │  NO fake evidence gap,
├──────────────────────────────────────────────────────────────────┤  just the human action line
│ ● Scope memo signed by sponsor + EA         sponsor  [Mark met]   │  many-input criterion:
│   4 inputs not ready · see what's missing                         │  collapse to a count + link,
├──────────────────────────────────────────────────────────────────┤  NOT all four inline
│ → Next: RFP needs an approved legal template     Open Workspace ↗ │  footer: one look-ahead line
└──────────────────────────────────────────────────────────────────┘
```

Rules specific to this panel:
- **Dot colors:** red = `Blocked by missing evidence`, amber = `Needs human review`, green = met
  (manual or `Auto-assessed from evidence`). The dot is the status — do not also render a state
  badge + a reason sentence + a label on the same row.
- **The gap line is derived, one line:** for evidence-blocked criteria show
  `<evidence label> · <current state> → needs <minimum state>`; for review-only criteria show
  `Needs human review · <what the human confirms>`. For a criterion with multiple unmet inputs,
  show `N inputs not ready · see what's missing` (expand on click) — never list them all inline.
- **Approval reason is collapsed.** The "what evidence did you review / why is this gate ready"
  textarea appears ONLY after the user clicks **Mark met**, on that one row, and collapses again on
  cancel/confirm. It is never pre-rendered open, and never shown for more than one row at a time.
- **Detail on demand:** criterion ID (`GATE-SCOPE-01`), full description, and full owner role live
  in a hover/expand affordance — present for audit, off the default glance.
- **No second list.** The rows ARE the blockers — do not also render a separate "N hard blockers"
  summary. The header count (`0 of 5 cleared`) is the only summary.

---

## 5 · Tests (required)

Pure-function tests — fast, no DB. Put in
`src/lib/source/__tests__/gate-auto-assessment.test.ts`.

1. Required evidence at/above threshold + criterion `pending` → `met_auto_evidence`.
2. Required evidence below threshold → `blocked_evidence` with a reason.
3. Required evidence `Stale` or `Low Confidence` → NOT satisfied (failure mode).
4. **Precedence:** criterion persisted `not_met` by a human + evidence above threshold →
   stays `not_met_manual` (human wins, no auto-override).
5. Criterion with no evidence mapping → `pending_review`, never auto-met.
6. `buildStageRecommendation`: all-hard-met → `ready`; soft unmet → `ready_with_warnings`;
   hard unmet → `blocked`.
7. `evidence-gate-map`: every mapped criterion ID resolves to a real criterion in the
   canonical catalog (no dangling IDs).

Run before reporting:
```
npx tsc --noEmit
npx eslint src/lib/source/ src/components/source/
npm run test:behaviors    # or the targeted source test path
node scripts/release-check.mjs --base origin/main --head HEAD
```

---

## 6 · Browser verification — THE HARD GATE (do not skip; do not fake)

Code-complete is not done. **Done = you navigated the real app and saw it work.** If you
cannot run a browser, say so explicitly and hand back the exact steps + expected result —
do not report success.

**Test target:** SkyHarbor Air, event `affa4231-eecd-4019-9b76-06bb8d324988`
(`SKYH-MANAGED-SERVICES-TOWER-2026`), tenant `skyharbor-air`. Strategy-at-P0 flags are
already live on ACA.

**Positive-path requirement (important):** to *see* an auto-met criterion, at least one
required evidence requirement on the stage under test must be at/above its `minimumState`.
Before verifying:
1. Open the event's **Evidence** tab and check whether any Scope evidence row is already
   at `Available`/`Usable Evidence`.
2. If none is, bump one Scope evidence row to its threshold (via the evidence tab control,
   or a scoped dev-only update on `source_event_evidence_states` for this one event) so the
   positive path is demonstrable. Note in the PR exactly what you set.

**Walk and screenshot:**
1. Open the event → **Gate** tab for the Scope stage.
2. Screenshot: a criterion rendered **`Auto-assessed from evidence`** (a green/met state the
   human did not click), with the satisfying evidence named.
3. Screenshot: the **Stage Decision Status** panel showing `Ready to advance` /
   `Blocked by missing evidence` with reason codes — not an empty box.
4. Screenshot: a criterion still **`Blocked by missing evidence`** with its reason, proving
   the negative path.
5. Confirm: manually Reopen an auto-met criterion's linked evidence (or a manual Mark-met)
   still behaves — the human action is respected.

If any screenshot can't be produced, the PR is `code-complete`, not `click-verified`. Label
it honestly.

---

## 7 · Out of scope (do NOT build — these are later slices)

- **Slice A2** — persisting auto-assessment as a durable audit record (needs the
  `updateGateCriterion` adapter to write `notes`/`evidence_artifact_ids`; the columns exist
  but a write path + idempotency + override-protection is its own slice).
- **Slice B** — auto-draft on stage entry (scope memo, RFP, scorecard, exec brief…).
- **Slice C** — approval routing foundation (resolve label strings → people + records).
- **Slice D** — archetype-specific RFP branching (audit first).
- **Slice E** — vendor response ingestion boundary.

Touching any of these widens the diff past what can be verified in one click-through. Don't.

---

## 8 · Reporting contract (your final message must include)

- **Files changed** — every path, grouped new vs modified.
- **Behavior added** — in plain English, what a CXO now sees that they didn't before.
- **Verification status** — `click-verified` (with screenshots/described observations) or
  `code-complete` (with the exact nav steps + expected result for the human to run).
- **What I did NOT do** — confirm Slices A2–E were not started.
- **Known limitations** — evidence-gate-map coverage (which stages mapped, which deferred),
  any stage where the positive path couldn't be demonstrated and why.
- **Exact next slice** — recommend Slice A2 or Slice B with a one-line rationale.

---

## 9 · Boundaries (verbatim, non-negotiable)

- No DB migration. No new columns. No writes from the assessment path. Derive-at-read only.
- A human-persisted criterion state is never overridden by auto-assessment.
- Do not fake confidence scores; confidence is out of scope.
- Do not claim `click-verified` unless you actually ran the browser and saw it.
- Keep the existing manual gate workflow working; add automation on top, remove nothing.
- Branch: `codex/source-decision-engine-slice-a`
- PR title: `Source Decision Engine · Slice A: evidence→gate auto-assessment + Stage Decision Status`

**Success looks like:** open the Scope gate on the SkyHarbor Air event and — without
clicking a single checkbox — see a criterion marked *Auto-assessed from evidence* and a
Stage Decision Status that says *Ready to advance* or *Blocked by missing evidence* with the
reason. That is the whole slice.
