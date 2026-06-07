# 2026-06-07-binder-grounding-scoped-pattern-guard — Fail closed on cross-namespace pattern binds

## Release ID

`2026-06-07-binder-grounding-scoped-pattern-guard`

## Status

`candidate`

## Plain-English Summary

Pattern IDs in the platform live in two parallel namespaces: `corpus_patterns`
(slugs like `pat-lsh-d18-00479`) and `genome_patterns` (codes like `LSH-TMS-002`,
also served by the runtime Azure Search index `lakeshore-patterns-v1`). A **valid**
corpus pattern about *public-sector procurement* (`PAT-LSH-D18-00479`) was being
attached to a Kyriba/**treasury** decision card whose correct grounding is the
genome `LSH-TMS-*` namespace. This was a *cross-namespace mis-bind*, not a
fabricated ID — so a naive "reject IDs that don't exist in any table" guard would
not have caught it (the ID is real).

This change makes each decision card carry an **active grounding namespace** and
binds patterns only from that namespace. Treasury/Kyriba cards now bind real
`LSH-TMS-*` patterns; any pattern ID from the wrong namespace is dropped, logged,
and replaced by the top relevant in-namespace pattern (or none — fail closed).
No corpus data was changed, no data load was run.

## Layer Impact

- `global-control-lane`: shared app/control-plane behavior. The Lakeshore
  Intelligence brief binder (`lakeshore-live.ts`) and a new pure guard module
  (`pattern-grounding.ts`) change how pattern IDs are selected and validated
  before they appear on cards, citations, evidence, score basis, and
  anti-patterns. No schema, no data-plane writes, no corpus mutation.

## Client Applicability

- All clients: No (logic is currently wired into the Lakeshore brief path).
- Specific clients: **Lakeshore Holdings** (Intelligence brief decision cards).
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — the guard is always on for the affected binder path.

## Changes Included

- `src/lib/intelligence-v3/pattern-grounding.ts` (new): pure, no-I/O grounding
  guard — `classifyPatternId`, `groundingNamespaceForText`, `filterToGrounding`,
  `partitionIdsByGrounding`, `recordGroundingDiagnostics`.
- `src/lib/intelligence-v3/lakeshore-live.ts`: loads the genome `LSH-TMS-*`
  candidate pool; binds each bet/card from its grounding namespace; applies the
  guard at emission (binding patterns, success patterns, anti-patterns); records
  a diagnostic per rejection. Removed the unused brief-wide anti-pattern array.
- `src/lib/intelligence-v3/__tests__/pattern-grounding.test.ts` (new): 15 assertions.

Not included (deliberately): no changes to the 205-file Lakeshore data-load PR,
no corpus deletion/edit, no data loader/bundle changes, no drain/search/freeze,
no DNS/Vercel/account changes.

## QA / Validation

- Targeted tests: `jest pattern-grounding.test.ts pattern-relevance.test.ts` →
  **2 suites / 15 tests passed**. Covers: (1) valid in-namespace id passes;
  (2) valid wrong-namespace id rejected; (3) `pat-lsh-d18-00479` rejected for
  treasury grounding; (4) Kyriba query binds a real `LSH-TMS-*`; (5) citations
  cannot reference outside the grounding namespace even with a contaminated pool;
  (6) case-insensitive classify does not mark real lowercase slugs unknown.
- ESLint on touched files: clean (0 errors).
- `tsc --noEmit -p tsconfig.json`: no errors in touched files.
- `npm run release:check -- --base origin/main --head HEAD`: see PR CI.

## Rollout Plan

Merge to `main`. Activates on the next control-lane / production deploy of the
web app. No migration, no data load, no index rebuild required.

## Rollback Plan

Revert the PR (single commit, code-only). The binder returns to relevance-only
binding within the corpus namespace. No data or schema state to unwind.

## Audit Evidence

- PR: `cursor/binder-grounding-scoped-pattern-guard` → main (title: "Fail closed
  on cross-namespace pattern binds in Intelligence/Move binder").
- Verification receipt that established the two-namespace truth:
  `docs/build/corpus-verification-2026-06-07/CORPUS_DB_SEARCH_READONLY_RECEIPT.md`.
- Test output in PR CI; runtime diagnostics emit `event:pattern_grounding_reject`.

## Known Gaps

- Wiring is scoped to the Lakeshore brief binder. Apex/other tenant binders and
  the Move-artifact/citation builders are not yet routed through the guard
  (follow-up).
- The guard depends on the genome `LSH-TMS-*` rows being present; if absent,
  treasury cards bind nothing (fail closed) rather than an off-namespace pattern.
- Separate follow-up: the corpus DB (8,987 `pat-lsh-*`) and the runtime index
  (12 `LSH-TMS-*`) hold different Lakeshore pattern sets; decide which is
  canonical and reconcile.
