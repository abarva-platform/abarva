# Explain drawer: the gate headline counts the criteria it heads

## Release ID

`2026-10-05-explain-drawer-gate-summary-counts`

## Status

Proposed — merged behind no flag; correctness fix on an already-live surface.

## Plain-English Summary

The "Explain" drawer is the audit surface behind a synthesis quote. A reader
opens it to see, rule by rule, what the product actually established before it
said something. At the top of the drawer sat one line summarising the gate
criteria. Underneath it, the drawer lists every gate criterion at every stage,
each with its own status.

That one line was wrong in four independent ways at once.

**It counted a different set from the list it headed.** The line was built from
the synthesis context's own gate summary, which is computed for the *current
stage only*. The list below it is built from every criterion at every stage —
the API route says so in its own comment, because the complete rule-by-rule
trace is the point of the drawer. So on any governing pattern with more than
one stage, the headline's denominator counted a subset of the body, and said
nothing about which subset. No special data was needed to see this; it was the
normal reading.

**It reported a waived criterion as met.** The upstream count is "met OR
waived", because for the question *can this advance?* a waiver does clear a
gate. But the drawer asks a different question — *what was established?* — and
for that question a waiver is the opposite of evidence: it records that nobody
checked. The headline said "met" over a body that showed the row as waived.

**It reported a partly-evidenced criterion as unmet.** The upstream count
derives unmet as "total minus met", so every status that is not met-or-waived
falls into unmet. A criterion the evaluator scored `partial` was counted as
unmet in the headline while the body rendered it amber and labelled it partial.

**Its noun could not agree with its figure.** The line opened with the fixed
plural `Gates:` welded to a count whose `1` is reachable — one synthesis
context builder constructs a one-criterion summary literally — so
`Gates: 1 of 1 met` was a reading this surface could produce.

The fix is the one this class of defect keeps needing: derive the figure from
the same set the body renders, and make the line state what it counted. All
four counts are now a partition of one status list, so the clauses always
reconcile to the total and the headline cannot contradict the rows beneath it.
The line now reads, for example, `1 of 5 gate criteria met · 2 partial ·
1 waived, not met · 1 unmet`, and when nothing was evaluated it says
`No gate criteria evaluated` rather than `0 of 0 met`, which reads as a
measured all-clear.

The upstream count is deliberately left alone. The provenance ribbon and the
health board ask the advancement question, and "met or waived" is the right
answer for them. Conflating the two questions in one number was the defect;
the two surfaces now each compute the one they mean.

## Layer Impact

Lane: `global-control-lane` — a correctness fix to a client-visible figure on
a surface that is not feature-flagged, so it reaches every client that can
reach the drawer. No new flag is introduced.

- `4 PRODUCTS`: the gate summary line in the shared Explain drawer, reached
  from the programs, Source and Tower synthesis quotes. One line of rendered
  text changes. No gate rule, no advance rule, no persistence, no permission
  check and no API route logic changes.
- `3 CANONICAL MODEL`: unchanged. No schema, no migration, no stored value.
  `SynthesisContext.gatesSummary` keeps its existing shape and meaning exactly,
  including the "met or waived" definition of its `met` field, because its
  other consumers depend on that meaning.
- `2 SOURCE ADAPTERS` / `1 CLIENT INTAKE`: untouched.

The serialized explanation payload's `gateSummary` object gains two fields
(`partial`, `waived`) and its `met` field narrows to strictly-met. That object
has exactly one consumer, the drawer line, which is changed in the same commit.

## Client Applicability

- All clients: Yes. The Explain drawer is not feature-flagged, so any client
  who can open a synthesis quote's Explain pill sees the corrected line.
- Specific clients, selected by feature flag: Not applicable — no flag gates
  this surface.
- Internal only: No.
- Public/demo: No.

What a reader will notice: the headline's denominator grows on any multi-stage
pattern, because it now counts the criteria actually listed below it; a
partly-evidenced criterion stops being lumped into the unmet count; and a
waived criterion stops being counted as met. The last of those removes a
reassurance a reader may have been relying on. That is intended — the drawer's
whole purpose is to show what was established, and a waiver establishes
nothing.

## Changes Included

- `src/lib/reasoning/gate-summary-line.ts` — new. The pure decision:
  `countGateStatuses` partitions a gate-status list into met / partial /
  waived / unmet, `gateCriterionNoun` agrees the noun with its figure, and
  `buildGateSummaryLine` renders the line, naming every status that is present.
  The module header records all four original defects and why the upstream
  count may not be reused.
- `src/lib/reasoning/explanation-serializer.ts` — the payload's `gateSummary`
  is now `countGateStatuses(gateEvaluations)`: counted from the evaluations the
  same payload renders as `gates`, instead of from the context's current-stage
  summary. The payload type is widened accordingly.
- `src/components/_shared/ExplainQuoteDrawer.tsx` — the summary bar renders
  `buildGateSummaryLine(payload.gateSummary)` instead of inlining its own
  template. Design-locked palette and typography untouched; no layout change.
- `src/lib/reasoning/__tests__/gate-summary-line.test.ts` — new, 13 cases.
- `src/lib/reasoning/__tests__/explanation-serializer.test.ts` — 5 cases added
  pinning the set the headline counts and the partition property.

No feature-flag registry change, so no manual regeneration was required. No CI
catalog entry and no coverage-census change: see QA for why.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath
  src/lib/reasoning/__tests__/gate-summary-line.test.ts
  src/lib/reasoning/__tests__/explanation-serializer.test.ts --runInBand`:
  2 suites, 26 tests, 26 passed.
- **PASS** — the whole reasoning suite directory, `npx jest
  src/lib/reasoning/__tests__`: 59 suites, 777 tests, 777 passed. Run as a
  directory because the payload type changed, so the preservation evidence is
  the sibling suites that read the same payload, not only the two edited ones.
- **PASS** — the two gate-drawer integration suites,
  `src/__tests__/integration/programs/programs-detail-prog21-gate-drawer.test.ts`
  and `gate-ribbon-view.test.ts`: 2 suites, 98 tests, 98 passed. These cover the
  ribbon, whose number is deliberately unchanged.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit code 0.
- **PASS** — `npx eslint` over all five changed files, exit code 0.
- **PASS** — mutation check of the new guards, 5 mutations, 5 deaths, each
  restoring one of the four original defects:
  1. waived counted as met (the original `metCount`) — **3** red.
  2. partial folded into unmet (the original `total - metCount`) — **3** red.
  3. the criterion noun forced to the fixed plural — **2** red.
  4. the empty reading renders `0 of 0 … met` — **1** red.
  5. the serializer takes the context's current-stage total again — **3** red.
- **NOT RUN** — no signed-in walk. The drawer opens on an Explain pill behind a
  synthesis quote and fetches `/api/reasoning/explain`; proving the corrected
  line live needs the deploy that carries this change. Owed, named in Known
  Gaps.
- **NOT RUN** — no phone-width measurement. jsdom does not lay out, and the
  line can grow by up to two clauses, so it may wrap differently on a narrow
  viewport.

**On the CI catalog and the coverage census: deliberately unchanged, and
measured rather than assumed.** The new suite is reached by the required status
check `Typecheck + reasoning-layer tests` (`reasoning-layer-guard.yml`), which
runs `npx jest src/lib/reasoning` on every pull request with no `paths:`
filter. This was measured, not inferred: regenerating the census with the new
suite present and no catalog entry gives `coveredTestFiles` 2535 against a true
base of 2534, with `uncoveredTestFiles` flat at 164 — that is, the suite counts
as covered with nothing added to the catalog. A catalog entry was written
first, then removed once the measurement showed it to be redundant and its
explanatory comment to be false.

## Rollout Plan

Squash-merge to `main`. The change is a render-time correction with no flag,
no migration and no API contract change, so it ships with the next ACA main
deploy under the repo-owned deploy workflow. Nothing to enable and no tenant
to enrol.

## Rollback Plan

Revert the single squash commit. The change is five files, additive except for
one replaced render expression, and it introduces no persisted state, so a
revert restores the previous line exactly. `SynthesisContext.gatesSummary` was
never modified, so no other consumer needs reverting alongside it.

## Deployment Authority

Deployed only by the repo-owned ACA main deploy workflow
(`.github/workflows/aca-main-deploy.yml`) after squash merge to `main`. No
ad-hoc `az containerapp update`, no traffic shift, no revision weight change
and no registry push from this branch. This record does not claim the change
is live; the signed-in proof is owed and recorded as a gap.

## Known Gaps

- **The signed-in walk is owed.** It needs the deploy that carries this
  change, and it should be read against a multi-stage pattern, because the
  set-mismatch half is invisible on a single-stage one.
- **The waived-counted-as-met half is a construction correction today, not a
  proven client reading.** The evaluator returns `waived` only for an evidence
  map carrying its `<criterionId>_waived` sentinel key; the operated waiver
  route keeps its own in-memory store and does not feed that evidence map. So
  no reader is currently being shown a waiver as met. It is corrected because
  the status exists in the type, the evaluator implements it, the drawer body
  renders it with its own colour, and the next change that wires the waiver
  store to the evidence map would otherwise ship the false claim with it. The
  set-mismatch and partial halves, by contrast, are reachable on ordinary data.
- **The drawer still does not say which stage a count belongs to.** The
  headline now counts every criterion in the body, which is self-consistent,
  but a reader who wants "how do I stand at this stage" has to read the stage
  group. Whether the bar should carry a per-stage reading as well is a product
  question, not taken here.
- **The upstream summary's two consumers were not audited for the same
  conflation.** `health-board.ts` and `dashboard-summary.ts` both read
  `gatesSummary.met`, which includes waived criteria. For an advancement or
  health reading that is defensible, which is why they were left alone, but
  neither states it. Checking whether either presents that number to a reader
  as "met" is the natural next instance of this sweep.
- **No phone-width measurement**, and the line can now be up to two clauses
  longer than before.

## Audit Evidence

- The four defects are each recorded at the point of the fix: the module header
  of `gate-summary-line.ts` enumerates them with the upstream expressions they
  came from, and the widened payload field in `explanation-serializer.ts`
  carries a comment stating that the headline is a partition of the body.
- Each defect has a dedicated test case, and each has a mutation that restores
  it and is killed (counts above). The mutation that restores the serializer's
  original source for the denominator is the one that pins the set.
- The reachability finding behind the waived caveat is recorded in Known Gaps
  with the mechanism: evaluator sentinel key versus the waiver route's separate
  store.
- The CI-coverage claim is backed by a measured census delta rather than by
  reading the workflow, and the measurement is stated in QA including the true
  base it was taken against.
