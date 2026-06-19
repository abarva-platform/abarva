# Deliverable Transformation — Workstream Reconciliation

> Companion to `DELIVERABLE_SYSTEM_CURRENT_STATE_ASSESSMENT.md`. Reconciles the three
> in-flight workstreams that all touch the Move business-case / roadmap / economics surface so
> they **converge** instead of multiplying duplication. Founder-approved 2026-06-19.

## The problem this note prevents

AbarVa has a recurring **"two of everything"** pattern, confirmed three times this session:

1. **Two deliverable stacks** — the orchestrator (prose DOCX, shipped the First Capital arc) vs
   the expert-kernel `board-grade/*` (SVG exhibits + PPTX, siloed). See the assessment §0.
2. **Two Tower substrates** — `enterprise_context_*` vs `ai_control_*` (the FC Intelligence
   brief §4f durable fix).
3. **Two business-case paths** — confirmed by import graph:
   - `move-business-case.ts` → `load-move-business-case-input` → `/api/v1/moves/board-grade-*`
     route family (**expert-kernel; already has exhibits**).
   - `orchestrator/briefs/deliverable-structures.ts` `business_case` → the prose generator.

Three independent workstreams are about to deepen **both halves** of #3:

| Workstream | Touches | Risk if run independently |
|---|---|---|
| **A. Deliverable Transformation** (this spec) | rebuilds the **orchestrator** business-case/roadmap toward exhibit-led | a 2nd economics-bearing, exhibit-led business case |
| **B. Workforce Economics** (`WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md`, WE-3) | binds estimate-twice into **`move-business-case.ts`** (expert-kernel path) | economics on one path only; orchestrator path still blind |
| **C. First Capital Intelligence** (`FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md`) | deepens typed-fact evidence + retires the dual Tower substrate | strengthens evidence A/B read, but on its own timeline |

Run as written, A and B produce **two** economics-bearing business cases — the exact drift the
transformation exists to remove.

## The fix: one keystone object — `MoveDecisionModel`

All three converge on the `MoveDecisionModel` (spec §4). It is the single source of truth that:

- **consumes governed evidence** (today's retrieval; deepened later by **C**'s typed facts),
- **consumes the WE estimate** (the **B** economics engine, WE-1/WE-2 output) as its Value Model +
  estimate-twice,
- **produces the answer-first decision content** that **A**'s Story Director / Visual Director
  render as an exhibit-led executive deck.

```
   C (typed-fact evidence) ─┐
                            ├──▶  MoveDecisionModel  ──▶  A (Story+Visual Director) ──▶ deck
   B (WE estimate engine) ──┘        (single SoT)              renders WE via existing
                                                               economic exhibits (svg-charts)
```

## Convergence is nearly free — the exhibits already exist

The WE estimate-twice outputs map **1:1** onto exhibits already built in
`expert-kernel/exports/board-grade/svg-charts.ts`: **investment waterfall · cost stack ·
gross-to-net value bridge · payback range curve · sensitivity tornado · phased-roadmap swimlane.**
So WE needs no new visuals — it needs to feed the Visual Director. The spec §9 **P4 business case
leads with the estimate-twice value bridge** as its hero exhibit.

## What changes in the briefs (amended in this PR)

- **WE brief:** WE-1/WE-2 (economics engine) stay as-is — conflict-free, build now. **WE-3/WE-4/WE-5
  are re-framed**: do not patch two generators; the unified business-case/roadmap archetype
  consumes the WE estimate via `MoveDecisionModel` and renders through the existing economic
  exhibits. WE-1 drift-prevention hardened (emit a constants JSON from the Python builder; the `.mjs`
  reference was stale — the builder is `build-workforce-taxonomy.py`).
- **FC Intelligence brief:** the baseline fact-count discrepancy (192 vs 4,484) flagged for
  reconciliation before P3 runs; a column-contract test added for the Tower projection MV.

## One grounding contract, not three

A, B, and C all reuse the same **structured-first → corpus-second → LLM-third → cite-or-refuse**
contract (`source-answer-engine.ts` / `healthcareAnswerContract.ts`). The transformation's
anti-fabrication gate (which correctly blocked the financial deliverables on 2026-06-19) is the
same principle. Three engines must not diverge on "what counts as cited."

## Sequence (founder-approved)

1. **WE-1 / WE-2** — economics engine (conflict-free; emit `workforce-economics.constants.json`).
2. **Transformation PR1 — `MoveDecisionModel`**, built **as the convergence point** (consumes
   evidence + WE estimate + value model). The keystone that retires "two of everything."
3. **Transformation PR2–PR8** — business-case/roadmap archetypes consume WE via the model and
   render via the existing economic exhibits; **collapse the two business-case paths to one**
   (this absorbs WE-3/WE-4/WE-5).
4. **FC Intelligence P3–P5** — when the client-dataset upgrade lands (already paused on it); it
   deepens the evidence the `MoveDecisionModel` reads.
