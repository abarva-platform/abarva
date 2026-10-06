# 2026-10-06-risk-factor-vocabulary-declared-archetype — Risk factors are asked in the declared archetype's words

## Release ID

`2026-10-06-risk-factor-vocabulary-declared-archetype`

## Status

`candidate`

## Plain-English Summary

A Move's Risk Assessment asks thirteen questions — five structural dimensions (D1-D5) and eight
escalators (E1-E8) — and will not save until all thirteen are answered. The scoring model behind
them is domain-neutral, but the wording was not: three of the escalators were phrased for one
subject domain only, and every Move was asked them in that wording regardless of the archetype it
had declared. A Move whose declared archetype is a governed data foundation was therefore asked to
rate a decision belonging to a different field of practice, and a different kind of audience
exposure, before it could record a risk assessment at all.

The thirteen factors now follow the archetype the Move has DECLARED. A new catalog
(`src/lib/programs/risk-factor-vocabulary.ts`) holds the wording per archetype; the read route
serves the resolved declaration and the panel asks the factors in those words. The shipped wording
is the fallback, so a Move that has declared nothing, or declared an archetype with no entry, is
asked exactly what it was asked before — word for word.

Two invariants keep the wording safe to configure, and both are tested:

- A catalog entry is an overlay of question text, never a field list. Every resolved vocabulary
  covers exactly the same thirteen keys in one fixed order, so a configured archetype cannot drop,
  add or reorder a factor, and the save is still held until all thirteen are answered.
- Nothing in the catalog reaches the stored value or the score. The charter JSONB keys and
  `computeRiskTier` are untouched, so an assessment saved under one wording reads back identically
  under another, and the same answers tier identically whatever the Move declared.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for every client, gated by the existing
`moves_risk_tier_scoring_v1` flag, with no client-scoped schema, seed, ingestion or data-plane
change.

- **Layer 4 (Products — Moves):** the P2/P3 Risk Assessment workspace surface asks its thirteen
  factors in the declared archetype's wording. Prompt text only.
- **Layer 3 (Canonical model):** unchanged. No new column, no new JSONB key, no schema change. The
  stored risk-tier inputs keep the same keys and the same thirteen-field requirement.

No change to layers 1 or 2.

## Client Applicability

- All clients: yes — the resolution is per-Move, by declared archetype, not per client. A Move that
  declares nothing sees the shipped wording, so the default experience is byte-identical.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: rides the existing `moves_risk_tier_scoring_v1` (no new flag). Where that flag is
  off, the surface does not render and nothing here is reachable.

## Changes Included

- `src/lib/programs/risk-factor-vocabulary.ts` (new) — the shipped wording, the per-archetype
  overlay catalog, the id normaliser and `resolveRiskFactorVocabulary`.
- `src/app/api/v1/programs/[programId]/risk-assessment/route.ts` — GET serves
  `archetypeId: resolveDeclaredProgramArchetypeId(program)` alongside the existing inputs/result.
  POST, its validation and the write path are unchanged.
- `src/components/strategic-moves/risk-assessment/RiskAssessmentPanel.tsx` — the two hardcoded
  prompt tables are replaced by the resolved vocabulary; the required-key list is taken from the
  module's fixed key arrays so the submit and dirty-state logic cannot depend on the wording.
- `src/lib/programs/__tests__/risk-factor-vocabulary.test.ts` (new, 13 cases).
- `src/app/api/v1/programs/[programId]/risk-assessment/__tests__/route.test.ts` (new, 7 cases).
- `src/components/strategic-moves/risk-assessment/__tests__/RiskAssessmentPanel.test.tsx` — 8 cases
  added; the 5 existing cases are unchanged and still pass against the shipped wording.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no script, no workflow change.

## QA / Validation

- **PASS** `npx jest --testPathPatterns risk-factor-vocabulary risk-assessment risk-tier
  p2-risk-tier` — 5 suites, 59 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over every changed path — exit 0, no findings.
- **PASS** mutation testing, 12 of 12 killed. Two of the twelve first SURVIVED and the tests were
  strengthened until they died, which is recorded here because each gap was real:
  - dropping the declaration from the GET response survived the panel's own suite, because that
    suite mocks `fetch` and cannot see the route end of the wire — the route suite was added for
    it;
  - dropping either half of the required-key list survived, because the save was only ever asserted
    at zero answered and at thirteen. Both partial fills are now asserted, in both orders: a
    required-key list built from one of the two key arrays satisfies the other order's assertions
    on its own.
- **PASS** census regenerated with `npm run audit:test-ci-coverage:write`; reports "committed census
  matches this run". Delta `testFiles` +4 / `coveredTestFiles` +4 / uncovered unchanged. Two of the
  four are this change's new suites; the other two are pre-existing drift between the committed
  census and main's tree, carried in by the regeneration.
- **PASS** `npm run audit:tenancy-fence-coverage:write` — no fence change (no new data-plane read).
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** signed-in walk. This cannot be rendered signed-in off the private data plane from a
  dev box; it needs an authorized operator. See Deployment Authority.

## Rollout Plan

Merge to main (squash), then the repo-owned ACA main deploy workflow. No migration to apply, no
flag to flip, no environment variable to set. Behaviour changes only for a Move whose declared
archetype has a catalog entry; every other Move is asked the same thirteen questions in the same
words as before.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. No other lane touches this.
- Shared runtime mutators: none. This change issues no Azure command and alters no Container App
  template, revision weight, scale rule, secret or environment variable.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: to be proven by the deploy workflow in the usual way — template image,
  100%-traffic revision image and required worker job images all matching the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none. Rides the existing `moves_risk_tier_scoring_v1` registry
  entry, which this change does not edit.
- Live signed-in proof required: YES before this may be called `live-proven`. An authorized
  operator opens a Move whose archetype is declared, at P2 or P3, and confirms the thirteen factors
  are asked in that archetype's words, that the save is still held until all thirteen are answered,
  and that a previously saved assessment reads back unchanged. This record claims `merged` and
  `deployed` only.

## Rollback Plan

Revert the squash commit. The change is additive and stateless: the new module has no callers
outside the two files above, the route's extra response field is ignored by an older client, and no
stored data is written in a new shape — so a revert restores the shipped wording with no data
migration and no cleanup. An assessment saved while this was live is keyed exactly as before and
reads back correctly after a revert.

## Audit Evidence

- PR URL and its CI run (recorded on the PR).
- The mutation log above, with the two survivors named and the cases that killed them.
- `docs/architecture/test-ci-coverage-census.json` diff.
- The route suite's case asserting that a declared Move and an undeclared Move with identical
  answers return an identical `result` — the evidence that wording cannot move a score.

## Known Gaps

- **The wording of the catalog's one entry is a product call, not source material.** The replacement
  question text is this change's own generalisation of the shipped factors, and no reviewer has
  signed off on the vocabulary. It is a one-file edit in
  `src/lib/programs/risk-factor-vocabulary.ts` and nothing is recorded against the words, so it can
  be re-worded at any time without touching a stored assessment. Same class of gap as the platform-
  fit option labels.
- **One archetype has an entry.** Every other archetype resolves to the shipped wording, which is
  correct-by-default for the domain it was written for and generic-but-imperfect elsewhere. Adding
  an entry per archetype is additive and needs no code change beyond the catalog.
- **The catalog is in code, not configuration.** Consistent with the other declared-archetype joins
  today. Moving it behind the validated config loader is the same migration those will take.
- **The eight escalator keys keep their original names in storage** (`e1PhiExposure`,
  `e3ClinicalDecisioning`, `e8PatientFacingExposure`). This is deliberate: renaming them would
  require a charter JSONB migration and would break every saved assessment for no user-visible
  gain, since nothing shows a key. The wording a user sees is fully decoupled from them.
- No signed-in walk has been performed. See QA / Validation.
