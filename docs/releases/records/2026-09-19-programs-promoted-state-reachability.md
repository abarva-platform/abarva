# 2026-09-19-programs-promoted-state-reachability — The pattern gate was gating on states that cannot exist

## Release ID

`2026-09-19-programs-promoted-state-reachability`

## Status

`candidate`

## Plain-English Summary

A change merged earlier today added a check that a pattern key must be "promoted" in the pattern
catalogue before a program may record it as a match. The check is right and stays. The list of
promoted states it used is not: it named `published`, `validated` and `active`, and the database
column it reads is constrained to `draft`, `pilot`, `mature` and `deprecated`. None of the three
states it accepted can ever exist.

Because every caller treats a refusal as fatal, that gate refused every pattern key that exists.
Creating a program with a pattern was refused outright — the agent returned "that pattern is not an
active Programs pattern" for a perfectly valid pattern, and the API route threw before the program
was written.

This corrects the list to the states the column can hold and adds a check that reads the database
constraint itself and fails if the two ever disagree again.

It also repairs the same mistake in a second place: the pattern classifier's own catalogue query
filtered on the same three impossible states, so it returned nothing for every input and could not
match a pattern at all. That one is older than today's change and was not caused by it.

## Why every test passed while this was broken

Each test supplies the resolver with its own catalogue-lookup function, so a test can hand it a row
the database could never produce — and the suites did exactly that, asserting that a row with
`promotion_state: "published"` resolves. The assertion was true about the function and false about
the product. Nothing compared the accepted states against what the column permits, so nothing could
notice. The new suite makes that comparison, and the older suites now derive their states from the
module instead of restating them.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behavior for all clients, not gated.

- **Layer 3 · Canonical model** — the promoted-state vocabulary for `engagement_topics` is now the
  vocabulary the column is constrained to. No schema change.
- **Layer 4 · Products (Moves)** — program origination through the agent, the API route, and the
  origination form. Restores the ability to create a program from a matched pattern, and restores
  classifier matching.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/pattern-authority.ts` — `PROMOTED_PATTERN_STATES` corrected to `pilot` and
  `mature`, exported so it can be checked and reused rather than restated.
- `src/lib/programs/classifier.ts` — the corpus query selects on that shared list instead of the
  three unreachable states.
- `src/lib/programs/__tests__/pattern-authority-reachability.test.ts` (new) — the constraint check,
  the round-trip for each reachable promoted state, the refusal for each reachable unpromoted state,
  and the classifier corpus claim.
- `src/lib/programs/__tests__/pattern-authority.test.ts` — derives its states from the module, with
  the reason recorded. No assertion removed.
- `src/lib/agent/tools/__tests__/commitProgram.test.ts` — its `promotion_state` fixture now names a
  reachable state.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step; these suites ran in no
  workflow.

## QA / Validation

**Failing first, identical files either side.** With the constant exported but its value unchanged,
the new suite ran **5 tests, 1 failed / 4 passed**; after the correction, **6 / 0 failing** (the
sixth is the classifier case, added with its fix). The single failing case is the whole defect:
`promotes only states the promotion_state column can hold`.

Worth stating plainly, because it is the argument for the check: the other four cases *passed on the
broken code*. "Accepts a key in every promoted state" passes by feeding the resolver a fabricated
row; "refuses every unpromoted state" passes because, with the broken list, every reachable state was
unpromoted. Only the comparison against the constraint could fail.

**Scope baseline, same command either side** (`npx jest src/lib/programs src/lib/agent/tools
--runInBand`), taken by restoring the changed files to `origin/main`: **269 suites / 6 failed and
3,664 tests / 7 failed → 270 suites / 6 failed and 3,669 tests / 7 failed.** The six failing suites
are byte-identical to the baseline set and none is touched here.

**Eight mutations, eight caught**, each file byte-restored afterwards and the restore confirmed with
`diff -q`: restore the three unreachable states (the defect as shipped — 2 cases fail); promote the
authoring state; promote the retired state; stop checking the promotion state at all; make a missing
catalogue row resolve; restore the impossible states in the classifier corpus; drop the classifier's
promotion restriction entirely; bind an unreachable state as the classifier's parameter.

- `npm run typecheck` — exit 0, `typecheck: clean.`
- `npx eslint` over the changed files — exit 0, no output.
- The appended workflow step parses under a real YAML loader, resolves to the intended command, and
  that exact command was executed: 3 suites / 13 tests passed. It will be confirmed **executing** in
  the real CI job before merge, not merely present.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the pull request.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys. No migration, no data
build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the pull request after the deploy run completes.
- ACA runtime invariant: to be read back live — Container App template image == the 100%-traffic
  revision image == both worker job images, digest-pinned, read in one call.
- Worker image invariant: unchanged by this release; asserted at readback.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and owed.** This restores a blocked write path. A signed-in
  origination carrying a pattern key should be captured before it is called `live-proven`.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned workflow. This would restore the state in
which origination with a pattern key is refused, so a revert should be paired with reverting the
change it remediates rather than done alone.

## Audit Evidence

- Pull request and squash-merge SHA.
- The `AI surface control catalog` job's step output for `Exercise the Programs pattern authority`.
- The deploy run, ACA revision, and digest readback.
- Backlog item 126 and its verdict entry.

## Known Gaps

- **How long the break was live is not established here.** The change that introduced it merged
  earlier the same day; the window is short but was not measured, and no telemetry was inspected for
  refusals that reached a user.
- **The promotion-state vocabulary is still split across the product.** `/api/v1/programs/patterns`
  calls `pilot` and `mature` "client visible"; this release makes them "promoted" as well. Whether
  `pilot` should be citable as a match, or only `mature`, is a product call left open.
- **Refusal is still fatal on every writer, and that design is unchanged here.** A caller-supplied key
  that does not resolve blocks the whole submission rather than being dropped. That is defensible for
  an agent that can tell the user, and less obviously right for the API route, where it surfaces as a
  server error. Not changed in a remediation.
- **The classifier repair is proven by unit test, not against a live catalogue.** That it no longer
  filters on impossible states is proven; that it returns useful matches for a real tenant needs the
  signed-in check named above.
