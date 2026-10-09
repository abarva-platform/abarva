# u650 — The documents tab states whether its sign-off column was read

## Release ID

`2026-10-09-documents-tab-sign-off-readback`

## Status

`candidate`

## Plain-English Summary

The Documents tab on a Move's Files & Evidence page is where a user signs off the
documents a phase gate requires. Each row shows a document, whether it has been
approved, and — when it has not — the button that approves it.

That row is built from two separate reads that nothing ties together. One read
asks "was a file built for this slot?" The other asks "what does the document
register say about this document's sign-off?" The second read is the one that
owns the approval badge and the row the approve button targets, and it was
written so that a **failed query was indistinguishable from an empty answer**:
it looked only at the returned rows and ignored the reported error, so a failure
produced an empty result — exactly the shape of "no document is on record".

One failed read therefore removed the sign-off column from every row on the page
at once, and the page went on making a positive claim about each one:

- the "Client Approved" badge disappeared from documents that are approved;
- the "AI Draft" badge appeared in its place, because its condition is the
  default for a row that is absent — so approved documents were labelled
  unapproved drafts;
- the approve button, which is mounted only where a register row exists, was
  withheld from every row **without a word**; and
- the row otherwise looked healthy: a green "Built" dot, "Quality: available",
  and working preview and download links.

Meanwhile the phase's exit gate reads the same register and goes on refusing the
Move with "<document> is not signed off" — a blocker naming a control the page
had just silently taken away.

The in-workspace version of this same list already handles it. The route that
feeds it reads the identical register and returns, alongside its result, whether
the read succeeded; a dedicated module turns that into what the list is allowed
to say. That work fixed the **route**. This change is its sibling for the
**page**, which is the surface that originally owned the badge and the button.

Two things changed. The read now reports its failure in a form that cannot be
mistaken for an empty answer, so no caller can read an empty result off a failed
read. And a new module owns the two different reasons a row can have a built
file but nothing to approve, giving each its own sentence, because they differ
in what the reader should do:

- **The register answered and holds no row.** The file is real; the approvable
  record is genuinely absent, and the gate will still ask for its sign-off. The
  sentence says so, and says that building again produces another file rather
  than the missing record — because generating a document writes a file and a
  run record, not a register row, so the obvious next move is the wrong one.
- **The register could not be read.** Nothing on the row is a statement about
  sign-off. The sentence says the state is unknown rather than missing, and
  sends the reader to reload. A page-level warning states the same once above
  the list, and the draft badge is held back rather than asserted.

Only the draft badge needed holding back. The approved badge cannot overstate
anything from a read that produced no row, because its own condition is already
false without one — so it is left alone rather than given a guard that could
never fire.

Nothing about who may approve, what the approve route checks, or when the button
is offered on a row that does have a register record has changed.

## Layer Impact

Release lane: `global-control-lane`. The Documents tab is shared app behavior and
is not feature-gated, so every client reads the same page.

- **Layer 4 (Products — Moves):** the Documents tab's document-register read
  reports failure instead of fail-opening; the row states why no approve control
  is offered; the page warns once when the register is unread; the draft badge is
  withheld when sign-off state is unknown.
- **Layer 3 (Canonical model):** unchanged. Same projection, same columns, same
  engagement filter, no schema, no read model, no write.
- **Layer 2 / Layer 1:** untouched.

## Client Applicability

- All clients: yes — the Documents tab is the same for every client and this page
  is not gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change replaces a silent default on an existing read
  path; there is no new capability to gate.

## Changes Included

- `src/lib/programs/deliverable-projection-readback.ts` (new) — the two readback
  states, whether each permits a sign-off claim, the page warning, and the row
  sentence per cause.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — the register read
  returns a discriminated result carrying its own failure, so an empty result on
  the error path is unrepresentable; the panel derives the readback once and
  consumes it at the warning, the draft badge, and the row note.
- `src/lib/programs/__tests__/deliverable-projection-readback.test.ts` (new) — 7
  cases over the decision: the badge permission, the warning's single state, the
  per-cause sentences and that they never collapse, and that the row note and the
  page warning keep distinct vocabulary.
- `src/components/strategic-moves/__tests__/phase-documents-panel-sign-off-readback.test.tsx`
  (new) — 8 cases rendering the real server component, so each fails if the page
  stops asking.
- `.github/workflows/ai-surface-control-catalog.yml` — names the new panel suite
  in the required step that runs this directory. The directory is not swept by
  any job, so a new suite there is dark until it is named; the census confirmed
  it, and the step's own note records why this one belongs.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the two new
  test files.

## QA / Validation

- **PASS** `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__` —
  260 suites, 3793 tests, measured after merging `origin/main` forward. (The
  two new suites alone: 2 suites, 15 tests.)
- **PASS** Mutation testing, 13 designed mutations, 13 killed: reverting the read
  to ignore the reported error (1) · treating an unread register as read (1) ·
  dropping the draft-badge guard (1) · suppressing both badges unconditionally
  (1) · dropping the page warning (1) · reverting the row note to silence (1) ·
  letting the note displace a control that exists (1) · collapsing the two
  sentences onto one, in each direction (2) · permitting a sign-off claim on an
  unread register (1) · warning on the healthy state (1) · making the row note
  repeat the page warning (1) · dropping the rebuild steer (1). Clean restore
  re-reads the baseline.
- **PASS** Two assertion-vacuity defects found by that sweep and fixed, which is
  why the first pass killed only 11. The approved-badge case asserted on
  "Signed off" — a string the row's **status** slot renders for the same row —
  so it was satisfied by that sibling and could not fail with the badge deleted;
  it now asserts the badge's own text and pins that the two slots keep different
  vocabulary. And the unread-register fixture nulled the returned rows alongside
  the error, so the array check alone caught it and dropping the error term
  changed nothing; a case now has the register report an error **while still
  returning rows**, which is the separating input.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on all four changed source files — exit 0.
- **PASS** `npx prettier --check` on all four changed source files. The panel's
  base formatting was measured in place before and after the edit; it was clean
  both times, and only the new module suite needed formatting.
- **PASS** Census honesty: the generator's own "committed census matches this run"
  line printed while the file was in fact modified, so the counts were read from
  `git status` and the file diff instead. The new panel suite took this directory
  from fully covered to the first critical governed-risk ranked directory; after
  wiring it the census reads 0 critical, 0 high, 0 ranked.
- **NOT RUN** Signed-in walk. Nothing here is claimed `live-proven`. The unread
  state cannot be produced on demand from a dev box against the private data
  plane, and the Moves end-to-end walk remains Anand's step.

## Rollout Plan

Merge to `main`. It becomes active with the next repo-owned ACA main deploy; no
migration, no flag, no worker change, no separate rollout step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command and touches no
  Container App template, revision weight, env var, secret, or scale rule.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unaffected; to be proven by the main deploy workflow as
  usual when this rides a deploy.
- Worker image invariant: unaffected. No worker behavior changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no for this change on its own. It corrects what
  one page asserts about a read it was already making; the end-to-end walk is
  unaffected either way and remains Anand's step.

## Rollback Plan

Revert the PR. The change is one read's return shape, three render conditions on
one page, one new pure module, its tests, and a workflow line: reverting restores
the previous fail-open and the silent row. No migration, no data written, no flag
to flip back.

## Audit Evidence

- PR: the pull request for branch `moves/e2e-run113`.
- CI: the required check set on that PR, including the AI surface control catalog
  step that now names the new panel suite, and the sweep that reaches
  `src/lib/programs/__tests__`.
- Mutation log: the thirteen designed mutations, the two vacuity defects they
  exposed, and the kill counts are recorded under QA above.

## Known Gaps

- The page's "Available" count is still build-based, so on an unread register it
  counts a slot that has a built file and says nothing about sign-off. The page
  warning states that sign-off is unknown for the list; the count is not
  qualified. Qualifying the KPI strip would mean deciding what each tile means
  under a partial read, which is wider than this change.
- A row with no built file and no register row still reads "not generated" on an
  unread register. That is the correct build claim and the register warning
  covers the rest, but the row carries no note of its own, because the note is
  attached where the approve control would have been.
- The register-answered-and-holds-no-row cause is stated, not remedied. There is
  no product control that creates the missing register row, so the sentence names
  the consequence and declines to prescribe the action that cannot work. Closing
  it means deciding which step owns that write, which is a data-plane question.
- Presentation mode shows neither the warning nor the note. It withholds every
  sign-off badge and the approve control already, so it asserts nothing the
  warning would have to correct — but a presenter reading a built row there
  cannot tell the register was unread.
- The in-workspace attestation ledger and this page now answer the same question
  from two modules with two vocabularies. Both are correct; neither is derived
  from the other, so a future change to one does not reach the other.
