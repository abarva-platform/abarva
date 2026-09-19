# 2026-09-19-duplicate-markdown-manual-mocks — One manual mock per package, so the test config's declared mapping is the one that runs

## Release ID

`2026-09-19-duplicate-markdown-manual-mocks`

## Status

`candidate`

## Plain-English Summary

The markdown export pipeline turns a markdown body into DOCX, HTML and PDF. Three of the
libraries it depends on cannot be loaded directly by the test runner, so the test
configuration maps each of them, by name, to a hand-written stand-in that parses a small
subset of markdown. That stand-in is what makes the export tests meaningful: without it they
would be asserting against an empty document.

A second directory of stand-ins existed for the same three libraries, and those ones returned
an empty document for every input. The test runner looks up hand-written stand-ins before it
applies the name mapping from the configuration, so the duplicates outranked the configuration
entirely. The runner printed a `duplicate manual mock found` warning to stderr and picked one
arbitrarily — and for the markdown parser it picked the empty one. The configuration said one
thing and the runner did another, with nothing failing at the point of the mistake.

The visible consequence was 21 failing tests across three export suites, sitting red. They were
not noticed because that directory is not covered by any of the scoped test scripts or by any
CI workflow, so nothing ran them.

This change deletes the three duplicate stand-ins, which leaves exactly one per library — the
one the configuration names — and adds a test that asserts the invariant directly, in the tree
CI does run.

## Layer Impact

Release lane: **global-control-lane** — shared app/control-plane tooling, applying to all
clients, not feature-gated. It ships in that lane because the test configuration is shared
across the whole application; it carries no client-visible behaviour with it.

- **Layer 4 (Products):** No product behaviour changes. The deleted files are test-only
  stand-ins; they are never loaded outside the test runner, so no route, component, agent
  prompt, stored value or rendered export differs before and after.
- **Test/tooling:** The export suites now assert against a real parse instead of an empty
  document, and a new behavioural test fails if any package is ever manually mocked twice.

Layers 1–3 (client intake, source adapters, canonical model) are untouched.

## Client Applicability

- All clients: no change — no product code is modified.
- Specific clients: none.
- Internal only: yes — test configuration correctness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Deleted `src/lib/exports-shared/__mocks__/mdast-util-from-markdown.ts`
- Deleted `src/lib/exports-shared/__mocks__/mdast-util-gfm.ts`
- Deleted `src/lib/exports-shared/__mocks__/micromark-extension-gfm.ts`
- Added `src/__tests__/behaviors/markdown-manual-mock-resolution.test.ts`

No product source file changed. `jest.config.ts` was not modified — its mapping was already
correct and is now the mapping that actually takes effect.

## QA / Validation

**Re-verified on clean `origin/main` `e8086ea15` before any edit, empirically rather than by
reading.** A probe test importing the parser returned `{"type":"root","children":[]}` — the
empty stand-in — proving the duplicate outranked the configured mapping.

**Red first, then green.** The new test was written before the fix: **2 failed / 1 passed**
against the duplicated tree. After deleting the duplicates it was extended to 7 cases and is
**7 passed / 0 failed**.

**Mutation-checked — the test fails when the fix is undone.** Each mutation was applied to a
clean tree and reverted afterwards; the tokenizer file was confirmed byte-identical after each
revert via an empty `git diff`.

| Mutation | Result |
|---|---|
| Re-add a duplicate stand-in for the parser | 3 failed / 4 passed |
| Re-add a duplicate for the first GFM extension only | 2 failed / 5 passed |
| Re-add a duplicate for the second GFM extension only | 2 failed / 5 passed |
| Duplicate an unrelated package's stand-in (the general case) | 1 failed / 6 passed |
| Break the tokenizer's heading branch | 1 failed / 6 passed |
| Break the tokenizer's table branch | 1 failed / 6 passed |

The middle mutations matter and shaped the test. An earlier draft asserted resolution via the
runner's own resolver, which caught the parser case but **not** the two extension cases: the
runner's choice of winner among duplicates follows crawl order and was observed to pick
correctly for one package and incorrectly for another in the same repo. Asserting one of the
symptoms was therefore not enough, so the test also asserts the invariant itself — a package
may be manually mocked once — which holds regardless of which duplicate happens to win.

**Scope baseline, identical scope before and after** (`src/lib/source/exports`,
`src/lib/exports-shared`, `src/__tests__/behaviors`):

- Before: 3 suites failed / 46 passed; **22 tests failed** / 520 passed.
- After: 1 suite failed / 49 passed; **1 test failed** / 548 passed.

The single remaining failure, `artifact-verdict-consistency.test.ts` ("an award-ready event
reads consistently as Award / proceed" — expected `Award / proceed`, received
`Pending — Evaluation / BAFO / Decision`), fails identically before and after. It is a Source
verdict-kernel assertion unrelated to markdown parsing and is **not** caused by this change; it
is recorded as a separate backlog item rather than touched here.

**Repo-wide sweep:** `jest --listTests` reported exactly three duplicated manual mocks before
this change and none after.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics, run with `tsconfig.tsbuildinfo` deleted first so no stale incremental state
  could mask or invent an error.
- `npx eslint` on the new test — **exit 0**, no output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded below.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow will build and deploy as it does for
any merge. There is no runtime rollout in the meaningful sense: the change is test-only, so the
deployed image differs only by the absence of three files the runtime never loads.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by hand as part of this release.
- Approved image digest: produced by the merge deploy run; recorded in the claim log after the
  run completes.
- ACA runtime invariant: to be proven after the deploy run — Container App template image ==
  100%-traffic revision image, digest-pinned.
- Worker image invariant: to be proven on the same digest for the non-manual worker jobs.
- Feature/env flag update path: not applicable; no flag or environment variable changes.
- Live signed-in proof required: **no**, and the reason is specific rather than a wave-through.
  The four changed paths are three deleted test-only stand-ins and one new test. No product
  code is touched, so every route response, rendered surface and stored value is identical
  before and after; there is no surface a signed-in session could observe a difference on. The
  proof that belongs to this change is the mutation set and the CI job, both captured above.

## Rollback Plan

Revert the PR. The three deleted files are restored by the revert and the tree returns to its
prior state exactly, including the 21 failing export tests. No migration, no data change, no
flag to unset.

## Audit Evidence

- PR and its CI run — the new test confirmed **executing** in the real `Behavior coverage floor`
  job, not merely present in the tree.
- The before/after scope baselines and the six-mutation table above.
- `jest --listTests` duplicate-mock sweep, before and after.
- Typecheck and lint exit codes above.

## Known Gaps

- `src/lib/source/exports/__tests__` is run by **no** npm script and **no** CI workflow. The
  three suites this change repairs are still invisible to CI; they would go red again without
  anything failing. Widening the scoped test scripts is backlog item 26 and is deliberately not
  attempted here — this change instead places its own control in `src/__tests__/behaviors`,
  which CI does run. Logged as a further instance of that failure mode.
- `artifact-verdict-consistency.test.ts` has one pre-existing unrelated failure, described
  above and logged to the backlog. Not touched.
