# 2026-10-05-moves-capture-notes-host-callsite — Moves: pin the fill-from-notes host call site (test-only)

## Release ID

`2026-10-05-moves-capture-notes-host-callsite`

## Status

`candidate`

## Plain-English Summary

Governed fill-from-notes lets a consultant paste their own notes from a client
conversation and, question by question, review the verbatim passage proposed for
each unanswered field before inserting it. Nothing is written until the person
inserts, and a note-derived fill is recorded as the person's own assertion —
never as approved evidence.

That capability is made of three parts: a pure matcher that turns a paste into
proposals, the panel that draws them, and the wiring in the phase workspace
component that feeds the panel. The first two have had test cover since the
capability shipped. The third had **none** — zero cases in the workspace
component's suite mentioned the capability at all — so the one thing nothing
checked was whether the workspace hands the panel the right inputs.

This change adds no product behaviour. It adds eight cases to that component's
existing suite, pinning the four inputs the workspace feeds:

- **the flag** — with the capability off, the dock and the capture flow both
  render and there is no paste affordance, so a failure here is the flag's
  absence and not an unmounted surface;
- **reachability** — with the capability on but the redesigned capture flow off,
  the legacy canvas grows no paste affordance of its own;
- **the questions it may propose into** — the same paste, on two screens. On the
  Charter screen it proposes into a Charter question, quoting the passage
  verbatim with the line it came from. On a later phase's screen the identical
  paste proposes nothing, because no Charter question is in front of the person;
- **the write-back** — inserting a proposal puts the verbatim passage into that
  question's field and leaves its sibling empty;
- **the join with the per-field basis capability** — with the basis control off
  the panel does not claim an insert records how you know the answer, because
  the person still declares that by hand. With it on, the panel says what the
  insert will do for that specific field, and after the insert the field itself
  reads back "I'm asserting this" — never "backed by evidence", and never the
  amber assumption badge.

The last two are the ones most worth having. A dropped write-back handler is
invisible at a glance: the proposal disappears from the panel either way,
because the panel tracks what it has inserted itself, so only asserting the
*field* catches it. And the basis join is a conjunction of two independently
flagged capabilities whose wiring lived only in this component.

## Layer Impact

Lane: `experimental` — test-only cover for an existing feature-flagged,
non-default capability. No product file changes, so the live product is
unchanged on every code path regardless of flag state.

- `4 PRODUCTS` (Moves): **no change**. One existing test file gains cases. No
  component, route, API, flag registry or generated artifact is touched.
- `3 CANONICAL MODEL`: no change. No schema, no migration, no stored shape.

## Client Applicability

- All clients: No — nothing ships to any surface.
- Specific clients, selected by feature flag: the capabilities these cases cover
  are gated by `moves_capture_notes_v1` and `moves_charter_basis_v1` (tenant
  policy, non-empty lists — one synthetic demo tenant each). This change alters
  neither flag nor either list.
- Internal only: No.
- Public/demo only: No.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — eight cases pinning the fill-from-notes host call site: the flag conjunct,
  the capture-flow reachability conjunct, the viewed phase's questions as the
  proposal targets, the per-field write-back into the capture field, and the
  conjunction with the per-field basis capability in both directions.

No other file is modified. The suite is already registered by exact path in
`.github/workflows/ai-surface-control-catalog.yml`, so neither the catalog nor
the CI coverage census changes.

## QA / Validation

- `jest` (the eight new cases) — **PASS**: 8/8.
- `jest` (`src/components/strategic-moves/__tests__`, the whole directory) —
  **PASS**: 31 suites / 378 tests. The whole directory rather than the one
  suite, because the cases render through a component that sibling suites also
  render through.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no type errors.
- `eslint` on the changed file — **PASS**: 0 problems.
- Mutation check of the four inputs the cases claim to guard — **PASS**: four
  mutations of the call site, four deaths, and each one measured against the
  **whole** suite rather than only the new cases. Hard-coding the flag conjunct
  to true failed 1 case; pointing the proposal targets at the Move's progress
  instead of the viewed phase failed 1; stubbing out the write-back handler
  failed 2; emptying the set of fields whose insert records a basis failed 1. In
  every case the failures were new cases only — the suite's other 146 cases
  render this component and none of them noticed the call site break, which is
  the size of the hole this increment closes. Each mutation was reverted and the
  suite re-run clean (154/154).
- Visual signed-in walk — **NOT RUN**, and not applicable: this change ships no
  renderable difference. The capability itself was walked signed-in in an
  earlier increment.

## Rollout Plan

Merge to `main` via squash PR. Nothing to roll out — no product code changes, so
the merged commit is inert at runtime. Ships with the next ACA web image via the
repo-owned `aca-main-deploy` workflow like any other commit.

## Rollback Plan

Revert the PR. Because the change is confined to one test file, reverting
removes test cover and nothing else; no data migration, no flag change, no
runtime effect either way.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`. This change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env var or secret.

## Known Gaps

- The reachability half of the call site is **structural, not a droppable
  conditional**: the paste affordance is a slot on the capture workspace, which
  only exists once the redesigned flow is mounted, so no mutation of the
  conditional can express "notes without the flow". The case pins the observable
  consequence — the legacy canvas grows no affordance of its own — rather than a
  guard that could regress on its own.
- The cases drive the panel through its own controls, so they inherit whatever
  the matcher proposes for the notes they paste. They assert the proposal lands
  on a Charter question and quotes the passage verbatim; they do not re-prove
  the matcher's ranking, which has its own suite.
- An insert from pasted notes still records a basis before the answer it belongs
  to is saved. Non-atomic by choice, carried forward from an earlier increment;
  these cases flush the basis write rather than changing when it happens.
- Nothing in either capability has been measured at phone width — jsdom does not
  lay out, so no test in this suite can establish it.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The pure matcher these cases feed is covered by
  `src/lib/programs/__tests__/capture-notes-proposal.test.ts`; the basis
  decision by `capture-notes-basis-link.test.ts`; the panel by its own suite.
  This increment closes the join between them and the component that wires them
  together.
