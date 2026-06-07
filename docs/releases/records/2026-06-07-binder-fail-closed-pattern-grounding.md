# 2026-06-07-binder-fail-closed-pattern-grounding — Fail closed on cross-namespace pattern IDs in Intelligence/Move binder

## Release ID

`2026-06-07-binder-fail-closed-pattern-grounding`

## Status

`candidate`

## Plain-English Summary

The Intelligence brief could bind a pattern from the wrong namespace onto a decision card and carry
it into the Move originate flow. Concretely, the Lakeshore "Kyriba global treasury rollout" decision
card bound `PAT-LSH-D18-00479` — a real Lakeshore **corpus** slug (a public-sector _procurement_
pattern), but **not** part of the **treasury** registry (`genome_patterns` / `LSH-TMS-*` /
`lakeshore-patterns-v1`). This is a **cross-namespace mis-binding**, not a non-existent id.

This change adds **grounding-namespace validation** (not generic global existence): a card/Move binds
a pattern only if the pattern's namespace matches the grounding the card requires. Treasury/Kyriba
cards now bind only `LSH-TMS-*` patterns resolved from the treasury registry; off-namespace or
unknown ids **fail closed** (dropped, never emitted into cards, citations, the Shape-as-Move URL, or
the Move's opening message). A diagnostic logs every dropped id.

## Layer Impact

- **global-control-lane:** Intelligence brief binder + Move originate composer behavior. Pure
  validation helper + scoped wiring. No schema, no data, no runtime dependency changes.

## Client Applicability

- All clients: Yes (binder correctness is global). Treasury-namespace resolution is exercised by the
  Lakeshore Kyriba card today; the rule is generic and registry-resolved (no hardcoded ids).
- Internal only: No
- Feature flag: None

## Changes Included

- `src/lib/intelligence-v3/pattern-grounding.ts` (new) — pure namespace classifier, required-grounding
  resolver, `isPatternBindable`, `selectGroundedPattern` (fail closed), `filterCitationsToGrounding`,
  `warnDroppedPatterns`.
- `src/lib/intelligence-v3/lakeshore-live.ts` — load the treasury namespace (`genome_patterns` where
  `code LIKE 'LSH-TMS-%'`); bind each bet from the namespace its use case requires + grounding guard.
- `src/components/intelligence-v4/IntelligenceBrief.tsx` — decision-card lead pattern + Shape-as-Move
  URL use only a grounding-valid pattern; omit `patternId` when none is valid.
- `src/components/strategic-moves/composeOriginateFirstMessage.ts` — defense-in-depth: drop an
  off-namespace inbound `patternId`; never echo it into the Move text.
- Tests: `src/lib/intelligence-v3/__tests__/pattern-grounding.test.ts`,
  `src/components/strategic-moves/__tests__/composeOriginateFirstMessage.grounding.test.ts`.

## QA / Validation

- Targeted tests: `npx jest src/lib/intelligence-v3/__tests__/pattern-grounding.test.ts src/components/strategic-moves/__tests__/composeOriginateFirstMessage.grounding.test.ts` → **12 passed**.
  Cases: (1) known in-namespace id passes; (2) unknown/cross-namespace id rejected;
  (3) Kyriba query binds a real `LSH-TMS-*`; (4) emitted citations cannot reference absent/cross-namespace ids.
- Regression: `npx jest src/lib/intelligence-v3 src/components/strategic-moves` → all green except a
  pre-existing `BoardArtifactsPanel.test.tsx` failure (confirmed failing on the clean tree; unrelated).
- ESLint on touched files: 0 errors, 0 warnings. `tsc --noEmit`: no errors in touched files.
- Live read-only evidence (separate verification): `docs/runbooks/azure-corpus-db-verification-2026-06-07.md`.

## Rollout Plan

Squash-merge to `main`. No runtime deploy/migration required; takes effect on next app deploy. No
data changes.

## Rollback Plan

Revert the merge commit. The change is additive (a validation seam); reverting restores prior binding
behavior. No migration to unwind.

## Audit Evidence

- PR: (this PR) on branch `cursor/binder-fail-closed-pattern-ids`.
- Verification receipt: `docs/runbooks/azure-corpus-db-verification-2026-06-07.md` (DB `abarva_control`,
  `corpus_patterns`=9,026, `genome_patterns`=43,436, `PAT-LSH-D18-00479` absent from treasury registry,
  real `LSH-TMS-*` present).

## Known Gaps

- The brief's general portfolio surfaces (`patternsTriggered`, graph edges) remain corpus-sourced by
  design; only decision-card/Move binding is grounding-scoped here.
- Originate fail-closed currently drops an off-namespace inbound id and notes it; resolving a
  replacement pattern at originate time via live retrieval is a follow-up (the brief already binds the
  correct `LSH-TMS-*`, so the Shape-as-Move URL carries the right id in the normal path).
