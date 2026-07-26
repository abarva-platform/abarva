# 2026-07-26-home-v4-quiet-dimension-dedup-fix — quiet-dimension fallback duplicated content across a chapter

## Release ID

`2026-07-26-home-v4-quiet-dimension-dedup-fix`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

Follow-on fix to the same-day quiet-dimension work
(`2026-07-26-home-v4-quiet-dimension-and-heatmap-fixes.md`). That fix stopped quiet dimensions
(dimensions with no gap/advantage/conclusion tagged to them specifically) from rendering blank, by
falling back to their book chapter's shared narrative. Confirmed live immediately after deploy: this
worked, but produced a new, equally real problem — multiple quiet dimensions in the same chapter
(e.g. "Leadership Agenda" and "Interview Signals" under Operating Model; "Enterprise Profile",
"Geography & Legal Entities", and "Industry Patterns" under Enterprise Context) each rendered the
exact same paragraph verbatim. Clicking through several differently-titled pages and seeing
identical text reads as duplicated/broken content, even though the honest label was technically
correct about why.

Root cause: `enterprise_book.sections[chapter]` had no page of its own — the only place it was ever
rendered was by being copy-pasted onto every quiet dimension in that chapter.

Fix: each book chapter now gets one real "Chapter Overview" nav item/page where its shared narrative
renders exactly once. Quiet dimension pages no longer repeat that narrative — they show a short,
honest one-line note plus a link that navigates to the chapter's own page.

## Layer Impact

- `internal-admin` lane: pure rendering change in the V4 explorer. No data, schema, or generator
  change. Takes effect immediately for any already-persisted candidate, including the currently
  approved SkyHarbor pack — no regeneration needed.

## Client Applicability

- Internal only: `/home/v4-preview` and the real `/home` route for `skyharbor-air`, the one tenant
  with an approved V4 pack.

## Changes Included

- `src/components/home/v4/HomeV4ExplorerShell.tsx`:
  - `buildBookChapterGroups()`: each chapter group gains a leading `chapter:<chapter>` nav item
    ("Chapter Overview"), alongside its dimension items.
  - New `chapterTitleFor(chapter)` helper (exported for test reuse).
  - New render branch for `selectedKey.startsWith("chapter:")`: shows the chapter's title and its
    `enterprise_book.sections[chapter]` narrative once.
  - Quiet-dimension render branch rewritten: shows only "No material-specific finding for this
    dimension yet." plus a button linking to that chapter's page — the full narrative paragraph is
    no longer repeated on every quiet dimension.
- `src/components/home/v4/__tests__/HomeV4ExplorerShell.dimension-fallback.test.tsx`: rewritten to
  assert the new behavior — a quiet dimension's page must NOT contain the chapter's narrative text,
  must show a "chapter context" link, and clicking it must land on a page that does show the
  narrative; a second quiet dimension in the same chapter must not repeat the first's text either.

## QA / Validation

- `pass` — `npx eslint`, zero findings on both changed files.
- `pass` — `HomeV4ExplorerShell.dimension-fallback.test.tsx`, 5/5 (up from 3/3; two new assertions
  added for the chapter-overview page and cross-dimension non-duplication).
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- Local signed-in browser verification not possible in this worktree (no real Clerk keys
  configured — only the homepage renders without them, per AGENTS.md). Verification instead relies
  on the RTL test suite, which drives the same click-through behavior a real user would (expand
  chapter → select dimension → click link → confirm destination content) against the real
  skyharbor-air fixture, plus live signed-in browser verification on `app.abarva.ai` immediately
  after this deploys.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live verification: confirm on the real, already-approved SkyHarbor `/home` pack that (a) a quiet
   dimension's page no longer repeats the chapter's full narrative, (b) its "chapter context" link
   navigates to a page showing that narrative once, and (c) a second quiet dimension in the same
   chapter shows its own short note rather than a repeated paragraph.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. No schema or data-plane effect; the already-persisted candidate JSON is unchanged,
only how it's rendered.

## Audit Evidence

- This PR's diff and CI run.
- Updated test suite output (5/5 passing).
- Live screenshots/DOM-text confirmation on `app.abarva.ai` post-deploy.

## Known Gaps

- If a chapter's shared narrative is itself thin (a single short sentence), the "Chapter Overview"
  page and the honest note on each quiet dimension will still feel minimal — this fix removes the
  duplicated-content problem, it does not create additional per-dimension content where the
  generator produced none. That remains an upstream content-depth question, not a rendering bug.
- The heatmap known gap from `2026-07-26-home-v4-quiet-dimension-and-heatmap-fixes.md` is unchanged
  by this PR (still requires a fresh skyharbor-air regeneration, still not triggered).
