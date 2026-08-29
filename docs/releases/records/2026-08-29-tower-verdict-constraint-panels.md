# 2026-08-29-tower-verdict-constraint-panels — First two panels of the Command Center redesign

## Release ID

`2026-08-29-tower-verdict-constraint-panels`

## Status

`candidate`

## Plain-English Summary

The first two panels of the approved Tower Command Center design, ported. They are also the
reference implementation the remaining panels are written against, so the conventions here are the
contract rather than a preference.

Three rules govern them:

1. **Every figure binds to the view model.** The design carries `$1.05B`, `$211.8M`, `$677.8M` and
   `$13.1M` as sample values. Rendering those would ship a page that reads correctly and means
   nothing. A test asserts none of them can appear.
2. **Absence renders as absence.** A null budget shows "Not loaded", never `$0`. A count of zero is
   never a success state.
3. **No finding is asserted that the live data has not earned.** The design states its findings as
   fact because they were true of its sample data. Anything that makes a claim about the data is
   derived at render time and says something different when the claim does not hold.

`ConstraintPanel` is the worked example of the third rule. The design states flatly that "every bar
is a single colour, and that is the finding" — gating constraint and finance status being the same
field twice, so the constraint is the outcome relabelled. That is true of the data it was drawn
against. The moment one constraint spans two outcomes the sentence is false while still reading as
authoritative, so the mapping is computed: the strong claim renders only when every constraint
really does resolve to one status, and otherwise the panel says the constraint carries information
the status does not. A portfolio with no constraint recorded says so rather than drawing an empty
chart.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 (products — Tower):** two new presentation components. Neither is wired into a route,
  so no rendered surface changes.
- **App read path:** `financeStatus` is carried onto `TowerAiView`. The attribute widening took it
  as far as the mart; the status chart needs it on the view.

## Client Applicability

- All clients: no rendered change yet — these are components, not routes.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/VerdictPanel.tsx` (new)
- `src/components/tower/command-center/views/ConstraintPanel.tsx` (new)
- `src/components/tower/command-center/__tests__/verdict-panel.test.tsx` (new)
- `src/components/tower/command-center/__tests__/constraint-panel.test.tsx` (new)
- `src/lib/tower/command-center/types.ts`, `view-model.ts` — carry `financeStatus`

## QA / Validation

- 13 new tests, all passing: 6 Verdict, 7 Constraint. The Constraint suite pins all three states —
  claim holds, claim withdrawn, no constraint data at all.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 126 pass / 21 fail
  across 6 suites. Baseline on `origin/main`: 21 fail across 6 suites. Identical; the +13 are this
  change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on all changed files → clean.
- Charts use Recharts, already a dependency and already used by `ContractTabs.tsx`.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change. Nothing renders differently until a shell-integration change mounts the
panels.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Live signed-in proof required: not yet applicable — no route renders these. Required at shell
  integration.

## Rollback Plan

Revert the squash commit. The components are unreferenced, so removing them changes no behaviour.

## Audit Evidence

- The six-file diff.
- New-suite output and the baseline comparison above.

## Known Gaps

- **Not wired into any route**, deliberately. Shell integration is separate.
- Both render against whatever assessment the Tower reader selects. Until the widened package is
  the newest load, they show the older dataset.
- 30 of the design's 32 panels remain; eight more are in a separate change.
