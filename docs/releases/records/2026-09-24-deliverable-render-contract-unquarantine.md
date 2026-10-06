# 2026-09-24-deliverable-render-contract-unquarantine — Restore the deliverable render-contract assertions and wire the suite into CI

## Release ID

`2026-09-24-deliverable-render-contract-unquarantine`

## Status

`candidate`

## Plain-English Summary

One test file that checks how seed deliverable URLs are built has been excluded
from CI. It was excluded for a real failure, but the failure was in the test,
not the product: its first assertion pinned the number of generated URLs to a
fixed count. The generated tree legitimately changed size, so that assertion
threw on line one — and the two assertions after it, which carry the actual
contract, never executed. They are the ones worth having: no URL may fall back
to the retired `/deliverables/phase-<n>/` folder layout, and every URL must have
the canonical `d<NN>-<slug>` shape.

The count is removed rather than updated. A count is a magnitude, not a
contract, and re-pinning the new number would rebuild the same trap the next
time the tree moves. In its place the suite asserts the generated list is
non-empty — not as a size claim, but because two of its checks are filters, and
a filter over an empty list passes while proving nothing.

The two contract checks now report the offending URLs by name instead of
asserting a bare boolean, so a future failure says which paths are wrong rather
than only that something is.

With the suite green it is named by exact path in the integration-suites CI job,
its quarantine entry is deleted, and the quarantine ratchet is lowered in the
same change so clearing this entry leaves no silent headroom for the next one.

## Layer Impact

Release lane: `internal-admin` — test coverage and CI wiring only, with no
client-facing surface, no data-plane reach and no runtime behaviour change.

- **Layer 4 (Products):** no product behaviour changes. No application source
  file is modified by this release; the only product-adjacent file it touches is
  a test.
- **CI / release tooling:** one previously-unrun root-level integration suite is
  now executed on every pull request, and the carve-out list that tracked it
  shrinks by one with its ceiling lowered to match.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes — test coverage and CI wiring only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/deliverable-render-contract.test.ts` — replaced the
  fixed-count assertion with a non-emptiness floor; the two contract assertions
  now report offending paths; added a canonical-segment shape assertion.
- `.github/workflows/integration-suites.yml` — the suite is named by exact path
  in the integration-root jest command.
- `scripts/quality/integration-root-quarantine.json` — entry removed.
- `scripts/quality/check-integration-root-quarantine.mjs` — `CEILING` 4 → 3,
  with the reason recorded beside it.

## QA / Validation

Measured against a clean baseline over the same scope. No absolute failure count
is quoted as if this change caused it.

**The suite itself** (`jest --runTestsByPath`):

| | suites | tests |
|---|---|---|
| before, on `origin/main` `5f5dc0f25` | 1 failed | 1 failed / 4 passed of 5 |
| after | 1 passed | 0 failed / 5 passed of 5 |

**The CI job this suite joins**, running the exact jest command from
`integration-suites.yml`:

| | suites | tests |
|---|---|---|
| before (same command, minus the newly wired path) | 172 passed, 0 failed (1 skipped) | 4833 passed, 20 skipped |
| after | 173 passed, 0 failed (1 skipped) | 4838 passed, 20 skipped |

**Mutation proof — the restored assertions can each fail, and each fires on its
own line.** Every mutation was applied to product code
(`src/lib/deliverables/seed-route-resolver.ts`), not to the test, and the file
was restored to its committed bytes after each one.

| # | mutation | result |
|---|---|---|
| 1 | emit a `/deliverables/phase-4/` folder in every path | caught — legacy-folder assertion (line 24) |
| 2 | upper-case the route segment | caught |
| 3 | return an empty path list | caught |
| 4 | append one malformed path, leaving the legacy and canonical-path cases untouched | caught — **shape assertion (line 27) fired alone**, so it is not absorbed by a neighbouring guard |
| 5 | return an empty path list, isolated | caught — **non-emptiness floor (line 20) fired alone**, ahead of the membership assertion, so the floor is doing real work rather than being redundant |

**Mutation proof — the CI wiring is real, not a string edit.**

| # | mutation | result |
|---|---|---|
| 6 | leave `CEILING` at 4 with a 3-entry list | `check:integration-root-quarantine` exits 1: "1 slot(s) of headroom were just created… Lower CEILING to 3" |
| 7 | remove the path from the workflow command, keep the entry deleted | exits 1: "exists and no workflow runs it… the default is EXCLUDED and a file nobody wired is silently unrun" |

Mutation 7 is the one that matters for the wiring claim: the checker asks the
coverage census, not the YAML, so it confirms the census genuinely resolves the
file as run by a workflow.

**Other checks:**

- `npm run check:integration-root-quarantine` — clean: 3 root-level suites
  excluded (3 `update`), no root file unrun without an entry. Its own unit
  suite: 23 passed / 0 failed.
- `node scripts/quality/check-integration-root-quarantine.mjs --rerun` — clean.
  This is the branch that re-runs every quarantined suite and fails if one
  passes, so it confirms the three remaining entries are still genuinely red.
- `jest` on `census-drift-is-reported`, `integration-directory-ci-coverage`,
  `named-suite-requiredness`, `collected-files-declare-a-test` — 4 suites / 35
  tests, 0 failed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit code 0**, zero diagnostics. Judged by exit code, not by grep.
- `npx eslint` on the changed test and script — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: no application source file changes, so the
deployed image is unaffected in behaviour. The repo-owned ACA main deploy
workflow will build and deploy the merge commit as it does for every merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. This release issues no `az` command and changes
  no Container App template, env var, flag, scale or secret.
- Approved image digest: not set by this release.
- ACA runtime invariant: to be recorded against the merge SHA's deploy run in the
  execution register. Not asserted here.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — nothing in this change is reachable
  from a product session.

## Rollback Plan

Revert the PR. The suite returns to its quarantine entry and `CEILING` returns to
4; nothing else moves. No migration, no data change, no runtime state.

## Audit Evidence

- The PR and its checks.
- `check:integration-root-quarantine` step output in the integration-suites job,
  which names the remaining three excluded suites and their verdicts.
- The jest step output for the integration-root command, which now lists
  `deliverable-render-contract.test.ts` among the suites it ran.

## Known Gaps

- **A duplicate-route defect found while restoring these assertions, filed
  separately and deliberately not fixed here.** The generated path list contains
  15 duplicated URLs. The cause is uniform across every program and every seed
  tenant, which points at one declaration rather than scattered drift: the D24
  deliverable is declared in two spec phases, and the two instances differ in
  render tier, lifecycle state and status while computing an identical route,
  because the route segment is derived from the deliverable code and slug and
  carries no phase. The route resolver takes the first match, so the
  later-phase instance is unreachable by URL. This suite does **not** assert
  uniqueness, because asserting it today would land red, and pinning the current
  duplication would make a defect read as intended. Deciding how to
  disambiguate — a phase-qualified segment, a distinct code, or removing one
  declaration — is a seed/data-plane call and is filed as its own item.
- Three entries remain in the integration-root quarantine, all verdict `update`.
  One of them needs an answer-contract decision before it can be rewritten.
- The committed coverage census was already stale on `main` before this change
  and is not refreshed here; that drift is reported by its own control and is
  not caused by this release.
