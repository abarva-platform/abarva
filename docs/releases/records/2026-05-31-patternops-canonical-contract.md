# 2026-05-31-patternops-canonical-contract — PatternOps Canonical Contract

## Release ID

`2026-05-31-patternops-canonical-contract`

## Status

`candidate`

## Plain-English Summary

Adds the first code-backed PatternOps contract so AbarVa can operate the knowledge layer as a governed product asset. This is the foundation for Pattern Library, coverage maps, pattern promotion, grounding drawers, and missing-pattern detection without creating a heavy training/admin module.

## Layer Impact

`intelligence-lane`: Defines how trusted industry, use-case, failure-mode, artifact, and value patterns should be represented before agents use them.

`moves-lane`: Defines phase, artifact, value, and promotion metadata needed for Nexus to guide Move work from evidence to reusable patterns.

`source-lane`: Establishes source-basis and evidence classes that Source can use later for vendor, sourcing, and contract pattern grounding.

`global-control-lane`: Adds product doctrine and lifecycle states for steward review, confidence, retirement, and supersession.

## Client Applicability

- All clients: receive the shared PatternOps contract once later retrieval/UI slices wire it into runtime behavior.
- Specific clients: none.
- Internal only: this slice is internal foundation plus product doctrine.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/patternops/canonical-pattern-contract.ts`
- `src/lib/patternops/canonical-pattern-contract.test.ts`
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part4.ts`
- `docs/product/PATTERNOPS_PRODUCT_DOCTRINE.md`
- `docs/releases/records/2026-05-31-patternops-canonical-contract.md`

## QA / Validation

- PASS — `npx jest src/lib/patternops/canonical-pattern-contract.test.ts --runInBand`
- PASS — `npx eslint src/lib/patternops/canonical-pattern-contract.ts src/lib/patternops/canonical-pattern-contract.test.ts`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED — `npx tsc --noEmit --pretty false` now fails only on pre-existing missing optional package declarations for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`. The generated banking seed type error from latest `main` was removed in this slice.

## Rollout Plan

Merge to `main`; no migration or runtime feature flag is required. Follow-up slices should wire this contract into PatternOps coverage, pattern-first retrieval, and grounding basis UI.

## Rollback Plan

Revert the PR. The contract is additive and does not change runtime behavior or database state.

## Audit Evidence

PR URL, CI checks, focused Jest output, ESLint output, release-control output, and `git diff --check` output.

## Known Gaps

This slice does not add the Pattern Coverage Dashboard, pattern-first runtime retrieval, Pattern Basis drawer, Pattern Promotion workflow, or Corpus Health review queue. Those are follow-up slices.
