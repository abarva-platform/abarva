# 2026-09-25-t617-atlas-redundant-brand-scrub — Remove the duplicated agent-name rewrite from the Tower renderer

## Release ID

`2026-09-25-t617-atlas-redundant-brand-scrub`

## Status

`candidate`

## Plain-English Summary

The user-facing assistant identity is `aVa`. An internal engine name must never reach the
screen, and until now three separate layers each rewrote or rejected it on the Tower answer
path: the shared response shaper, then the Tower renderer, then the visible-answer contract
that blocks the reply with a 422 if the name survives.

The middle one did nothing. The renderer runs only on text the shared shaper has already
returned, so its own rewrite had no input left to act on. That matters more than a wasted
regular expression: a property defended three deep is a property no test can attribute. The
suite already asserted that the rendered answer does not carry the name, and that assertion
passed no matter which layer was doing the work — so if the real guard were ever removed, the
test would stay green and nobody would learn anything.

This release deletes the one duplicated line and pins the property at the two layers that
actually hold it, one test each, so each test now fails when its own layer breaks. Nothing a
user sees changes: the rendered answer is identical, character for character, on every one of
3,078 constructed inputs.

## Layer Impact

Release lane: `global-control-lane` — shared Tower answer-rendering behavior for all clients,
not feature-gated. It ships in that lane because the code path is shared; the observable
change in it is none.

- **Layer 4 — Products (Tower answer rendering).** One redundant text rewrite removed from
  `src/lib/atlas/rendered-response.ts`. Output is byte-identical; no behavior change.
- **Layers 1–3 (intake, adapters, canonical model).** Untouched. No tenant data, schema,
  loader, migration or projection is involved.

## Client Applicability

- All clients: yes — the Tower answer path is shared — but the observable change is none.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional and output-neutral.

## Changes Included

- `src/lib/atlas/rendered-response.ts` — delete the duplicated agent-name rewrite inside
  `normalizeAtlasVisibleText`. The five rewrites in that function that have no upstream
  equivalent are deliberately left alone; they are the item's stated remainder.
- `src/lib/atlas/__tests__/rendered-response.test.ts` — add eleven tests that name the layer
  holding the property, and a comment recording why the pre-existing route-level assertions
  could not.

No route, schema, migration, dependency, workflow or configuration file changes.

## QA / Validation

**Clean baseline, same command and same scope on both sides.** The "before" side is a
separate detached worktree checked out at `origin/main` `9fdf99ccc` — not a stash.

| scope | before | after |
|---|---|---|
| `src/lib/atlas/__tests__`, `src/lib/answer/__tests__`, the five shared-shaper behavior suites | 14 suites, **83 passed / 0 failed** | 14 suites, **94 passed / 0 failed** |
| `src/lib/atlas/__tests__/rendered-response.test.ts` alone | 3 passed | 14 passed |

**The redundancy, measured rather than asserted.** On unmodified `main`, with the renderer's
line still present, removing the engine name from the shared shaper's `BANNED_BRAND_RE` left
that file's suite at **3 of 3 passing**. The same mutation against this branch fails **10 of
14**. That difference is the point of the change: the same break is now visible where it was
previously absorbed.

**Deletion proven a no-op over a corpus, not over one example.** A harness drove
`buildAtlasRenderedResponse` over 3,078 constructed inputs — three intents × six messages ×
nineteen forms of the name (bare, punctuated, possessive, hyphenated, emphasised, code-spanned,
upper case, lower case, embedded in a longer word, repeated, alongside the other two engine
names) × nine carriers (short prose, four-section shape, bullet list, numbered list, pipe
table, a body long enough to force compaction, and the bare token). 2,754 of the inputs carried
the name. Rendered output compared byte for byte with and without the deleted line:
**0 rows differ, 0 rows carry the name, 0 contract failures.** The harness was a measurement
instrument and is not committed; its numbers are here and in the pull request.

**Fail-closed proven in the other direction.** With the deleted line gone *and* the shared
shaper's rule for this name removed, 2,268 of the 3,078 rows carry the name into the visible
answer — and **all 2,268 fail `assertVisibleAnswerContract`**, which is what makes
`/api/v1/atlas/ask` answer 422. Zero rows leak. The third layer holds on its own.

**Mutation battery — four run, three caught, one survivor reported rather than hidden.** Each
mutation was confirmed by `sha256` to have changed its file before its suite ran, so no
result is a no-op reading as coverage.

| # | mutation | outcome |
|---|---|---|
| M1 | the engine name removed from the shared shaper's brand rule | **caught** — 10 of 14 fail |
| M2 | the visible-answer contract's brand rule made unmatchable | **caught** — 1 of 14 fails |
| M3 | a *neighbouring* renderer rewrite deleted instead of the intended one | **caught** — 1 of 14 fails |
| M4 | the shared shaper's **second** brand pass removed, first left in place | **SURVIVED** |

M3 exists because the risk in this change is deleting the wrong line, and a test that cannot
tell the two apart would not have caught that.

M4 is a real finding and is filed, not fixed here: the shared shaper applies its brand rule
twice, and removing the second application passes all 14 tests in this suite **and** all 45
tests across all six shared-shaper suites. That is the same shape as this item, one layer
upstream, and it is out of this item's scope. Filed as `C-517`.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged
  by exit code with `tsconfig.tsbuildinfo` removed first, zero diagnostics.
- `npx eslint` on both changed files — exit 0, zero warnings.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the pull request.

## Rollout Plan

Squash merge to `main`. The repo-owned `aca-main-deploy` workflow builds the image and shifts
traffic; no manual Azure command, no migration, no flag, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded in the pull request after the deploy run keyed to the merge
  SHA completes.
- ACA runtime invariant: to be proven by reading the Container App template image and the
  image of the 100%-traffic revision and showing they are the same digest.
- Worker image invariant: not applicable — no worker job code changes. Stated rather than
  quietly skipped.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and none is claimed.** The change is proven
  output-identical over 3,078 rendered answers, so a signed-in pass would be a proof with no
  subject. If the rendered text had moved by one character this line would read the other way.

## Rollback Plan

Revert the single commit. The change is one deleted line and a test file; there is no
migration, no data write and no configuration to unwind.

## Audit Evidence

- The pull request, its diff and its CI run.
- The before/after suite counts above, each taken with the same command over the same scope.
- The four mutation results, each with the `sha256` change confirmed before the suite ran.
- The corpus sweep counts: 3,078 rows, 2,754 carrying the name, 0 differing, 0 leaking, and
  2,268 of 2,268 failing closed when both upstream layers are removed.
- The deploy run keyed to the merge SHA and the digest comparison recorded on it.

## Known Gaps

- **`C-517`, filed from this work:** the shared response shaper applies its brand rule twice
  and the second application is unguarded — removing it passes every test in all six
  shared-shaper suites. Unguarded is not the same as redundant: the second pass may exist for
  an input that label replacement or compaction can produce and that no current test builds.
  Which of the two it is has to be settled by measurement before anything is deleted.
- **The other five renderer rewrites are untouched**, as the item requires. Each needs its own
  upstream check and they are the honest remainder of this work.
- **The pre-existing route-level assertions are kept, not tightened.** They are true and worth
  keeping; the layer-naming tests added here are what make the property attributable. No test
  was weakened or removed.
