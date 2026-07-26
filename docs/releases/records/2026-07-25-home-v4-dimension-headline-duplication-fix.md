# 2026-07-25-home-v4-dimension-headline-duplication-fix — dimension-specific headlines

## Release ID

`2026-07-25-home-v4-dimension-headline-duplication-fix`

## Status

`candidate` — verified locally against real fixture content, not yet merged.

## Plain-English Summary

The three-tenant qualitative acceptance review
(`2026-07-25-home-v4-three-tenant-acceptance-review.md`) found a systemic defect independent of the
existing validator: across all three candidates, only ~9 distinct headline strings were reused
verbatim across most of each pack's 38 dimensions (e.g. one sentence identical across 9-14 unrelated
dimensions). Root cause: `renderDimensionsFromBook()` set every dimension's `headline` to
`sections[chapter].headline` — one hand-authored string per "book chapter," deliberately shared as
chapter-wide context by design, but wrongly used as the primary per-dimension label. This is the
same defect class as the earlier V2 evidence-leak fix (content scoped to one thing presented as if
specific to another), just in the V4 generator's deterministic rendering step rather than the V2
renderer's evidence lookup — and it is a pure code bug, not a prompt/LLM-authoring issue, so it was
fixable and provable at zero additional Claude cost.

Fix: each dimension's `headline` is now derived from that dimension's own filtered
`material_gaps`/`material_advantages`/`conclusions` (already correctly scoped per-dimension via
`applies_to_dimensions`), preferring an item exclusive to that one dimension before falling back to
a broadly-shared one. A dimension with no content of its own now reads with an honest empty headline
(the existing UI already handles this — see `HomeV4ExplorerShell.tsx`'s truthiness guard) instead of
borrowing an unrelated chapter's headline.

**Result, verified against the real fixture content for all three tenants**: the largest
headline-duplicate group dropped from up to 14 dimensions (virtually the whole 38-dimension pack, on
9 chapter-wide strings) to 5-7 dimensions — and every remaining duplicate is a genuinely shared,
evidence-tagged fact between related dimensions (e.g. "the IT budget is run-heavy" legitimately
shared by `service_delivery`/`vendors`/`ms`), not an arbitrary chapter label. This is not a claim of
zero duplication — some overlap is architecturally correct when a fact really does apply to several
related dimensions equally, per the schema's own explicit design (`sections_shape`'s instruction that
chapter narrative is "shared context... not a per-dimension takeaway").

## Layer Impact

- `internal-admin` lane: this changes only the V4 book-mode generator's deterministic rendering step
  (`renderDimensionsFromBook()` in `build-home-knowledge-v4-review-pack.mjs`), used solely by the
  operator-triggered candidate-generation job. No schema, route, or already-live client content is
  affected — no tenant currently has an approved V4 pack (all three were rejected in the acceptance
  review this fix responds to).

## Client Applicability

- Internal only. This affects only future candidate generation; nothing client-facing changes.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: new `pickDimensionHeadline()` and
  `truncateToWords()` helpers; `renderDimensionsFromBook()`'s `headline` field now uses
  `pickDimensionHeadline()` instead of the shared `section.headline`. `executive_takeaway` is
  unchanged (still correctly sources the shared chapter narrative, per the schema's own explicit
  design intent). Also adds a standard ESM entry-point guard (`import.meta.url === file://...`)
  around the file's `main()` call, needed because this is the first time anything imports this file
  for its exports rather than running it as a CLI — without the guard, import alone triggered
  `main()`'s `ANTHROPIC_API_KEY` requirement.
- `scripts/knowledge/__tests__/run-dimension-headline-tests.mjs` (new): unit tests for
  `pickDimensionHeadline()` (exclusive-item preference, truncation, honest-empty fallback) plus an
  integration check against all three real tenant fixture books, asserting the largest
  duplicate-headline group stays well below the old failure mode and that no dimension headline
  equals a raw chapter headline string.
- `package.json`: new `home:knowledge-v4:test-dimension-headlines` script entry.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — new test suite: 11/11 assertions passing.
- `pass` — existing suites unaffected: `home:knowledge-v4:test-manifest-validator` (25/25),
  `home:knowledge-v4:test-prompt-preflight` (6/6).
- `pass` — direct CLI invocation (`--preflight --book-mode --tenant=<t>`) confirmed unaffected by
  the new entry-point guard, for all three tenants.
- `pass` — real before/after comparison against all three tenants' actual fixture content (the same
  fixtures used in the rejected candidates): largest duplicate-headline group dropped from
  9-14 dimensions to 5-7, and zero remaining headlines match a raw chapter headline string.
- No paid Claude regeneration was run as part of this fix — the fix and its proof are both entirely
  deterministic (`renderDimensionsFromBook()` takes an already-generated `enterprise_book` as input),
  so this could be verified at zero additional API cost against the exact content already reviewed.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds the new image.
2. This fix takes effect the next time any tenant is regenerated — no immediate action required, no
   currently-approved content is touched.
3. Before regenerating any of the three previously-rejected candidates, confirm this fix is
   deployed, then run the standard governed regeneration job and re-review the fresh candidate
   (including running `home:knowledge-v4:test-dimension-headlines`-style spot checks on the real
   output) before any approval decision.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none — this only affects the operator-triggered generation job's output
  the next time it runs; no shared web traffic or runtime image behavior changes for existing
  requests.
- Live signed-in proof required: no — this is a generator-script fix with no rendered surface of its
  own; the fix's effect will be visible only in a future candidate's content, reviewed the same way
  every other candidate is reviewed before any approval.

## Rollback Plan

Revert the PR. `renderDimensionsFromBook()` reverts to sourcing the shared chapter headline; no
persisted data is affected either way, since candidates are always human-reviewed before approval.

## Audit Evidence

- This PR's diff and CI run.
- Before/after headline-duplication metrics for all three tenants, captured during local
  verification (see Plain-English Summary and QA sections above).
- `docs/releases/records/2026-07-25-home-v4-three-tenant-acceptance-review.md` — the review that
  found this defect and named it the top blocker before any regeneration.

## Known Gaps

- Some duplicate headlines remain by design (a fact genuinely shared by multiple related dimensions
  should read the same on each) — this fix reduces duplication to only the architecturally-correct
  cases, it does not claim to eliminate all overlap.
- A fuller fix (genuinely distinct per-dimension headline authoring, even when no dimension-exclusive
  gap/advantage/conclusion exists) would require expanding the LLM's authoring surface back to
  per-dimension headlines specifically, reopening a small amount of the fact-drift risk the current
  shared-object architecture was built to eliminate. Not attempted here — the deterministic fix
  closes the specific defect the review found without touching the prompt or spending additional
  Claude cost to verify.
