# 2026-09-02-home-readout-label — A heading that promised a decision over an excerpt

## Release ID

`2026-09-02-home-readout-label`

## Status

`candidate`

## Plain-English Summary

Every chapter opened with the heading **"Decision this page supports"**. Under it
sat whichever statement led the chapter's interpretation band, or
failing that from its record band.

Neither is a decision. The interpretation band is titled _What follows from it_
further down the same page; the record band is a counted fact. So on a chapter
with an interpretation the heading over-promised, and on a chapter without one it
promised a decision over an excerpt.

A reader takes a heading as the claim about what is beneath it. This one asserted
the page had advice when it had a fact — on every chapter, in the opening line
below the title.

## What changed

**The heading follows the sentence.** It names the band the statement came from,
so a reader who scrolls down finds the same title over the same kind of content.
Where the chapter has neither, it says so.

**No heading claims a decision.** Nothing in this record declares one. Writing the
decision a chapter supports is authored advice about a client's situation, and
generating a heading for it is how a page ends up asserting judgement it does not
have. A test now sweeps every chapter and fails if that heading returns.

**A record's field count counts one population.** The panel read "20 of 15
fields": the numerator counted fields shown, taken from the row; the denominator
counted declared columns — and a row can carry keys the declaration omits. Both
now count the row. That was mine, introduced with the derived detail panel.

## What this does not do

It does not write the eight decision readouts. Those are authored judgements about
a specific client, drawn from facts the page already holds, and they should be
written by someone who can be accountable for the advice. Labelling the readout
honestly is what makes writing them optional rather than urgent.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** the chapter readout heading, and one count in the record
  browser.

## Client Applicability

- All clients. The readout renders the same statement it did; only its label
  changes, and only where the label was wrong.
- Feature flag: none.

## Changes Included

- `ChapterPage.tsx` — the readout names its own band.
- `RecordBrowser.tsx` — the field count reads the row on both sides; the prop it
  no longer needs is removed.
- `__tests__/readout-label.test.tsx` (new) — 5 cases.
- `__tests__/record-browser-fields.test.tsx` — one case on the count.

## QA / Validation

- PASS the new suite, 5 of 5; the record-browser suite 17 of 17
- PASS Home surface 664/693 across 75 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- **Mutation-tested three ways:** restoring the decision heading fails 2 cases;
  putting a record statement under the interpretation heading fails; measuring
  shown fields against declared columns fails

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The heading returns to its fixed text.

## Audit Evidence

- The three mutation results.
- The band names the headings use are the same strings the bands render further
  down the page, so the pairing is checkable by reading one file.

## Known Gaps

- **The decision lens is not built.** Named above as deliberate.
- **The leadership chapter still opens with an interview excerpt.** Correctly
  labelled now, but the audit's point stands: a raw excerpt is the wrong opening
  for that chapter, and the tables that would replace it need the interview family
  loaded.
- **Unresolved-citation copy and blank record titles** were also raised and are
  untouched here.
