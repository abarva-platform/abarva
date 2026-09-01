# 2026-09-01-home-deferral-matched-by-shape — Match a build state by shape, and test the served path

## Release ID

`2026-09-01-home-deferral-matched-by-shape`

## Status

`candidate`

## Plain-English Summary

An earlier change stopped chapters leading with the narrative generator's own status. Opening the
deployed page afterwards, two build states were still on it:

- the headline read `Executive Brief is deferred pending verified claims`
- a chapter limitation read `Do not infer executive narrative from projection counts alone; publish
verified chapter claims before using this chapter in a CXO readout.`

Both come from the **served** build path. Every test in the suite renders the **stored copy**, which
is produced by a different function and never writes those sentences. No fixture could reach the
branch, so the suite stayed green while the live page carried the defect.

Two fixes: match the phrasing by shape rather than by a list of known sentences, and render the
served path in tests so the branch is reachable.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** the deferral gate, and two authored strings in the served-path builder.

## Client Applicability

- All clients reading the served Home path.
- Feature flag: none.

## Changes Included

- `cxo-language.ts` — the gate matches `deferred pending <anything>`, `not ready for executive
<anything>`, and a small set of stock refusals that do not fit that shape. The previous version
  listed the exact sentences one generator emits; a second generator says "verified claims" where
  the other says "stronger evidence", and that one word put a build state in the headline position.
- `ecl-projection-bundle.ts` — three authored strings rewritten to state what is true of the record
  rather than to instruct the reader, and without naming internal artefacts.
- `__tests__/served-record-surface.test.tsx` (new) — renders the served path and holds it to the
  same rules. 7 test cases.
- `__tests__/text-encoder-polyfill.ts` (new) — jsdom lacks `TextEncoder`, which the served-path
  builder needs at module load.
- `__tests__/ecl-projection-bundle.test.ts` — the assertion pinning the old limitation wording now
  pins the new one, and additionally asserts the sentence names no internal artefact.

### Why this kept happening

The same failure twice in one day: a rule enforced against a **list of known instances** rather than
against the **shape of the thing**, and a test that renders one build path while a second path ships
unexercised. The machine-identifier gate shared one half of this defect; this one had both.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__ src/lib/home/preview/__tests__` — **213/213**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- **Mutation-tested:** with the gate reverted to the previous phrase list, the new suite fails
  **7 of 7**. Restored, it passes 7 of 7. The suite can reach the branch and does fail on the real
  defect.

## Rollout Plan

Merge to main and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The gate returns to the phrase list and the two strings to their prior wording.

## Audit Evidence

- Live page read-out showing both build states before the change.
- Mutation-test result above.

## Known Gaps

- The generators still emit these sentences; the surface refuses them. Changing what is generated is
  a data-build change.
- The provenance stamp still names a physical table rather than the read API that is queried.
