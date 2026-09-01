# 2026-09-01-home-chapter-leads-with-its-rows — A chapter never shows the pipeline's status

## Release ID

`2026-09-01-home-chapter-leads-with-its-rows`

## Status

`candidate`

## Plain-English Summary

Opened signed in against the live record, three of the eight chapters led with the largest words on
the page reading:

> Strategy & Value Creation is deferred pending stronger evidence
> How We Operate is deferred pending stronger evidence
> Leadership Perspective is deferred pending stronger evidence

That is the narrative generator reporting its own state. It says nothing about the enterprise, and
it sits in the headline position on a surface a client reads.

Two of those three chapters had **five and three tables of real content** underneath that headline.
The rows answered the question; only the prose was missing.

A chapter whose narrative was not written now leads with the strongest thing its own rows say, and
where no rows speak to it, says that in plain words rather than in pipeline language.

Separately: the renewal chart drew nothing on the live record, because it read a field name the
live view does not use.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** chapter headline selection, and one chart's field mapping.

## Client Applicability

- All clients: yes.
- Feature flag: none.

## Changes Included

- `cxo-language.ts` — `isGeneratorDeferral()` matches the deferral phrasing both narrative
  generators emit. Matched by phrase set rather than by source, because either generator can produce
  it and the surface must refuse it in both cases.
- `ChapterPage.tsx` — when the headline is a deferral, the chapter leads with its strongest
  deterministic finding and that finding's reasoning. Where the record carries nothing for the
  chapter, it states that in the reader's language.
- `RenewalTimeline.tsx` — reads `termEnd` **or** `renewalDate`. The golden snapshot names the column
  one way and the view the product serves names it the other, so the chart bucketed nothing against
  live data while every fixture passed. Also accepts `1` as an auto-renew flag.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **174/174**
- PASS `tsc --noEmit` · `npx eslint` 0 errors
- PASS `npx next build` — compiled, 218 static pages
- New tests: every chapter asserted not to lead with a build state; a chapter with its narrative
  replaced by a deferral asserted to lead with its rows instead; the chart asserted to bucket rows
  under **both** field names.

### How this was found

By opening the deployed product signed in and reading all eight chapters, after reviewing the
golden snapshot and reporting it as the product. The snapshot and the served view carry different
families and different column names; a review of one is not a review of the other.

## Rollout Plan

Merge to main and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: verified as part of the deploy
- Worker image invariant: not affected
- Live signed-in proof required: yes, and it is the check that produced this change

## Rollback Plan

Revert the commit. Headlines return to the generator's text and the chart to one field name.

## Audit Evidence

- Live read-out of all eight chapter headlines against the served record, before and after.
- Test output for the 174-case suite.

## Known Gaps

- **The generators still emit the phrasing.** This change stops the surface from showing it; it does
  not stop it being produced. Fixing that is a narrative-generation change on the data-build side.
- Five families remain unloaded in the served view, which is why those chapters had no narrative to
  write in the beginning. That load is the underlying gap.
