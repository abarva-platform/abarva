# 2026-09-01-home-chapter-sections — Give a long chapter landmarks

## Release ID

`2026-09-01-home-chapter-sections`

## Status

`candidate`

## Plain-English Summary

Measured on the live surface, the longest chapter ran **8,827px — about ten screens — with no
landmarks**. Six of the eight chapters are past six screens, so this is the shape of the surface
rather than one outlier. A reader could not say where they were, what was left, or which of eight
tables mattered.

Tables are now grouped into named sections, each section states its position, and each opens one
table at a time. A sticky spine names the sections and answers "where am I" at any scroll depth.

**No row moves and no figure changes.** This is arrangement.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No query, no schema, no computed value is altered.
- **Layer 4 / products:** table grouping, section headers, collapse behaviour, chapter spine.

## Client Applicability

- All clients. A chapter whose tables declare no section renders exactly as before.
- Feature flag: none.

## Changes Included

- `page-tables.ts` — `TableSpec` gains `section`, declared at each table's definition site. Grouping
  is stated at the table rather than inferred from the estate family: one chapter draws from two
  families and reads as four parts, and the split that matters to a reader does not follow the split
  that matters to the loader. All 25 table definitions carry one.
- `TableSet.tsx` — groups by section, renders a section header with its position and table count,
  opens the opening table and collapses the rest. A collapsed table states its own row count, so
  collapsing hides length, never content. The prior renderer is unchanged underneath as `TableGrid`.
- `ChapterPage.tsx` — a sticky spine listing the chapter's sections, rendered only where there are
  two or more. A spine over one destination is furniture.

### A defect the tests found

Sections were originally grouped by adjacency. Because a section's tables are not always contiguous in
the builder's output, one section could appear **twice** in a chapter — 6 rendered sections against
4 spine entries. A chapter showing the same section name twice reads as a bug rather than as
structure.

Caught by asserting section names are unique, which was written as an invariant rather than as a
check of the expected count. Grouping is now by name, in the order each name initially appears.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **187/187**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- Rendered and measured in a browser:

```
spine     01 THE ESTATE · 02 LIFECYCLE & EXPOSURE · 03 ACCESS & CLASSIFICATION · 04 DATA & INTEGRATION
sections  4      spine links 4      open tables 4      collapsed 4
height    8,827px -> 7,628px, with all eight tables still offered
```

- One existing assertion was updated rather than relaxed: it counted tables inside a single
  container, and sections now own their own. Its intent — this chapter has depth, not one table — is
  preserved as `open + collapsed >= 4`, which is what the chapter offers rather than what happens to
  be expanded on arrival.

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. Tables return to one ungrouped grid; `section` on `TableSpec` is additive and
inert without the renderer.

## Audit Evidence

- Rendered measurement above, before and after.
- Test output including the uniqueness invariant that found the duplicate-section defect.

## Known Gaps

- Section names are declared per table by hand. A new table without one falls into an unnamed group
  and renders as before — safe, but silent. A future check could require one.
- This is one of several arrangement changes from the design pass; visual grammar, the
  prose-only chapters, the perspective layer and the charts follow separately.
