# 2026-07-25-home-v4-chapter-navigation — book-mode nav becomes a real table of contents

## Release ID

`2026-07-25-home-v4-chapter-navigation`

## Status

`candidate` — verified locally against real fixture content, not yet merged.

## Plain-English Summary

The first slice of the V4 Knowledge experience productization work (PR4 of the home-v4 live-cutover
pivot). Book-mode candidates carry a real, generator-guaranteed 13-chapter structure
(`DIMENSION_BOOK_CHAPTERS` in `build-home-knowledge-v4-review-pack.mjs`, one entry per dimension,
load-time-checked for completeness) — but the nav never used it: every one of the 38 dimensions
rendered as one flat, ungrouped list under a single "Enterprise Context" header, hiding the book's
actual structure.

This makes the nav a real table of contents: 13 numbered chapter groups (Enterprise Context,
Operating Model, Capabilities, Value Streams, Technology, Data Foundation, Applications & Systems,
Vendors & Economics, Risk & Controls, Evidence & Confidence, AI Opportunity, Portfolio & Investment,
Relationships), each expandable, titled in the locked Fraunces serif treatment already used for
other headings in this product (fixing a small existing inconsistency where the shared explorer
component had no heading font at all — it silently inherited body Inter). Each dimension's nav dot
is also now an honest signal, not decoration: hollow/quiet for a dimension with no headline-worthy
content of its own (per the just-shipped headline-duplication fix), solid green for one that does —
so a reviewer can see coverage at a glance before clicking anything.

Non-book candidates (legacy V1 shape, which has no `chapter` field) are unaffected — they keep the
exact same flat single-group nav they always had.

## Layer Impact

- `internal-admin` lane: this changes only `/home/v4-preview`'s candidate-review rendering
  (`HomeV4ExplorerShell`/`HomeV4Explorer`), reachable solely by platform admins reviewing unapproved
  candidate content. No tenant currently has an approved V4 pack, so no client-facing surface is
  affected.

## Client Applicability

- Internal only. No client-visible surface changes — this is the admin candidate-review UI only.

## Changes Included

- `src/components/home/v4/HomeV4Explorer.tsx`: `HomeV4ExplorerGroup` gains optional `variant: "toc"`
  and `numberLabel` fields (purely additive — existing non-book groups render unchanged);
  `HomeV4ExplorerItem`'s `tone` gains a `"quiet"` value (hollow-ring dot). New `.toc` CSS variant:
  serif chapter titles, roman-numeral badges.
- `src/components/home/v4/HomeV4ExplorerShell.tsx`: new exported `buildBookChapterGroups()` (pure
  function, grouping real fixture/candidate dimensions by their `chapter` field into the 13 ordered
  chapter groups) — exported specifically so grouping correctness can be asserted directly,
  independent of the explorer's collapse/expand DOM state. Book-mode candidates now render
  `[BOOK_OVERVIEW_GROUP, ...chapterGroups]` instead of one flat group.
- `src/components/home/v4/__tests__/HomeV4ExplorerShell.chapter-nav.test.tsx` (new, first test
  coverage this component has ever had): 7 tests against the real `first-capital` fixture — correct
  chapter count/order/titles/numerals, every real dimension placed in exactly one chapter (except
  `enterprise_thesis`, folded into the Executive Book group), `apps` specifically lands in
  Applications & Systems, headline-presence correctly drives dot tone, and the rendered shell shows
  chapter structure rather than a flat list.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- `pass` — new test suite: 7/7 passing, against real fixture content (not synthetic).
- Live signed-in browser verification against `/home/v4-preview` was not possible from this
  environment (requires a real platform-admin Clerk session; local dev has no route to authenticate
  one) — verification instead used a direct component-render test against the actual fixture JSON
  `/home/v4-preview` serves, which exercises the real grouping logic against real content.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live signed-in verification on `/home/v4-preview` as a platform admin, once available, to confirm
   the rendered chapter nav matches the local test's proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, deferred to the next available platform-admin session per QA
  section above — not skipped, explicitly documented as outstanding.

## Rollback Plan

Revert the PR. No schema or data change; `HomeV4ExplorerGroup`'s new fields are optional, so nothing
else in the codebase is affected either way.

## Audit Evidence

- This PR's diff and CI run.
- The new test suite's output (7/7 passing) as the primary correctness proof in place of a live
  browser session.
- `aca-main-deploy.yml` run for this merge, once available.

## Known Gaps

- Live signed-in browser verification is deferred (see QA section) — this environment has no route
  to a real platform-admin Clerk session. Should be captured at the next opportunity.
- This is the first of several planned V4 Knowledge experience productization slices (PR4 of the
  home-v4 pivot) — a dedicated Applications & Systems landing experience and real relationship-graph
  rendering (currently text-only, per `HomeV4GraphBindingSummary`) are separate, not-yet-started
  follow-ups.
