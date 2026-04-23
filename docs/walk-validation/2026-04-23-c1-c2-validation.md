# Morrison C1 + C2 Spot-Check Validation

**Request:** §6.1 of the Category 1/2 handoff · "Ten-minute check. High leverage. Prevents downstream defect compounding."

**Timing:** Ran retroactively (C2 already shipped via PR #126) but defect caught before anyone rendered D04 in production. Still net-positive.

## Checklist

| Check | Result |
|---|---|
| `_timeline.json` exists with Phase 1 key decisions populated | ✓ · 19 decisions, 9 in Phase 1 window, ordered chronologically |
| `_evidence-base.json` exists with entries for every E-citation in D01-D04 | **✗ → ✓** (fix below) |
| `_evidence-base.json` covers all E-citations in C2's D07-D11 | ✓ · E20-E32 all present |
| D04 (most citation-heavy file) resolves | ✓ after fix |
| Composite stakeholder names consistent across D01-D04 | ✓ · Marcus T., Katherine P., Diane R. appear canonically; no drift variants |
| Timeline chronology coherent (phase windows + ordered dates) | ✓ |
| D01 charter renders all 12 Rich components | **⊘ not validated** — needs a dedicated render-time check against `DeliverableRenderModel` contract; flagged for follow-up |

## Defect found + fixed

**D04 Intake Synthesis cited E10, E11, E12 — those entries were missing from `_evidence-base.json`.**

Root cause: C1 ran before the E-range convention was written into the sub-agent prompts. C1 used E1-E9 then jumped forward cited E10-E12 without appending the entries. C2 correctly stayed in E20-E32 (the range the C2 prompt explicitly reserved). The gap between E9 and E20 was never filled.

**Fix applied (this branch):** added 3 entries to `src/content/deliverables/apex-retail/morrison/_evidence-base.json`:

- **E10** · Marcus T. (CFO) sponsor interview 2026-01-15 · "margin compression is upstream, not a pricing failure · pricing action off the table"
- **E11** · Katherine P. (CMO) + Lena G. (Brand Strategy) interviews 2026-01-16, 2026-01-21 · "15%-per-category SKU depth cut is the consumer tolerance"
- **E12** · Reese A. (VP Merchandising, Owned Brand) interview 2026-01-17 · "category leads protect SKU counts; 40% long-tail cut achievable"

All three entries:
- Type `interview_transcript`
- `evidence_confidence: high`
- `first_cited_in: D04`

Verified: every E-citation in every Morrison markdown file now resolves. Meridian Ambient (C5 · E1-E19) was spot-checked in the same pass — clean.

## Post-fix citation status

```
Morrison (9 files · 62 unique citations): ALL RESOLVE ✓
Meridian Ambient (4 files · 54 unique citations): ALL RESOLVE ✓
```

## Follow-up (next cycle)

- **D01 render-component check** · write a Jest test that renders `D01-d01-program-charter.md` through `DeliverableTierRenderer`'s Rich body and asserts the 12 component regions fire. Currently only inferred from structural inspection.
- **Automate this validation** · fold the `_evidence-base.json` resolution into the existing `integrity:evidence-citations` test so CI catches the next gap before merge.
- **Prompt-template fix** · update the sub-agent prompt templates so the next Cx agent is told both their range AND expected to append entries when they cite new IDs. C1's prompt didn't explicitly say this.

## Integrity rollup

- Morrison spine: 9 deliverables (D01-D04 + D07-D11 + D17) · all citations resolve · timeline coherent
- Meridian Ambient: 4 deliverables (D01-D04) · all citations resolve
- Total content spine shipped to main after #126 lands: 13 rich deliverables, 116 unique citations

## §6.2 + §6.3 acknowledgement

- **6.2 Priority re-confirmation** · acknowledged. Current Claude Code focus: finishing Priority 1 (provisioning — only item left after Export + Upload), then Priority 2 (workflow movement). Orchestration gaps stay deferred until cycle 1 findings.
- **6.3 Codex zones** · I will not touch `src/testing/*`, `scripts/create-test-users.ts`, or any test-harness paths. Will flag if I accidentally do.
