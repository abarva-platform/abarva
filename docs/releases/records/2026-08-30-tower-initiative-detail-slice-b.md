# Tower — the finance trail and the evidence card

## Release ID

`2026-08-30-tower-initiative-detail-slice-b`

## Status

`candidate`

## Plain-English Summary

Two canonical files existed and the Layer 4 build had never opened them:
`canonical_finance_approval_events.csv` (84 rows, covering all 42 cases) and
`canonical_evidence_items.csv` (196 rows, 42 of which belong to a case).

They carry the two sections the approved design leans hardest on.

**The finance trail.** A case reading "nothing validated" is a statement about a total. The trail
turns it into a sequence with dates, amounts, bases and approvers — and what it shows on this
tenant is that of 84 events, only **eight** are an `actual_validation`. Forty-two cases have a
sponsor claim; eight have a validation. The drill-down can now say that the step between a claim
and the board number is a person nobody has named, which is the design's whole argument and was
previously unsayable from the data the drawer held.

**The evidence card.** All 42 case evidence items are `current`, owned, and carry a stated
confidence — eleven low, twenty-one medium, ten high. The design's reading is that a case can hold
current, high-confidence evidence and still prove nothing, because a business case workbook
describes the plan rather than the result. Rendering freshness and confidence next to the item is
what makes that visible.

Amounts are carried as recorded. Twenty-eight of the eighty-four events record a literal `0` and
none is empty, so a zero is a stated amount and not a gap; rendering it as absent would invent one.

## Layer Impact

Lane: `global-control-lane` — shared behaviour for all clients, not feature-gated. Layer 4 loader,
Layer 3 reader, view model and one drawer. No canonical or Layer 1 change: both files already
existed and were simply not read.

## Client Applicability

**All clients**, per tenant at that tenant's next Layer 4 load. A tenant loaded before this ships
sees both new sections report that nothing is recorded, which is accurate for its stored payload.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — read both files, group them, emit onto
  the case payload.
- `src/lib/tower/readTowerCommandCenter.ts` — `financeApprovalEvents` and `evidenceItems` helpers.
- `current-layer-view-model.ts`, `command-center/types.ts`, `command-center/view-model.ts` — carry
  them.
- `drawers/AiInitiativeDrawer.tsx` — two sections.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — five guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 65/65, five new guards |
| Tower suites | PASS against baseline — failing set identical to `origin/main` |
| `tsc --noEmit` · `eslint` | PASS — clean |
| Join keys verified against real data | PASS — 84/84 finance events join to a case; 42/196 evidence rows are case-scoped and each of the 42 cases has exactly one |
| Generated SQL inspected | PASS — both arrays emitted with real values |
| Live proof | NOT RUN — needs a Layer 4 reload. |

One guard pins the `related_object_type === "business_case"` filter. Without it, 154 rows pointing
at projects and monthly observations would hang off cases they do not describe.

## Rollout Plan

Merge. Reaches a tenant at its next Layer 4 load through the existing governed job path.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The load runs through the governed ACA
Job wrapper with its existing gates.

## Rollback Plan

Revert. The payload keys become unread and the two sections disappear. No stored value changes.

## Known Gaps

- **Not live until a reload**, as with the previous slice.
- **Still not carried:** the money row's spent-to-date and forecast variance, and the operating
  metric's baseline, target and captured points. Those are in Layer 1
  (`09_programs_initiatives`, `14_metrics_outcomes`) and genuinely do not exist in the canonical
  layer, so reaching them means extending canonical — a change at the adapter boundary rather than
  in a product surface.
- `canonical_budgets.csv` is domain-level, not per case, so it does not answer the drill-down's
  money row. It may serve the budget tab.
- The drawer lists every finance event. A case with a long trail is not truncated; today the
  maximum is two.

## Audit Evidence

Join coverage and value distributions were measured directly against the canonical files before
any code was written: 84/84 finance events joinable, event types `sponsor_claim` 42,
`target_review` 34, `actual_validation` 8; evidence confidence low 11, medium 21, high 10, all
`current`. A sponsor-claim row reads `2026-06-15 · $65.58M · projected_annual_value_high ·
VP Enterprise Platforms`, which is the design mockup's finance-trail line verbatim.
