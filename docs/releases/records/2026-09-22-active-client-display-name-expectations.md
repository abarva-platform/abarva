# 2026-09-22-active-client-display-name-expectations — Repair and wire the active-client tenant suite

## Release ID

`2026-09-22-active-client-display-name-expectations`

## Status

`candidate`

## Plain-English Summary

A unit suite covering tenant resolution had been failing since 1 July and nobody
found out, because no workflow ran it. The product was right and the test was
stale: three cases pinned display names for synthetic fixture tenants that a
later change deliberately replaced with generic ones, so the assertions were
describing a naming convention the product had already left behind.

This updates those three expectations to the current canonical values, records
in the file itself which changes moved them and when, and then names the suite
by exact path in the workflow that already owns its neighbours. The second part
matters more than the first: repairing a test that nothing runs only resets the
clock on the same silence.

No product code changed. The canonicalization behaviour, the tenant-key lookup
order and the artifact-download retry behaviour are all exactly as they were.

## Layer Impact

Release lane: `global-control-lane` — shared repository tooling, applied to
every client equally, with no client-scoped data or schema in scope.

- **Layer 4 (Products)** — none. No product behaviour, route, read model or
  rendered surface changes.
- **Platform tooling / CI** — the suite moves from "run by no workflow" to
  named by exact path in the existing tenant/governance step of
  `Unit suites`. The committed coverage census is refreshed to match.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — test expectations and CI wiring only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/__tests__/active-client.test.ts` — three stale display-name
  expectations updated to the current canonical values; one case title that
  quoted the old literal reworded so it cannot rot the same way; one fixture row
  name changed from the canonical value to a registered alias, so the case
  still proves canonicalization rather than pass-through (see QA below); a
  header comment recording the provenance of every literal it asserts.
- `.github/workflows/unit-suites.yml` — the suite added by exact path to the
  existing "Run the green governance and tenant library suites" step, with the
  superseded quarantine reason answered in place rather than silently dropped.
- `docs/architecture/test-ci-coverage-census.json` — refreshed; the committed
  census is the input that ranks which directory gets wired next, so a stale one
  mis-ranks that queue.
- `src/__tests__/behaviors/governance-tenant-library-ci-coverage.test.ts` — the
  control that pins the composition of that workflow step. It caught this change
  and had to be updated: the suite moves from its quarantine list to its green
  list, and the directory's covered count from 1 to 2. Both edits carry the
  reason inline. The five remaining quarantines are untouched.

## QA / Validation

Baseline measured on clean `origin/main` `5348e23b0e6f0429a895e62e0d7905c4cb7b0bfd`
over the same scope, not quoted from a report:

- Suite before: **1 suite, 7 tests, 3 failed / 4 passed**.
- Suite after: **1 suite, 7 tests, 7 passed / 0 failed**.
- Whole wired workflow step after: **10 suites, 87 tests, 0 failed** (9 suites /
  80 tests before this suite joined it).

Because every repaired case went from red to green, "it passes now" proves
nothing on its own. Each was therefore proved to still fail when the product is
broken, and the mutations were restored byte-identical afterwards
(`git diff --exit-code` clean):

| mutation | expected to bite | observed |
|---|---|---|
| canonicalizer replaced with a pass-through that returns the raw row name | all 3 repaired cases | 3 failed / 4 passed — exactly those 3 by name |
| first tenant's canonical registry value altered | its 2 cases | 2 failed / 5 passed |
| second tenant's canonical registry value altered | its 1 case | 1 failed / 6 passed |

**A control caught this change, which is the system working.**
`src/__tests__/behaviors/governance-tenant-library-ci-coverage.test.ts` pins
exactly which files that workflow step runs and which it must not, and pins the
directory's covered count. Wiring the suite failed it two ways, locally and then
on CI, which agreed. Measured on clean `origin/main` inputs the same suite is
**2 passed / 0 failed**, so both failures were caused here and neither was
pre-existing.

It was updated rather than loosened: the file moves from the quarantine list to
the green list because it was repaired and measured, and the count moves 1 -> 2.
The updated control was then proved still able to fail, in both directions:

| mutation to the workflow step | observed |
|---|---|
| a still-quarantined file added to the step | 2 failed / 0 passed |
| the newly wired file dropped from the step | 2 failed / 0 passed |

The five files still on the quarantine list stay there. A file leaves that list
by being fixed and measured, never by being deleted from the list.

One counter-proof, which is why a fixture row name changed rather than only an
expectation. Repairing that case by the literal minimum — update the expected
string, leave the fixture row at the canonical value — makes input and output
identical, and under the pass-through mutation that case **passes**: measured
2 failed / 5 passed instead of 3 / 4. A case that cannot see the canonicalizer
being deleted is not asserting canonicalization, so the fixture now supplies a
registered alias and the case bites again. The acceptance's "do not loosen the
matcher to something that would pass either way" is the reason, and the
counter-proof is the evidence rather than the argument.

Expectations are exact string literals, deliberately not reads of
`DEMO_SAFE_CLIENT_NAMES`: asserting the same constant the product reads would
pass whatever that constant said.

Provenance was verified against git rather than taken from the backlog row, and
the row was partly wrong. The backlog attributed all three stale literals to one
2026-07-01 pull request. That holds for the first tenant. For the second, that
pull request set an intermediate value, and the value the product returns today
was set by a different pull request on 2026-08-07. Naming only the first beside
that expectation would have sent the next reader to a commit that set a
different string, so the file names both, with dates. The backlog row is
corrected in the same run.

Other gates, all from the branch:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, 0 diagnostics (judged on exit code; a bare run exits 134 on this
  machine).
- `npx eslint src/lib/__tests__/active-client.test.ts` — exit 0.
- `npm run audit:named-suite-requiredness` — exit 0; every individually named
  suite that a required job runs is named inside a required job.
- `npm run audit:test-ci-coverage:write` — census drift resolved; covered test
  files **1867 → 1868 (+1)**, uncovered **508 → 507 (−1)**, untriaged unrun
  **458 → 457 (−1)**. One file, counted, not "about one".
- `node scripts/ci/check-behavior-coverage.mjs` — the full behaviors sweep.
- Workflow YAML parses.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. There is no runtime rollout: no product code, schema,
migration, image, flag, environment variable or worker job is touched. The
change takes effect the next time the `Unit suites` workflow runs.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, runtime images,
traffic, flags, environment variables, worker jobs or DNS.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and the reason is stated rather than
  skipped — nothing a signed-in session renders changes. The behaviour under
  test is unchanged product code, and it is exercised directly by the suite and
  by the three mutations above.

## Rollback Plan

Revert the pull request. The suite returns to its previous red state and leaves
the workflow step, which is the status quo ante; nothing else is affected.

## Audit Evidence

- The pull request and its CI run.
- The `Unit suites` run showing the suite executing by exact path inside the
  tenant/governance step.
- The mutation table above is reproducible: apply each mutation, run the suite,
  restore the file, confirm `git diff --exit-code` is clean.
- Backlog item T-559 and its claim and release lines in the append-only register.

## Known Gaps

- The sibling suite named in the same quarantine comment — a control-plane
  tenant-literal floor with current findings — is **not** repaired here. It is a
  genuine breach rather than a stale expectation, its destination is a product
  decision, and it is tracked as its own item. Repairing a real finding under
  cover of a test-hygiene change is how findings get lost.
- Of the sixteen suites that comment measured, the remaining declared
  quarantines are untouched.
