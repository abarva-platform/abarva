# Codex Brief — Repair the blocked SkyHarbor IROPS deliverables to *honest* client_ready

## 0. Objective

Get the **five blocked SkyHarbor IROPS deliverables** to **client_ready** — the RIGHT way: by making
**generation honest-by-construction** (never assert an unsupported number/date/value as fact), not by
scrubbing numbers once. A blocked artifact is an *unfinished* artifact, not a delivered one. The move
is **not client_ready until all five come back client_ready AND honest.**

Do NOT fabricate, infer, or hand-edit numbers to force a pass. The fix is upstream in generation:
**ground it, label it an assumption, route it to Open Inputs, or downgrade the artifact's mode.**

## 1. Current state (from the end-to-end run)

- Move: `450e0f12-7703-436b-97fc-f2f1712c094b` (SkyHarbor Air, IROPS), reached P5; PR **#3816** open.
- The quality controls (the existing anti-fabrication gate + the new Deliverable Quality Contract)
  correctly **blocked** five deliverables for **unsupported numeric/date/value claims**:
  - P3 Sourcing Strategy
  - P4 Execution Roadmap
  - P4 Business Case
  - P4 Financial Model
  - P5 Value Measurement Contract
- These were NOT marked client-ready — correct. But they must now be **repaired and regenerated
  clean**, not left blocked.

## 2. Root cause (fix here, not at the gate)

Generation asserted numbers/dates/$/% **as facts** that nothing in the uploaded SkyHarbor evidence
supports (e.g. "$8.5M benefit", "12-week rollout", "40% productivity gain"). The gate is the
**backstop**; the defect is that generation is **not honest-by-construction.** The cure is upstream.

Every flagged claim is one of two modes:
1. **Grounded-but-uncited** — the number IS in an uploaded evidence file but generation didn't cite
   it → a **grounding/retrieval** fix (cite it).
2. **Genuinely absent (a projection)** — no evidence supports it → generation must **not** state it as
   fact: mark an **explicit assumption**, route to the single **Open Inputs Required** table, or
   **downgrade the artifact's mode**.

The blocked five are mostly mode #2 — which means the **mode-downgrade / assumption discipline isn't
being applied at generation time.** That is the actual bug.

## 3. The fix — three layers

### 3a. Generation honesty discipline (prompt + pass level)
In the orchestrator generation passes (`src/lib/deliverables/orchestrator/` — `prompt-builder.ts`,
`model-caller.ts`, the pass definitions) enforce, by instruction and by post-pass validation:
- **No number, date, currency, or percentage may appear as an asserted fact without a citation to
  uploaded/governed evidence.** Otherwise it must carry an explicit assumption marker OR move to the
  one **Open Inputs Required** table.
- **Number-heavy artifacts auto-downgrade mode** when finance-grade inputs are absent (reuse
  `resolveBusinessCaseMode` in `src/lib/deliverables/quality/transformation-gates.ts`): Business Case
  → **Business Case Readiness Memo**; only produce a full Business Case / Financial Model when
  baseline + cost + benefit (+ sensitivity) inputs exist.
- One consolidated Open Inputs table — never repeated placeholders.

### 3b. Closed-loop repair (use the gate's findings to drive regeneration)
Make blocking **self-correcting**: when the anti-fabrication gate / quality contract blocks, feed the
**specific flagged claims** back into a targeted rewrite pass (revive/extend the existing
`board_grade_rewrite` pass) that, per claim, **cites it / converts to a labeled assumption / routes to
Open Inputs / removes it**, applies the mode-downgrade, then **re-assesses**. Loop up to ~2–3 times;
if still blocked, leave it **honestly blocked with a precise per-claim reason** — never fake a pass.

### 3c. Per-artifact target client-ready forms
None of these should remain a *block*; each has an honest, finished form:

| Blocked artifact | Honest client_ready form |
|---|---|
| **Business Case** | **Business Case Readiness Memo** — value *hypothesis* + the missing finance-grade inputs in one Open Inputs table; no fabricated $ figure. A finished, presentable artifact. |
| **Financial Model** | **Omitted** (not faked) until finance-grade inputs exist — state explicitly, don't "block". |
| **Execution Roadmap** | Real gates/dependencies/owners; timelines as **labeled assumptions** ("indicative ~12 weeks, pending capacity confirmation"), no asserted dates as fact. |
| **Value Measurement Contract** | Defines **how** value is measured (metric / owner / source / method / cadence) — never asserts a benefit value; value = TBD-by-measurement. |
| **Sourcing Strategy** | Options + evaluation criteria + recommendation; costs as **ranges/assumptions**, not sourced figures it doesn't have. |

## 4. Triage procedure for the current five

For each blocked artifact: **open its quality report**, list **every flagged numeric/date/value
claim**, and classify each into:
- **cite** — it exists in an uploaded SkyHarbor evidence file (`datasets/skyharbor-air-synthetic-v4/`
  or the move's uploaded inputs) → wire the citation;
- **assumption** — defensible projection → explicit assumption label;
- **open input** — needed but absent → the single Open Inputs Required table;
- **remove** — not needed → cut it.

Then **regenerate** the artifact with the §3 discipline and **rerun the quality controls until
`client_ready`.** Verify `generated_artifacts.quarantined = false` and `quarantine_reason = null`.

## 5. Acceptance (report honestly, per artifact)

- All five → **client_ready AND honest**: every surviving number is cited or explicitly labeled an
  assumption; mode-downgrade applied where finance-grade inputs are absent; one Open Inputs table; no
  fabricated value/ROI/NPV/date.
- For each, show the quality report **before → after** with exactly **what changed per claim**
  (cited / assumed / open-input / removed) and the final state.
- Re-confirm P1–P5 gate flow intact; the previously-passing P5 Handoff Package unaffected.
- Tests / lint / release-check / deploy checks green. (The pre-existing unrelated
  `governance-evaluate-gates.test.ts` mock-missing-`.in()` issue is out of scope — leave noted.)

## 6. Hard constraints (the bar)

- **Never** mark client_ready what isn't; **never** fabricate or hand-insert a number to pass.
- If a number can't be grounded or honestly assumed, it is **removed or routed to Open Inputs** — the
  artifact downgrades rather than fakes.
- The goal is artifacts that are **both truthful and client-ready** — a Readiness Memo that names its
  gaps IS a finished, deliverable artifact; a blocked Business Case is not.
- Report the genuine end state per artifact, including anything that remains honestly blocked.

## 7. Code map

- Generation passes / prompts: `src/lib/deliverables/orchestrator/{prompt-builder,model-caller}.ts`,
  pass defs + `generate-service.ts`.
- Anti-fabrication / quality: the orchestrator quality validator + `quality/consulting-grade-rubric.ts`.
- Deliverable Quality Contract + mode-downgrade: `src/lib/deliverables/quality/`
  (`deliverable-quality-contract.ts`, `assess-deliverable.ts`, `transformation-gates.ts` →
  `resolveBusinessCaseMode`).
- Persistence/enforcement: `src/lib/deliverables/orchestrator/persistence.ts`.
