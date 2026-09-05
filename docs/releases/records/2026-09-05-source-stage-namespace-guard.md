# 2026-09-05-source-stage-namespace-guard — Guard the boundary between Source stage vocabularies

## Release ID

`2026-09-05-source-stage-namespace-guard`

## Status

`candidate`

## Plain-English Summary

This started as a drift audit. A recent fix corrected transformation phase names that had been hand-typed in several places and had diverged from the phases the product actually runs. Sourcing stages were the obvious next place to look for the same mistake.

Sourcing does not have that problem, and the audit is the finding.

There are two sourcing stage vocabularies, and both are correct. The product runs an eleven-stage sourcing event. Separately, the industry pattern corpus describes sourcing archetypes, and each archetype declares its own lifecycle — a managed-services lifecycle runs through planning, award, and onboarding; a framework call-off runs a mini-tender. Those are descriptions of how the market works, not a second definition of the product's stages. Making them agree would destroy the corpus.

The risk is not divergence. It is that the two vocabularies partially overlap: four words appear in both and mean different things, while more than thirty appear only in the corpus. An answer that mixes them reads as coherent precisely because of the shared words, which is what makes the confusion hard to notice rather than obvious.

This change adds no renames. It pins the overlap so that a new collision has to be a deliberate decision rather than an accident, and it asserts the two vocabularies have not quietly merged.

## Layer Impact

Release lane: `global-control-lane` — test coverage for shared vocabulary boundaries. No runtime change.

- Layer 4 (Products — Source, Intelligence): no behaviour change; coverage only.
- Layer 3 (Canonical model): unchanged. Both vocabularies are read, neither is modified.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: no behaviour reaches any client from this change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/__tests__/source-stage-namespace-collision.test.ts` — new. Pins the overlap between the product stage labels and the pattern lifecycle stage labels to the known set, asserts the corpus still holds stages the product does not, and asserts every canonical stage resolves to a label.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-stage-namespace-collision.test.ts` — 3 passed.
- Mutation-tested: relabelling one corpus lifecycle stage to a product stage name fails the overlap assertion. The guard detects a new collision rather than only describing today's state.
- `npx jest src/lib/source src/lib/intelligence` — 3205 passed, 87 failed. All 87 failures are pre-existing on the base commit, verified by stashing and re-running (3202 passed, identical failing suites). No suite regressed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — 0 errors repo-wide.
- `npx eslint` on the added file — clean.

## Rollout Plan

Merge to main via PR (squash). Test-only; no runtime rollout, no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: unaffected by a test-only change.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. This adds no client-visible behaviour.

## Rollback Plan

Revert the PR. Test-only, so revert carries no runtime or data risk.

## Known Gaps

- The guard pins the vocabulary boundary in code. It does not stop an answer from presenting a corpus lifecycle as the product's stage list, which is the failure this audit was really worried about. That belongs in the answer contract as an evidence-class rule — corpus lifecycle stages are industry pattern context and must be labelled as such — and is not addressed here.
- An earlier pass at this measurement used text matching and reported five shared words. Reading the exported seeds directly gives four; the text-matching approach was also picking up identifiers that are not lifecycle stages. Any future analysis of these vocabularies should import them rather than scan for them.
- Only the six authored sourcing patterns are covered. Patterns added later are included automatically only if they are added to the list the guard imports, which is itself hand-maintained and is the same weakness this class of guard exists to remove.
- Stage keys appear as bare string literals in some components rather than typed against the canonical key union. Those are correct today and were left alone, but they are not type-checked, so a typo would not be caught.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
