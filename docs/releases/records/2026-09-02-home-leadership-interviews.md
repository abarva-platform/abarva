# 2026-09-02-home-leadership-interviews — The chapter that had an argument and no evidence

## Release ID

`2026-09-02-home-leadership-interviews`

## Status

`candidate`

## Plain-English Summary

The chapter asking what leaders agree on, disagree on and worry about rendered
four written insights over nothing a reader could open.

The intake carries 221 executive-interview rows across 29 columns — 23 interviews,
19 stakeholder roles, 18 executive areas — and every row names the systems, risks,
metrics and initiatives the answer refers to. It is the only family in the record
that joins leadership opinion to the estate by name. None of it reached the
product: no serving view, no page key, no entry in the reader union.

## What the chapter says now

**Where leadership diverges**, ordered by how _few_ areas raise a theme rather
than how many. Sorted the other way this record shows ten identical rows —
twelve of its seventeen themes are universal — and a reader never reaches the ones
that differ, which is the question the chapter asks.

**Systems leadership keeps returning to**, listing only what more than one area
named. The note says these were named by the interviewee rather than matched from
the estate, because those are different claims.

Five findings, each a rule over declared fields: themes every area raises;
themes a single area raises, with the ambiguity stated (a local problem, or the
only part of the business that can see it — the record cannot tell); the system
the most areas name; the count of risks raised unprompted.

## The one that has to fire before any of the others

Every response in this record is modelled, not transcribed — the intake column is
literally `synthetic_answer`. A modelled answer rendered under a named role is the
most damaging thing this page could do, because a reader takes it for something a
person said.

So the response and the basis of the response travel together, and the basis is
read from _which column supplied the text_ rather than assumed. A record that
later carries real transcripts says so without this code changing. The finding
also degrades correctly: all modelled reports one way, a mixture reports the
count, and fully attributed reports nothing.

The pattern of what is raised, and by how many parts of the business, remains the
record's own regardless.

## Layer Impact

Release lane: `client-data-lane`.

- **Layer 2 / serving:** one new view, `serving.home_executive_interviews`, and the
  page key added to the check constraint. **No rows are written.** Loading the
  family is a separate, gated step; rows written before a reader exists pass every
  readback and stay invisible, which is the failure this migration order avoids.
- **Layer 4 / products:** a new object type, its row mapper, the reader union, the
  record browser configuration, and the chapter's tables and findings.

## Client Applicability

- All clients. The chapter draws only where the family is served and its fields
  declared; a tenant without interviews sees the chapter unchanged.
- Feature flag: none.

## Changes Included

- `20260902090000_home_serving_view_executive_interviews.sql` (new) — the view and
  the page key.
- `technology-estate.ts` — `executive_interview` as an object type. Every
  `Record<TechObjectType, …>` in the codebase then forced a declaration, which is
  what stopped a surface silently omitting the family.
- `ecl-projection-bundle.ts` — the row mapper, column order, labels, source path
  and reader union.
- `RecordBrowser.tsx` — table columns, facets, detail fields and two crosstabs.
- `page-tables.ts`, `chapter-page-content.ts`, `HomeV4App.tsx` — the chapter.
- `__tests__/leadership-interviews.test.ts` (new) — 14 cases.

## QA / Validation

- PASS the new suite, 14 of 14
- PASS Home surface 621/650 across 70 suites, up from 604/633; ratchet reports no
  movement away from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS rendered against the real 221-row record: two tables, five findings, and the
  divergence visible at the head of the leading table rather than past its tenth row
- **Mutation-tested four ways:** counting answers instead of areas fails; sorting
  the divergence table the other way fails; dropping the modelled-response finding
  fails; listing systems only one area named fails

## Rollout Plan

Merge to `main`. The migration adds a reader and writes nothing, so the chapter is
unchanged until the family is loaded — which is a separate, gated step.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes, once the family is loaded

## Rollback Plan

Revert. The view is additive and unread by anything else; the chapter returns to
written insights alone.

## Audit Evidence

- The four mutation results and the render against the real record.
- Every figure is a rule over declared fields, each carrying the file, grain and
  rule behind it.

## Known Gaps

- **The family is not loaded.** This adds the reader only. Nothing appears until a
  gated load writes rows under the new page key.
- **Agreement is counted from who was asked.** Eighteen areas were interviewed;
  a theme raised by all eighteen is consensus among those eighteen, not among the
  leadership at large. The table states the denominator on every row.
- The `budget_or_value_mentioned` column is populated on 5 of 221 rows and is not
  used. Too thin to carry a finding, and stating that in the chapter would be
  noise.
