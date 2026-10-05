# 2026-10-05-t793-tenant-scoped-read-signal — the tenant signal recognises a module named for tenancy

## Release ID

`2026-10-05-t793-tenant-scoped-read-signal`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census of which Jest suites CI actually runs, and ranks the
directories it finds by how governed the code under them looks. One of the three signals
it looks for is "this directory's tests load a module that reads tenant-scoped data".

That signal was two-part by design: the module's **path** had to look like a read, and its
**executable source** had to carry a tenant key. The path half tested nine words — `read`,
`query`, `queries`, `adapter`, `route`, `repository`, `lookup`, `search`, `fetch` — and the
word `tenant` was not among them. So a module that announces tenant scope in its own
filename could not match a tenant-scope heuristic. Modules literally called
`tenant-scoped-session.ts`, `tenant-identity-pin.ts`, `tenant-key-resolution.ts`,
`tenant-fence-answer.ts` and `tenant-stream-guard.ts` were excluded from the signal by
their names alone.

This adds `tenant` and `client[-_]?key` to the path half and leaves everything else as it
was. Both halves of the heuristic are still required, and the change is pinned by three
new behavioural cases rather than by a comment.

Two published counts move as a result, both measured rather than asserted, and the
committed census artifact is refreshed in the same change.

## Layer Impact

- **Layer 4 — products:** none. This is a measurement of the repository's own test
  coverage shape. No tenant data, no product surface, no answer path, no prompt and no
  read model is touched.
- **Platform tooling:** `scripts/quality/test-ci-coverage-census.mjs` and the committed
  census artifact it writes. The census executes no test and gates nothing; it exits 0
  unconditionally and is the *input* to the decision about which directory gets wired next.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository tooling and a committed measurement artifact
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — `TENANT_READ_PATH_RE` gains `tenant` and
  `client[-_]?key`; the constant gains the comment block recording why each alternative is
  there and why two candidates were rejected.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — three new cases (below).
- `docs/architecture/test-ci-coverage-census.json` — refreshed via
  `npm run audit:test-ci-coverage:write`, as the drift gate requires.

### Each added alternative is measured, not guessed

Counted over `src` at base `e2d5096330`, restricted to product sources that carry a tenant
key in **executable** source, raise no resolver call, and match **none** of the nine
shipped words:

| candidate | newly matches | verdict |
|---|---|---|
| `tenant` | **63** | added |
| `client[-_]?key` | **1** | added |
| `tenancy` | **0** | **rejected** — an alternative that can never fire reads as coverage and is not |
| `client` | 22 | **rejected** — they are React clients (`WorkspaceClient.tsx`, `consent-client-name.ts`), not tenants; the word would make the gate mean something else |
| `fence` / `session` / `scope` / `isolation` | 1 / 4 / 4 / 3 | **rejected** — out of scope; none of them names tenancy |

## QA / Validation

### Baseline and result over the same scope

`npx jest --runTestsByPath src/__tests__/behaviors/test-ci-coverage-census.test.ts`

| | suites | tests | failing |
|---|---|---|---|
| main at `e2d5096330`, before any edit | 1 | 57 | **0** |
| with the new cases, before the fix | 1 | 59 | **1** |
| with the new cases, after the fix | 1 | 60 | **0** |

The failing-before number is 1, not 57: the suite is green on `main` and the one failure is
the case this change exists to pass. The test count moves 57 → 60 because three cases were
added, two of which are negative controls that pass in both directions.

### The fix broken deliberately — four mutations, all killed

| # | mutation | tests killed |
|---|---|---|
| M1 | both added alternatives removed — the alternation narrowed fully back | **1** |
| M2 | only `tenant` removed | **1** |
| M3 | source half dropped, leaving a one-part rule on the path | **6** |
| M4 | path half dropped, leaving a one-part rule on the source | **1** (**0** before the third case was written) |

M4 is the finding worth recording. Deleting the path gate outright and keeping only
`TENANT_KEY_SOURCE_RE` left **all 59 other cases green**, because every pre-existing
negative case rests on the source half — their fixture paths match the gate and they fail
on the sanitizer — so nothing in the suite could tell the two-part rule from a one-part
one. The acceptance for this item says in as many words not to drop the path gate; until
now that cost a code review rather than a red test. The third new case
(`will not signal a tenant key alone`) closes it: its fixture path carries no read-ish word
and no tenancy word, and its source carries `tenantKey` in a real signature.

### Blast radius — measured before and after over the same tree

`node scripts/quality/test-ci-coverage-census.mjs --json`, base `e2d5096330`:

| count | before | after |
|---|---|---|
| `criticalGovernedRiskDirectories` | 0 | **0 — unchanged** |
| `highGovernedRiskDirectories` | 0 | **0 — unchanged** |
| `rankedDirectories` | 0 | **0 — unchanged** |
| `triageVerdicts.drawableUntriagedUnrunTestFiles` | 0 | **0 — unchanged** |
| `unclassifiedRiskDirectories` | 53 | **49** |
| `unclassifiedRiskDirectoriesWithResolvedProductSources` | 47 | **43** |
| `unclassifiedRiskDirectoriesWithNoResolvedProductSource` | 6 | 6 — unchanged |
| `testFiles` / `coveredTestFiles` / `uncoveredTestFiles` | 2714 / 2550 / 164 | unchanged |
| `untriagedUnrunTestFiles` | 112 | 112 — unchanged |
| `governedRiskRanking` / `governedRiskEvidence` / `governedRiskFiles` lengths | 0 / 0 / 0 | 0 / 0 / 0 — unchanged |

`rankedDirectories` and `drawableUntriagedUnrunTestFiles` are **unchanged**, as the
acceptance requires them to be. Nothing entered the zero bucket; four directories left it,
and they are named rather than counted:

| directory | tenant-scoped sources, of product sources resolved | first evidence path |
|---|---|---|
| `src/lib/intelligence/ask/__tests__` | 6 of 27 | `tenant-fence-answer.ts` |
| `src/lib/source/vendor-proposals/__tests__` | 1 of 4 | `tenant-scoped-session.ts` |
| `src/lib/enterprise-data/data-quality/__tests__` | 1 of 1 | `all-tenant-data-quality-audit.ts` |
| `src/lib/enterprise-knowledge/tower/__tests__` | 1 of 1 | `tower-v3-context-pack-from-tenant-inputs.ts` |

All four now compute `band: high`, `score: 10`, `signals: ["tenant_scoped_read"]`.

**The filing's own prediction was wrong in one number, and it is corrected here rather than
absorbed.** It expected 22 of the 53 unclassified directories to move, and 14 tenant-bearing
sources in `src/lib/intelligence/ask/__tests__` of its 27. The measured answers are **4
directories** and **6 sources**. The 22 counted directories holding such a file; the signal
is computed over the product modules a directory's tests **resolve at run time**, after
type-only imports are erased and non-executable text is blanked, and in the live tree only
4 of the 53 resolve one. The direction of the finding stands; its magnitude did not.

### No gate asserts a floor on the two band counts

Checked, because the acceptance says it was not verified at filing time: `grep` over the
tree finds `criticalGovernedRiskDirectories` and `highGovernedRiskDirectories` only in the
census generator, its own suite, past release records, and historical measurement
artifacts. No workflow and no `check:` script asserts a floor on either. Both are 0 before
and after regardless.

### Other checks

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0
  diagnostics. (Judged on the exit code; a bare `npx tsc --noEmit` exits 134 on the
  operator host and emits nothing.)
- `npx eslint scripts/quality/test-ci-coverage-census.mjs src/__tests__/behaviors/test-ci-coverage-census.test.ts` — clean.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — `census drift: committed
  census matches this run`; `census shape: coverage shape matches the committed census`.
- `prettier --check` warns on both touched files. It warns on the **same two files as they
  stand on `origin/main`**, verified by checking out each from `origin/main` into a
  temporary path and re-running, so this is pre-existing and not introduced here.
  Reformatting either file would rewrite thousands of lines it does not own.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is served, deployed, or read by
any product surface, model prompt or data build. The census is run by CI and by hand.

## Deployment Authority

Not required — no Azure Container Apps image, deploy workflow, runtime image, feature flag,
environment variable, worker job, traffic weight, DNS record or environment promotion is
affected by this change.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — there is no client-visible surface in this change

## Rollback Plan

Revert the squash commit. The only persistent artifact is
`docs/architecture/test-ci-coverage-census.json`, which is regenerated from the tree by
`npm run audit:test-ci-coverage:write`, so a revert restores it exactly. No migration, no
data, no runtime state.

## Audit Evidence

- The PR for this branch, and its required checks.
- The before/after census JSON, reproducible on any checkout at this base by running
  `node scripts/quality/test-ci-coverage-census.mjs --json` with and without the
  two-alternative change.
- The four mutation runs, each reproducible by the single edit named in the table above.
- Backlog item `T-793`, and the claim register lines for
  `source-backlog-executor#20261005T2134Z` on branch `exec/run-20261005T2134Z`.

## Known Gaps

1. **Correct classification removed four directories from the only list that showed them.**
   `unclassifiedRiskDirectories` carries only score-zero rows, and `governedRiskRanking`
   admits a directory only while its drawable count is above zero — and every one of the
   112 untriaged unrun files is held by a triage verdict, so the ranking is empty. A
   directory that gains a signal therefore leaves the zero list and enters no ranked row.
   Directories visible in **neither** list go from **6 to 10**. The banding is now right and
   the visibility is worse, which is a defect in how the two views partition the pool, not
   in this change — but it is this change that makes it matter. Filed as a successor item.
2. **This creates no drawable work, exactly as the item's own row warned.** Holding is
   independent of banding; `drawableUntriagedUnrunTestFiles` is 0 before and after. Nobody
   should read the four reclassified directories as a refilled draw.
3. The nine original read-ish words were not re-measured for dead alternatives. This change
   proves its own two additions earn their place and does not audit the ones it inherited.
4. `prettier --check` still warns on both touched files, as it does on `main`. Out of scope.
