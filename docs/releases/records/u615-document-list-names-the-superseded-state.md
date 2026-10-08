# u615 — The document list names a superseded document and stops offering its approval

## Release ID

`2026-10-08-document-list-superseded-state`

## Status

`candidate`

## Plain-English Summary

u612 gave a superseded document's sign-off refusal a cause and a remedy, so a
reader who tries to approve one is now told the document was superseded and that
generating it again is the action that works. Its own Known Gaps closed with the
structural follow-on: _"the status domain and the write layer's eligible set come
from one declaration instead of two."_

This change closes that, and in doing so found that the refusal was only half
the problem. u612 fixed what the reader is told **after** the click. The list
they click from was still wrong **before** it.

The Documents list on Files & Evidence answers two questions about every row:
what state the document is in, and whether approving it is on offer. It answered
the first from a two-arm ladder that named the signed-off and in-review states
and let everything else fall through to `Draft`. The status column's `CHECK`
constraint admits four values, so the one other value a reader can encounter —
`superseded` — was rendered under the name of the most actionable state in the
domain. It answered the second by rendering the approve control whenever the row
had not already been signed off. A superseded row that was never signed off
satisfies that, so the full approve-and-upload control rendered beside a label
reading `Draft`, against a row whose every submission the route answers with the
superseded refusal u612 wrote.

That is a worse shape than the one u612 fixed. A refusal that names a ruled-out
remedy costs the reader one retry. A list that names the state wrongly and then
offers the only action that cannot succeed costs them the click plus the belief
that the document was fine, and the action that does work — regenerate — was
named nowhere they could see it until they had already failed.

The state is reached by an ordinary action, not an edge case. Approving the
chosen solution option for a Move sets every P3 architecture document in it to
superseded, deliberately, because an output built on the prior basis may no
longer satisfy a gate. That write sets the status alone and leaves the
signed-off version as it found it, so a document superseded _after_ being signed
off took the other branch: its control suppressed itself on the already-approved
flag while the label still read `Draft`, and the reader was told nothing at all
about a document that no longer counts for a gate.

So this change gives both answers one owner. A new module holds the name, the
dot colour, whether the state is signable, and — for a state approving cannot
leave — the action that can succeed. The list renders that action in place of
the approve control, so the remedy is on screen before the click rather than
only in the refusal after it. The same module declares the signable set, and the
guarded write now reads it instead of relisting it inline.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only. Layers 1 (Client Intake), 2 (Source Adapters) and 3
(Canonical Model) are untouched: no schema, migration, adapter, intake or
read-model change. No gate criterion, gate rule, deliverable registry entry or
phase advance condition is modified, and **the set of statuses the write accepts
is unchanged** — it moves from an inline literal to a named constant with the
same two members, and a case pins that the derived set and the constant agree.
What is signable, what supersedes a document, and what signing does are all the
same in both directions.

## Client Applicability

- All clients: yes — the label and the control change for every tenant whose
  Move has a superseded document.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gating the correct label would leave the wrong one on the
  ungated path, which is the reader every tenant has today.

## Changes Included

- `src/lib/programs/deliverable-status-presentation.ts` — **new.** Imports the
  status domain type from `deliverable-sign-off-outcome.ts` rather than
  restating it, so the column keeps one declaration. Exports the signable set
  and a describer returning the label, dot colour, signability and — only where
  the state is terminal and not approvable — the action that can succeed. The
  `Draft` arm is the last arm and the default **deliberately fail-open**: a
  value added to the column later keeps today's label and keeps its control,
  because the route is the authority on eligibility and now names its own
  refusals, and failing closed here would withhold a legitimate approval for a
  state nobody has taught the module about yet. That choice is documented in the
  module and pinned by a case.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — the status dot
  delegates to the module, and both approve-control render sites render the
  terminal state's next action in place of the control when there is one.
  Non-null only for the superseded state, so every other row's render is
  unchanged. No query, no new column read, no data fetched.
- `src/lib/programs/mutations.ts` — the guarded sign-off write's
  `.in("status", …)` filter reads the exported signable set. Two lines: the
  import and the filter. The comment above the filter explaining why `draft` is
  accepted is kept as it was.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` —
  seven new cases in a second `describe`, co-located with u612's refusal cases
  because the list's answer and the route's refusal have to prescribe the same
  remedy and one case asserts exactly that. No new file.
- `src/components/strategic-moves/__tests__/phase-documents-panel-route-scope.test.tsx`
  — four new cases in a second `describe`. This suite already renders the real
  server component, so the cases pin the rendered label and the rendered control
  rather than the pure decision. No new file.

Deliberately **no workflow and no census change**, so this does not contend with
the open approval-route CI wiring release that touches both.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath` on the rendering suite → **9 of 9** (5
  pre-existing). The four new cases: the state is called `Superseded` and no
  surviving `Draft` label is left in a render that contains no draft; the
  approve affordances are absent and the regenerate sentence is present; a draft
  row in the same shape **still** gets its approve affordances and no sentence,
  which is the control proving the suppression is the status's doing and not a
  render that lost its control; and the superseded row stays visible and in the
  tally's denominator, because naming a state must not hide the row the reader
  needs in order to act.
- **PASS** — `npx jest --runTestsByPath` on the module suite → **28 of 28** (21
  pre-existing, u612's). The seven new cases: the superseded state is named and
  is not named `Draft`; it is not signable and prescribes regeneration, **and
  the route's own refusal for the same state prescribes regeneration too**, so
  the list and the refusal cannot drift to different remedies; both signable
  states keep their control and carry no blocking note, the mirror of the
  defect; the already-signed state blocks nothing, because the control
  suppresses itself there and a note would talk over it; the signable set equals
  exactly the domain values the describer calls signable, with a non-vacuous
  guard that the domain is the wider of the two; the unrecognised-status default
  is pinned as fail-open; and the write layer **consumes** the constant rather
  than relisting the set.
- **PASS** — mutation testing, **eight mutations, eight killed.** Each mutation
  asserted its pattern occurred **exactly once** before being applied and
  refused to write otherwise, so none silently no-opped. Every run's test total
  was compared against the 37-case baseline before a result was believed, so no
  survivor or kill is an artefact of a run that collected the wrong suites.
  1. The superseded arm removed from the describer → killed, 5 cases. The widest
     kill, because dropping the arm sends the state back to the `Draft` default
     and that is the defect itself.
  2. The superseded next action blanked → killed, 2 cases, one in each suite.
     This is the mutation that proves the rendered sentence and the module fact
     are the same fact.
  3. The next action reworded to drop regeneration → killed, 2 cases, including
     the one that ties the list's remedy to the route's.
  4. The default arm made fail-closed → killed, 3 cases. Informative as well as
     fatal: the `draft` state has no arm of its own and reaches the default, so
     this mutation also unsignals the signable set, which is why the count is 3.
  5. A signable state given a blocking note → killed, 1 case, the mirror of the
     defect.
  6. The panel's status dot reverted to the two-arm ladder → killed, 1 case.
     This reproduces the original label defect exactly.
  7. The panel made to ignore the terminal state's next action → killed, 1 case.
     This reproduces the original control defect exactly, and it is the one that
     matters most: it is the proof the module's answer reaches the rendered JSX
     rather than stopping at a correct value nothing consumes.
  8. The write layer's filter re-literalled → killed, 1 case, so the constant
     cannot become inert.
     The baseline was restored after the battery and **verified present by grep on
     all three mutated files**, then the suites were re-run green at 37 of 37.
- **PASS** — `npx jest src/lib/programs/__tests__` → **179 suites, 2,355
  tests.** This is the required catalog's directory sweep, which makes the
  module cases merge-blocking with no workflow edit.
- **PASS** — `npx jest src/components/strategic-moves/__tests__` → **47 suites,
  717 tests.** The rendering suite is named by exact path in the same required
  catalog workflow, so its cases are merge-blocking too; that was checked
  against the workflow before the cases were written, because a new suite in
  this directory would have run nowhere.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all five changed files, exit 0.
- **PASS** — `npm run audit:tenancy-fence-coverage`, exit 0, no generated file
  changed. No changed file is a fence-scoped suite.
- **PASS** — `npm run audit:test-ci-coverage` → **`census drift: committed
census matches this run`.** No new test file, so no count moves, and the base
  census agrees with its own tree at this base. The multi-run committed-census
  drift reported through run 76 is gone.
- **PASS** — Prettier established **per file, in place.** All three modified
  pre-existing files warn at the base as well, which was proven by restoring
  each file's base content at its own path and re-checking there rather than on
  a copy outside the tree. Two of the formatter's requested changes fell inside
  this change's own added lines and were **applied by hand**; afterwards the only
  remaining hunk in any changed file is one this change does not touch. The new
  module and the panel are clean.
- **NOT RUN** — no signed-in walk. This changes a label and a control on a live
  product surface, so a walk is the only way to observe it. See Known Gaps.
- **NOT RUN** — the superseded state was not exercised against a live database.
  Its reachability is established by reading the writer of that value and the
  rendering suite's real-component render, not by observing a row.

## Rollout Plan

Merge to `main` via squash. The change then rides the repo-owned Azure Container
Apps main deploy workflow like any other product change: no migration, no flag,
no data move, nothing to sequence. Until that deploy completes the list keeps
its current label and control, which is the pre-change behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority that may shift shared web traffic. Not invoked by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision weight change, no web or worker template change.
- Approved image digest: unchanged by this record; the main deploy workflow
  builds and pins it.
- ACA runtime invariant: unaffected here, and to be proven by the deploy
  workflow in the usual way before this is called live.
- Worker image invariant: unaffected. No worker code changes.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: **yes** — see Known Gaps. This record may say
  `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. Five files and no state: the new module is removed, the
status dot returns to its two-arm ladder, both approve-control sites render
unconditionally again, and the guarded write relists its eligible set inline.
No migration, no data, no deployed artifact to unwind, no flag to flip, and no
generated artifact to regenerate. Reverting restores the wrong label and the
dead-end control but breaks nothing else — the route, both writers of the status
column, the write layer's accepted set and every gate criterion are untouched by
this change in both directions.

## Audit Evidence

- The pull request for this record and its CI run, in which the required
  `AI surface control catalog` check runs both changed suites — one by directory
  sweep, one by exact path.
- `src/lib/programs/deliverable-status-presentation.ts` — the two answers, with
  the writer of the superseded state, the reason it is terminal, the clearing
  action, and the fail-open argument for the default arm recorded in its header.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` — the
  28 cases, including the one that ties the list's remedy to the route's.
- `src/components/strategic-moves/__tests__/phase-documents-panel-route-scope.test.tsx`
  — the 9 cases against the real server component render.
- `docs/releases/records/u612-superseded-deliverable-refusal-names-regeneration.md`
  — the record whose final Known Gap this one closes, and whose refusal this
  change now agrees with on screen.

## Known Gaps

- **A signed-in walk is owed.** The direction to observe first is the regression
  one: a draft document still shows `Draft` and still offers approval, because
  that is the path a demo walk uses. Observing the new label and sentence
  requires approving a solution option and then looking at a P3 architecture
  document on Files & Evidence — stageable, but second. Nothing in this change
  is `live-proven`.
- **One row shape on the same panel still shows a hardcoded green dot.** When a
  document has no stored content but a succeeded build artifact, the row renders
  a green dot regardless of status, so a superseded document in that shape is
  still mis-coloured. Its approve control **is** fixed by this change — both
  sites take the new guard — so the dead end is closed there; only the colour
  lies. Left out deliberately to keep this change's render surface to the rows
  whose dot already came from the status.
- **The read-model projection of this status is still narrower than the column
  and was not changed.** The program full-state transform coerces any value
  outside its three-value union to `draft`, so a superseded document would be
  reported as a draft there too. It is left alone because that projection is
  **dark**: it is built by one API route and no client fetches it. Fixing a
  mislabel on a surface no reader reaches would be churn, and the retire-or-mount
  question for that route is a product call.
- **The module status presentation is not shared with the other panel that
  already renders this state.** The Files & Evidence artifact chips carry their
  own tone map including a superseded entry, and this change matches its colour
  by value rather than by import, because that map is keyed on a different
  status vocabulary (artifact lifecycle states, not deliverable statuses).
  Unifying them means reconciling two vocabularies and is a larger change than
  this one.
- **The already-approved case still answers with a refusal, not an idempotent
  success**, unchanged from u607 and u612 and for the reason recorded there: the
  success response reports the approver as the calling user, so answering
  success for an approval someone else recorded would misstate who approved it.
  Still a product call.
