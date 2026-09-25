# 2026-09-25-t479-stale-suite-triage — Re-verifying a triage draw, and what the re-verification found

## Release ID

`2026-09-25-t479-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

A backlog item asked for twenty test suites to be judged, on the stated basis that no automated
check runs any of them. Before doing that, the claim was re-checked against the current code — and
it turned out to be wrong for sixteen of the twenty. Those sixteen run on every proposed change and
every merge.

The other four are the interesting ones, and not for the reason the item gave. They are not
unnamed. They are named by a check that **cannot reach them**. The check lists the folder
`src/app/(maestro)/home`, but the tool it hands that text to reads it as a *pattern*, in which
round brackets mean "group these characters" rather than "match a round bracket". So the pattern
looks for a folder called `src/app/maestro/home`, which does not exist, and the four suites inside
the real folder are silently skipped. The same mistake appears twice more in a second check.

This is not cosmetic. Correcting the brackets — one character each — turns **both** checks red
immediately, on failures that are in the code right now and that neither check can currently see:

- Home: passes today; corrected, it fails on a Home boundary suite with two failing assertions.
- Tower: passes today; corrected, it fails on a **tenant route-scope** suite — a check on which
  client's data a page may read — with one failing assertion.

Both checks are green today *because* their pattern cannot reach the folder they name. That is the
same shape as the failure this whole backlog exists against: a control that proves itself by its
own name appearing somewhere rather than by running.

Separately, the repository's coverage census reads those same folder names as plain text prefixes
rather than as the patterns the test runner applies, so it reports all twenty suites as covered. It
is the instrument the original draw came from, which is why the draw could not be reproduced.

The twenty were still measured and judged, because that work stands on its own. Each was run
individually and its numbers read from the run rather than typed: seventeen pass, three do not. Two
of the three failures are already recorded as expected in a check's baseline, with counts that
match exactly. Each suite was then tested against deliberate damage to the thing it guards. Three
such mutations were caught. **Two were not**, and both of those suites pass today *and run on every
proposed change* — so they are not dormant; they actively report assurance they do not have:

- A suite named for keeping raw internal identifiers off the executive surface stays green when
  those identifiers are put onto it, because it checks that a code *comment* is present.
- A case named for refusing to widen an admin fallback to a different client stays green when that
  restriction is deleted, because its test identity can never reach the code in question.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only repository quality work. It ships no client-visible
capability and no tenant-scoped behavior.

- **Layer 4 (products) — no change.** No route, component, prompt, schema, query or data-plane path
  is modified. Mutations applied to product files during measurement were reverted and the working
  tree verified clean after each.
- **CI configuration — no change in this release.** The two baselines, the ratchet script and the
  census are *measured and reported on*, not edited. Correcting them turns two gates red and that
  needs a decision (see Known Gaps).
- **Tests / tooling.** One measurement record and one behavioral guard over it.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t479-stale-suite-triage.json` — twenty rows with counts read from each suite's
  own jest run; per-row CI selection measured with `jest --listTests`; the quoted baseline
  `knownFailing` entry where one exists; five mutation proofs; the two ratchet probes; and a
  `premiseCorrection` block stating plainly which half of the item survived.
- `src/__tests__/behaviors/t479-stale-suite-triage-record.test.ts` — 28 controls over that record.
- `docs/releases/records/2026-09-25-t479-stale-suite-triage.md` — this record.

No file judged by the record is edited. No baseline, workflow or ratchet script is edited.

## QA / Validation

**The twenty, each executed alone** at base `538ce854a902bf8416ebd32e9f417daa5d998f88`:

```
npx jest --runTestsByPath <path> --no-coverage --ci --json --outputFile <out>
```

20 executed, 17 green, 3 red; 176 tests, 171 passed, 5 failed, 0 pending. Each run was asserted to
report `numTotalTestSuites` 1, one `testResults` entry whose name ends with the path asked for, and
`numTotalTests` greater than zero — a run that matches no file exits green and reports zero.

**CI selection, measured rather than grepped.** `npx jest --listTests` was given each Surface
Ratchet Guard baseline's `paths` array verbatim. 220 files are selected across both baselines and
**zero** are under a parenthesised segment. 16 of the twenty are selected; 4 are not, and all four
are in the one directory whose name carries brackets.

An earlier attempt to answer this by grepping the workflow files reported all twenty uncovered and
was wrong — the census's own `--explain` mode carries a comment warning that a grep resolves one of
four hops and silently disagrees with the census. That warning was correct and is why the claim in
this record is `--listTests` output rather than a text scan.

**Ratchet probes — scratch copies of the baselines, repo's own `scripts/ci/test-ratchet.mjs`, one
character changed:**

| baseline | as written | with the brackets escaped |
|---|---|---|
| `docs/ci/home-test-baseline.json` | 727/755 tests, 12 failing suites, **exit 0** | 745/775 tests, 13 failing suites, **exit 1** — `NEW FAILURE src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts — 2` |
| `docs/ci/tower-test-baseline.json` | 1790/1801 tests, 8 failing suites, **exit 0** | 1793/1805 tests, 9 failing suites, **exit 1** — `NEW FAILURE src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts — 1` |

Neither revealed failure is in its baseline's `knownFailing`. 20 and 4 tests respectively are not
being run by gates that claim to run them.

**Mutation evidence — five proofs, each mutating the subject and never the suite, then restoring:**

| id | suite | mutation | failing before → after | result |
|---|---|---|---|---|
| M1 | `walkthrough-export/__tests__/tenancy-fence.test.ts` | route stops passing the requested tenant to the fence | 0 → 4 of 9 | kills |
| M2a | `home/__tests__/no-readmin-reexports.test.ts` | a deleted re-export route reintroduced | 0 → 1 of 7 | kills |
| M2b | same | a banned phrase inserted as a **comment** | 0 → 1 of 7 | kills — and shows the case reads bytes, not rendered copy |
| M3 | `outcome-report/__tests__/route.test.ts` | the same-client condition dropped from the admin fallback | 2 → 2, same two cases | **survives — the widening case is vacuous** |
| M4 | `home-layer-boundary-contract.test.ts` | raw identifiers leaked onto the executive surface, comment untouched | 0 → 0 of 3 | **survives — the case cannot see the leak it is named for** |

**The guard, proven able to fail.** 30 deliberate corruptions of the record were each applied to a
scratch copy, the guard re-run, and the firing control read from its output. **30 of 30 caught, the
intended control firing in every case** — including calling an unselected row selected, quoting a
`knownFailing` entry the baseline does not hold, restating a quoted failure count, naming a
"revealed" failure that is already baselined, claiming a probe already failed as written, asking to
wire a suite CI already selects, and softening the premise correction back to the item's own claim.
The record was restored and the guard re-run green afterwards.

**Baseline, same command and same scope both sides — `npx jest src/__tests__/behaviors`:**

- without the new suite (parallel): 136 suites, 1 failing suite, 1 failing test
- with it (parallel): 137 suites, 7 failing suites / 11 tests; then a second run of the **unmodified**
  tree gave 4 failing suites / 3 tests with a largely disjoint set
- with it, **serial** (`--runInBand`): 137 suites, 1326 tests, **0 failing**

The parallel failures are a pre-existing concurrency defect, not this change: several behaviors
suites shell out to the coverage census concurrently while another creates and deletes a generated
probe file underneath them. Present in the baseline, nondeterministic on an unchanged tree, gone
when the suites do not overlap. Filed separately rather than absorbed here.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics; the exit code read directly, because a bare `npx tsc --noEmit` exits 134 on this
  machine and reads as a false clean through `grep`.
- `npx eslint <the new suite>` — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. No runtime rollout: two documentation/test files, no route, component, prompt,
schema, migration, flag or data-plane path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime behavior changes.
- ACA runtime invariant: to be captured after merge, as for any merge to `main`.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing rendered, returned or read by any surface differs.

## Rollback Plan

Revert the PR. Two added files, no migration, no runtime state, no data written.

## Audit Evidence

- The record, carrying every count, every verdict, the per-row selection measurement, the quoted
  baseline entries, the five mutation proofs and the two ratchet probes.
- The guard suite and the 30-corruption sweep.
- The jest JSON outputs for the twenty isolated runs, the five mutation runs, and the four ratchet
  probe runs.
- PR URL and CI run: see the PR.

## Known Gaps

- **The bracket defect is reported, not fixed, and fixing it needs a decision.** Escaping the
  patterns turns both gates red on three real failures. The two options — baseline the three
  failures so the escape can land immediately, or fix them first and escape in the same change —
  differ in whether a known-bad surface blocks merges in the meantime. That is an owner's call, not
  a guess, and it is filed as `T-486` marked `decision needed` with a recommendation. The
  recommendation is to fix rather than baseline, because one of the three is a tenant route-scope
  suite and the ratchet's own documentation says the baseline is a record of what was already
  broken, not a budget to spend.
- **`T-487`** — the census crediting baseline paths as prefixes — is filed and not fixed here.
- **`T-742`'s +38 pool discrepancy is still owed**, and is now joined by a second unsettled number:
  the `covered` column the triage ranking rests on is over-credited by exactly these patterns. A
  seventh draw would inherit both. No "remaining pool" figure is published in this record for that
  reason, and the guard fails if one is added.
- **The two vacuous cases found by M3 and M4 are recorded, not fixed.** Fixing them means editing
  suites this record passes judgement on, which this item forbids.
- **One verdict word was added** to the four the item named — `already_selected_no_action` — because
  sixteen rows run in CI and none of the four existing words is true of them. The deviation is
  declared in the record and constrained by the guard to rows measured as selected and green.
