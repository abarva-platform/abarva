# 2026-09-20-census-reads-side-effect-imports — Coverage census reads a bare side-effect import as a product edge

## Release ID

`2026-09-20-census-reads-side-effect-imports`

## Status

`candidate`

## Plain-English Summary

The test-coverage census ranks directories of unrun tests by how much governed
behaviour they touch, so that whoever wires the next suite into CI starts with
the riskiest one. It works out what a test touches by reading the test's import
statements.

It was missing one form of import. `import { POST } from "../route";` was read
as an edge to that module; `import "../route";` — which loads and runs the
module just the same, and is how a test pulls in something for its side effects
— was read as nothing at all. A directory whose only link to a governed module
took that form scored zero and was filed as `unclassified`. The ranking
therefore under-stated risk, which is the direction that sends someone to the
wrong directory first.

This teaches the census to read that form, and pins the behaviour with a test
that holds one module through both import shapes so the only thing that can
differ between them is the shape.

Measured on this repository, the ranking does not move: the new reading adds 27
product edges across 8 test files in 6 directories, five of those directories
already run every test file they hold (so they are outside a ranking about what
is still unrun), and the sixth gains an edge to a module that carries no
governed signal. That is reported here rather than left implied — the gap was
real and is now closed, and nothing currently depends on it.

## Layer Impact

Release lane: `internal-admin` — a repository measurement instrument used by the
team, with no client-facing surface and no data-plane effect.

- Layer 4 (products): none. No product code, route, read model or tenant data is
  touched.
- Tooling/measurement: `scripts/quality/test-ci-coverage-census.mjs`, which
  generates `docs/architecture/test-ci-coverage-census.json` and is run by
  `.github/workflows/ai-surface-control-catalog.yml`. The committed census is
  byte-identical before and after this change, so no regenerated artifact ships
  with it.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a repository measurement instrument
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — adds `SIDE_EFFECT_IMPORT_RE`
  and reads it alongside the existing specifier pattern in
  `importedProductSources`.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — one added case,
  three arms: the side-effect form, the named form over an identical module, and
  a negative control that holds the same specifier in a string and in a comment
  and must stay unclassified.

## QA / Validation

- Failure first, on exact `origin/main` `542989250`: the new case fails with the
  side-effect arm absent from the ranking while the named arm over an identical
  module scores `critical`. This reproduces the reported defect by execution
  rather than by reading the regex.
- After the fix: `npx jest --runTestsByPath
  src/__tests__/behaviors/test-ci-coverage-census.test.ts` — 16 passed of 16,
  including the 15 pre-existing cases unchanged.
- Scope baseline `npm run test:behaviors`, measured on a pristine tree and again
  with the change: **47 suites / 481 tests, 0 failing → 47 suites / 482 tests,
  0 failing.**
- Mutations, both caught: removing the new read loop fails the side-effect arm;
  un-anchoring the pattern to `\bimport\s*["']` fails the negative control,
  which is the assertion that keeps the change from crediting a path the file
  merely mentions.
- Census output compared before and after against this repository: identical
  apart from its timestamp. Counts unchanged at 59 critical / 108 high / 220
  unclassified; zero directories change band; zero change rank.
- Independent measurement of what the new reading adds: 27 resolved product
  edges across 8 test files in 6 directories.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed — **exit 0**, judged by exit status.
- `npx eslint` over both changed files — **exit 0**.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in the deployed image reads this
script, and no migration, flag or environment variable changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  as normal.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime behaviour changes.
- ACA runtime invariant: unchanged by this release; the post-merge deploy is
  verified as usual.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no — there is no user-visible surface.

## Rollback Plan

Revert the single commit. The instrument returns to its previous reading; no
data, migration or artifact has to be undone.

## Audit Evidence

- PR and its CI run.
- The two mutation results recorded above, each naming the assertion that caught
  it.
- The before/after census comparison and the 27-edge measurement.

## Known Gaps

- The census reads imports with regular expressions rather than a parser, so a
  statement that does not begin its line is still missed. That is deliberate and
  is the safe direction: missing an edge under-credits one directory, whereas an
  unanchored pattern would credit prose, which is the error the census's own
  header exists to warn about.
- Backlog item **T-072** remains open on the same theme elsewhere: several
  checks in the PR hygiene gate judge output rather than exit status. Untouched
  here.
