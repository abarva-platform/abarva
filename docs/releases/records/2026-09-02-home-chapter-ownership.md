# 2026-09-02-home-chapter-ownership — Two pairs of chapters were showing the same tables

## Release ID

`2026-09-02-home-chapter-ownership`

## Status

`candidate`

## Plain-English Summary

Nine tables were rendering in two chapters each, and in both cases the whole set:

- the five commercial tables — contract risk, renewal exposure, term ends,
  commercial model, benchmark rights — appeared under _what bets are we making_
  and again under _can we prove the value_
- the four platform tables — recovery posture, hosting and headroom, criticality
  against recovery tier, end of life — appeared under _how does work get done_ and
  again under _what deserves attention_

A reader scrolling from one chapter to the next met the identical grid. That reads
as a page that has not decided what either chapter is for, which on a walkthrough
is the moment a reader stops trusting the structure.

The rule that fixes it was already written in the module, and already applied to
one family: _applications are described here and nowhere else_. It had not been
applied to the other two.

## What changed

**Each family is described once and argued from anywhere.** The distinction was
already there — a finding is an argument, a table is a description, and they do
not have to come from the same family. Contracts are described under bets and
still argue in the value chapter, where a contract renewing without a decision is
value leaving. Platforms are described under how we operate and still argue in the
attention chapter, where recovery posture is an exposure.

**The exhibit follows the description**, not every argument that draws on it. The
renewal timeline now draws in one chapter rather than two — the same duplication
in one visual instead of five tables.

**A chapter whose own family did not arrive says so.** Removing the duplicates
made a real gap visible: on the reviewed stored record, two chapters have no
tables at all, because the families they are built from are not in it. Rendering
nothing reads as a chapter with nothing to say; it is a chapter that was not given
its rows. Each now names the family it is missing and says the gap is in what was
served, not in the record.

That last part matters more than the de-duplication. The duplication was masking
which chapters are unserved — each looked full while describing another chapter's
subject.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change.
- **Layer 4 / products:** which chapter describes which family, and what a chapter
  reports when its family is absent.

## Client Applicability

- All clients. A tenant with every family served sees each described once; a
  tenant missing one sees it named.
- Feature flag: none.

## Changes Included

- `chapter-page-content.ts` — ownership assigned, extra finding sources widened,
  absent families reported, `FAMILY_LABELS`.
- `__tests__/chapter-ownership.test.ts` (new) — 8 cases, run against both the
  four-family stored record and a fuller one.
- `__tests__/every-surface.test.tsx` — the renewal exhibit expectation narrowed to
  one chapter, with the reasoning recorded.

## QA / Validation

- PASS the new suite, 8 of 8
- PASS Home surface 679/708 across 76 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS nine duplicated tables before, none after, on both records
- **Mutation-tested four ways:** restoring either family to its second chapter
  fails; dropping the extra finding sources fails; returning to silence on an
  absent family fails

The ratchet caught the exhibit change as a regression before it shipped, which is
what it is for — the renewal chart drew in two chapters through the same rule the
tables did, and nothing else would have flagged it.

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The two chapters regain the tables, and the duplication with them.

## Audit Evidence

- The four mutation results, and the before/after duplication count on both
  records.

## Known Gaps

- **Two chapters are thinner on the reviewed stored record than they were**, and
  that is the honest state: they have no tables because their families are not
  served. The page now says which. Restoring them is the serving-view and load
  work already outstanding, not a rendering change.
- Ownership is assigned by judgement about which question a family answers, not
  derived from anything the record declares. It is a design decision and should be
  revisited if a chapter's question changes.
