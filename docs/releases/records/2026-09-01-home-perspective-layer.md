# 2026-09-01-home-perspective-layer — Put where-this-is-heading on the chapter that asks it

## Release ID

`2026-09-01-home-perspective-layer`

## Status

`candidate`

## Plain-English Summary

A leader arriving asks two things: what is my business, and where is this heading. The record
carries material for the second — sector patterns with a recorded applicability, and expert lenses
with what an answer would decide — and it was rendered on the two chapters that answer the _other_
question, truncated to roughly half.

It now sits on the chapter that asks where this is heading, in full, behind a statement of what the
record cannot support.

Also in this change: the chapter spine gained an active state, so it says which section a reader is
in rather than only listing the sections.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** placement of patterns and lenses, and the spine's selected state.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `business-briefing.ts` — patterns and lenses move from `sections` to a separate `perspective`
  list, and are no longer truncated. Twelve patterns and nine lenses is the whole of what the record
  carries; showing six and five was a display choice presented as the record's extent.
- `BusinessBriefing.tsx` — `PerspectiveSections`, led by the statement below.
- `HomeV4App.tsx` — perspective renders on the leadership chapter and nowhere else.
- `ChapterPage.tsx` — the spine's selected chip, tracked to the section actually in view.

### The statement that has to come before the patterns

This is the one section where **layout itself can assert something false**. Put sector patterns
beside an enterprise's own figures and a reader infers a comparison — here is you, here is the
market — when the record carries **no competitor position and no peer benchmark anywhere**. Nobody
writes that claim. The arrangement makes it.

So the absence is stated in words, at the head, before any pattern is shown, and a test asserts it
precedes them in document order rather than merely being present.

### The spine had the same half-answer problem

A sticky spine that lists sections but never says which one you are in answers "where am I" only
until the reader moves — which is the moment they ask. The selected chip now tracks the section in
view.

The form is Tower's chip; the colour is this surface's reserved navy, which is also the value Source
uses for an active tab. Tower fills its own chip with the pressure-card orange, and that palette is
Tower's internal drift rather than a standard to adopt.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **193/193**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- The intersection observer is guarded for environments that do not provide one — server render and
  jsdom — where the spine keeps its opening selection rather than throwing.

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. Patterns return to the business chapters, truncated, and the spine to a plain
list.

## Audit Evidence

- Test output, including the document-order assertion on the no-comparison statement.

## Known Gaps

- Patterns render their recorded applicability as prose. The design shows a rated
  direct/partial/not-applicable label; the record carries an applicability field that could drive
  one, and that is a further change.
- The prose-only chapter layouts and the charts remain outstanding from the design pass.
