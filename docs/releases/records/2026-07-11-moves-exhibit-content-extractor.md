# 2026-07-11-moves-exhibit-content-extractor — Real content extraction primitive (Stage 1)

## Release ID

`2026-07-11-moves-exhibit-content-extractor`

## Status

`candidate`

## Plain-English Summary

Stage 1 of a staged plan to surface real "carries forward" content (selected approach,
workstreams, owners, metrics) from already-generated Move deliverables in the Next-Phase Readiness
Pack (`2026-07-11-moves-next-phase-readiness-pack.md`). Investigation found the real Moves
generation pipeline (`solution-prompt-factory.ts`) has no fixed section-heading template — it's
freeform, story-first HTML, validated only by `golden-bar.ts`'s `extractExhibitKinds`, which
detects whether a required visual/table keyword is *present* but not what it *says*.

This release adds the missing piece: `extractExhibitContent(html, keyword)`
(`src/lib/deliverables/exhibit-content-extractor.ts`), a pure function that, given a keyword
already known to be present (from the same keyword vocabulary `extractExhibitKinds` uses), locates
the nearest heading or table associated with it in real generated HTML and returns its actual text.
Matches by direct substring or word-level fallback (for multi-word keywords); returns `null` when
no heading/table matches — never fabricates. Snippets are capped at 600 chars.

**This release is intentionally unwired** — it is not called from any product surface yet. It is
the isolated, testable primitive that Stage 2 (a per-Move deliverable reader) and Stage 3 (wiring
into the readiness pack) will build on, kept separate so each stage can be reviewed and tested
independently without touching the live generation path or the readiness pack already shipped.

## Layer Impact

- `global-control-lane`: new library file, zero call sites. No behavior change to any live surface.

## Client Applicability

- None yet — this ships no user-visible change. All clients unaffected.

## Changes Included

- `src/lib/deliverables/exhibit-content-extractor.ts` (new): `extractExhibitContent(html, keyword)`
  — regex-based heading/table locator (consistent with `golden-bar.ts`'s own regex-only HTML
  handling; no new HTML-parsing dependency added). Word-level fallback for multi-word keywords
  mirrors `golden-bar.ts`'s `requiredExhibitAppears` matching style.
- `src/lib/deliverables/__tests__/exhibit-content-extractor.test.ts` (new): 8 tests. Heading-match
  tests use a real, verbatim excerpt from `docs/build/golden-artifacts/Target-State-Architecture.html`
  — the actual manually-authored reference deck `golden-bar.ts` measures generated artifacts
  against — not a hand-crafted fixture. Table-match tests use a labeled synthetic fixture (the
  golden decks use card grids, not literal `<table>` elements, so no real table excerpt was
  available). Covers: single- and multi-word keyword matching, honest `null` on absent keywords,
  snippet boundary at the next heading, table header-row matching, empty-input edge cases, and
  snippet truncation.

## QA / Validation

- `npx eslint` on both files: PASS — 0 errors.
- `npx tsc --noEmit -p .`: PASS — 0 errors touching either file.
- `npx jest src/lib/deliverables/__tests__/exhibit-content-extractor.test.ts`: PASS — 8/8.
- Ad-hoc smoke test against the full real `Target-State-Architecture.html` golden deck (810 lines,
  not just the test excerpt) confirmed correct extraction for "compliance", "medallion", "phased
  path" and correct `null` for absent/stemmed-mismatch keywords — informal, not part of CI, but
  informed the word-level fallback design.

## Rollout Plan

Merge to `main`. No deploy-visible change — this is a library addition with no call sites. Stage 2
(per-Move deliverable reader) and Stage 3 (readiness-pack wiring) are separate, future releases.

## Rollback Plan

Revert this commit. Purely additive, zero callers — no risk to any live surface.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge (no functional change to the running app).
- ACA runtime invariant: unaffected — no behavior change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` / `npx tsc --noEmit -p .` output (0 errors) captured this session; reproducible via
  the commands in QA / Validation.
- `npx jest src/lib/deliverables/__tests__/exhibit-content-extractor.test.ts` — 8/8 green as of this
  commit.

## Known Gaps

- Stage 2 (read a Move's latest `deliverable_versions.content` for a given type and run it through
  this extractor) and Stage 3 (wire real snippets into `buildNextPhaseReadinessPack`) are not yet
  built — tracked as explicit follow-on stages, not implied here.
- The extractor is heuristic (regex-based heading/table location over freeform HTML), not a
  guaranteed structured parse — a real section with unusual markup may return `null` even when
  content exists. This is by design (never fabricate over a miss) but means recall, not precision,
  is the known limitation.
