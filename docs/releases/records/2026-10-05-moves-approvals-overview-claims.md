# 2026-10-05-moves-approvals-overview-claims — Moves: the approvals overview stops naming approvals and approvers nothing recorded

## Release ID

`2026-10-05-moves-approvals-overview-claims`

## Status

`candidate`

## Plain-English Summary

The Moves workspace has an "Approvals overview" tab: one row per phase of a
Move, with four reading columns — Phase, Gate criteria, Status, Approver. Three
of those four were stating more than anything on the screen had measured.

1. **The Approver column was a constant.** Its source was a function that took
   a phase number, ignored it, and returned the same string for all six rows.
   So a column headed "Approver", on a screen headed "Gate-approval status
   across every phase of this Move", answered "who approved this gate?" without
   any approval record being read — and no approval record reaches this surface
   at all. A dead CSS branch in the same component is the tell that a real
   lookup was intended and never arrived: the row styled an approver cell as
   unassigned when its text equalled a string the constant could never return.
2. **"Approved" named a decision nobody read.** A row's done state is inferred
   from the Move having advanced past the phase. That inference is sound for the
   gate — advancement really is gated by the gate criteria — but it evidences no
   approval event, no approver and no date, which is exactly what a Status
   column beside an Approver column is read as asserting.
3. **One quantity appeared twice in one row, in two notations.** The Gate
   criteria cell read `0 of 2 met` while the Status cell beside it read
   `0/2 met — not yet submitted`. Same numbers, two forms, so a reader could
   take them for two different measurements of two different things.

After this change a passed phase reads `Gate passed` with its basis on hover
("inferred from this Move having advanced past the phase — no approval record is
read on this view"), the Approver column reads `Not recorded` and is styled as
an absence, and the quantity appears once, in its own column, with the set it
counts named on hover and the noun agreed to the count.

This is the fourteenth instance of one defect class this workstream has been
clearing — a client-visible statement derived from something that never measured
it — and the first where the statement is about a **party to a governance
decision** rather than about a figure.

## Layer Impact

Lane: `global-control-lane` — this corrects client-visible text on a surface
that is not feature-gated at all (the approvals tab renders unconditionally), so
it cannot be hidden behind a flag and none is declared.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched. Gate criteria are read exactly as before, from the same canonical rule
catalog the gate-approval flow evaluates against; only how one Layer 4
projection describes them changes. No product gains or loses ownership of data.

## Client Applicability

All clients. The approvals overview renders for any Move workspace with no
feature flag in front of it, so every tenant that can open a Move sees this
text. Tenants are resolved from code, never from a list in this record.

## Why this is the honest direction

The new reading is weaker than the one it replaces. A reader who used to see
"Approved · Authorized workspace user" now sees "Gate passed · Not recorded",
which looks like a regression in completeness. It is not. The old text asserted
two facts the product did not hold — that an approval was recorded, and by whom
— and it asserted them on the one screen whose entire purpose is to answer who
approved what. A governance surface that invents the party to a decision is
worse than one that admits it has not read the record. This is the same rule the
charter-basis work applies to an assumption, applied to an approval: it may be
inferred, it may not be rendered as recorded.

The honest form is also what makes the real gap visible and fixable. "Not
recorded" on six rows is an argument for threading a gate-approval record to
this surface; "Authorized workspace user" on six rows hid the need entirely.

## Changes Included

- **New** `src/lib/programs/approvals-overview-labels.ts` — the pure decision
  for every cell of the table: `approvalsRowStatusText`,
  `approvalsRowStatusBasis`, `approvalsRowStatusClass`,
  `formatGateCriteriaCell`, `formatGateCriteriaTitle`, `agreeGateCriterionNoun`
  and `formatApproverCell`.
  `formatApproverCell` takes the recorded approver as its only argument, so a
  caller with no record **cannot** produce a name — the old shape is not
  expressible through this signature. The invariant is in the type, not in a
  test.
- **Changed** `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` —
  the three local helpers that decided these cells are deleted and the table
  calls the module. The approver cell is built from `null`, with a comment
  saying why. The tally cell gains a `title` naming the set it counts; the
  status cell gains a `title` carrying its basis. One CSS class is renamed
  (`.approved` → `.passed`) to follow the status it styles.
- **New** `src/components/strategic-moves/__tests__/approvals-overview-labels.test.ts`
  — 11 cases on the pure module, registered by exact path in
  `.github/workflows/ai-surface-control-catalog.yml`.
- **Changed** `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — three new host cases pinning the host's own wiring (the approver cell is
  built from a record; each row carries its tally noun and status basis in a
  title; no status cell contains a digit), plus two conformances where the
  existing suite had pinned the defective text as a selector.
- **Changed** `docs/architecture/test-ci-coverage-census.json` — regenerated for
  the newly registered suite.

## QA / Validation

- **PASS** — new pure-module suite:
  `jest src/components/strategic-moves/__tests__/approvals-overview-labels.test.ts`
  → 1 suite / 11 tests.
- **PASS** — host suite:
  `jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  → 1 suite / 174 tests.
- **PASS** — whole directory, as the behaviour-preservation evidence for a
  shared host component: `jest src/components/strategic-moves/__tests__`
  → 36 suites / 480 tests (re-measured after the rebase onto the current base;
  the pre-rebase figure was 36 / 474).
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0.
- **PASS** — `eslint` on all four changed source files: 0 errors (2
  pre-existing unused-import warnings in the host component, untouched by this
  change).
- **PASS** — suite registration proven by the census delta, measured by moving
  the new suite aside and regenerating on the unmodified base:
  `coveredTestFiles` 2534 → 2535 with `uncoveredTestFiles` unchanged at 164
  (re-measured after the rebase; the base moved by one merge).
- **PASS** — mutation check, 6 mutations, 6 deaths, each measured against the
  whole directory so the size of the hole is reported and not just the kill:
  - host re-inlines a constant approver string → **2 of 480 red**, so 478 tests
    render this component family and none of them noticed the approver column.
    This one was re-run on the rebased base, because its denominator is the
    claim being made.
  - The remaining five were measured on the pre-rebase base, whose whole-directory
    total was 474 tests, and are reported against that total rather than restated
    against 480 without a re-run: restore `"Approved"` for a passed gate → 3 of
    474 red; status cell restates the tally in slash form → 4 of 474 red; drop
    the noun agreement (always plural) → 1 of 474 red; host drops the tally
    `title` → 1 of 474 red; host drops the status-basis `title` → 1 of 474 red.
- **NOT RUN** — signed-in walk. This change is not yet merged or deployed, and
  the ACA main-deploy queue was draining at the time of this run (one
  `in_progress` run plus cancelled runs between successes), so a walk would have
  been superseded mid-pass. The walk is owed and recorded as a gap below.
- **NOT RUN** — phone-width measurement. jsdom does not lay out, and this table
  is a five-column CSS grid whose Approver cell grows from a two-word constant
  to "Not recorded". Narrow-viewport behaviour is unmeasured.

## Audit Evidence

- The defect is readable in the diff: the deleted
  `approvalRoleLabelForPhase(_phase: number)` returned one literal for every
  phase, and its argument was prefixed with an underscore because it was never
  used.
- The dead CSS branch is evidence the constant was never the intent: the old row
  applied an `unassigned` class when the approver label equalled
  `"Not yet assigned"`, a string that function could not return.
- Two conformances in the pre-existing host suite are evidence the rendered text
  really changed: the suite asserted `getAllByText("Approved").length === 3`,
  `"0/2 met — not yet submitted"` and six occurrences of the constant approver
  string. A suite can hold a defect in place as a selector without anyone
  intending it; this is the sixth instance in this workstream.
- Every per-phase gate-criteria count still comes from `getMovePhaseTallies`,
  which reads the same canonical `gateCriteriaForPhase` catalog the gate flow
  evaluates against. No count is computed in this change.

## Rollout Plan

Merged to `main` by squash merge with auto-merge armed, then deployed by the
repo-owned ACA main deploy workflow in the normal lane. No flag to enable and no
staged enrollment: the surface is unconditional, so the corrected text ships
with the revision. No data build, no migration, no job run.

## Rollback Plan

Revert the squash commit. The change is text, one renamed CSS class, one new
pure module and test-only additions; nothing is persisted, nothing is read
differently, and no schema or stored value depends on it. Reverting restores the
previous strings exactly, including the two selectors in the host suite.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command was run
during this change; the deploy-queue state quoted above was read from GitHub
Actions.

## Known Gaps

- **A signed-in walk of this change is owed**, together with the walks already
  owed for the open slices ahead of it. The approvals tab is reachable from any
  Move workspace, so the walk is cheap once the deploy queue is quiet.
- **No gate-approval record reaches this surface, so the Approver column can
  only state an absence.** Making it state a party means threading a real
  approval record — who approved, when, under which gate evaluation — from the
  data plane to this client component. That is a data slice, not a text slice,
  and it is the gap this change makes visible rather than closes.
- **The same inferred-approval claim survives one surface away, and its
  location is known.** In the same component, the phase progress header renders
  the label `Approved` when a phase is historical **or** a gate was approved in
  the current session — and the session flag is itself seeded from the
  historical inference. So a phase the Move merely advanced past still reads
  `Approved` there. Distinguishing a session-recorded approval from a seeded one
  is a separate change with its own call sites; it is not a rename, so it was
  not bundled here.
- **The `upcoming` rows read `0 of 4 met`, which is a measured-looking zero.**
  It is left as is on the grounds that no criterion of an unreached phase can be
  met, so zero is the true count rather than an absence — unlike the capture
  strip's unmeasured rows, where a count existed and was borrowed. Stated here
  so the decision is on the record rather than overlooked.
- **Nothing on this surface is measured at phone width** (see QA above).
