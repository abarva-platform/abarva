# 2026-09-01-home-questions-not-answered — Say that the questions are not answered here

## Release ID

`2026-09-01-home-questions-not-answered`

## Status

`candidate`

## Plain-English Summary

Each chapter closes with the questions its record raises. A reader who meets a question on a page
like this reasonably waits for the answer, and keeps reading to find it.

The page does not hold one. It now says so.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** one line under the questions heading.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `bands.tsx` — a rubric under the questions heading: _stated, not answered; the record does not
  resolve them, and this chapter does not attempt to._
- `every-surface.test.tsx` — asserted on the three chapters that carry no tables, where the
  questions are most of what closes the page.

### Why it is worth a line

The three prose-only chapters end on questions. Without the rubric they read as a rhetorical device
leading somewhere — and the reader either scrolls looking for the answer, or concludes the page is
withholding it. Both are worse than being told plainly.

It is the same rule the absence marks and the no-comparison statement follow: the surface says what
it cannot do, rather than leaving a reader to infer it from a silence.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **215/215**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The questions heading returns without its rubric and the chapters are otherwise
untouched; nothing else reads the removed element, and no stored data records it.

## Audit Evidence

- Test output across the three chapters that carry no tables.

## Known Gaps

- This completes the arrangement work from the design pass that is not blocked. What remains needs a
  serving path for four families, and authored copy for the decision each exposure forces.
