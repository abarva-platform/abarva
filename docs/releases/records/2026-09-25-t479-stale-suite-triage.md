# 2026-09-25-t479-stale-suite-triage — Sixth stale-suite triage draw, with mutation evidence

## Release ID

`2026-09-25-t479-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Twenty test suites in this repository are named by no CI job. Nothing runs them, so nothing
reports whether they pass, and each one carries a tenant-scoped read — the kind of check that is
supposed to stop one client's data reaching another. This change judges those twenty and records
what each is worth. It changes no product code and edits none of the twenty suites.

Every suite was executed on its own first, and every count in the record is read out of that run's
machine-readable output rather than typed. Seventeen pass, three do not.

The more important half is what happened when the suites were tested against deliberate damage.
For each of the two suites that assert a boundary, the thing they guard was broken on purpose to
check the suite notices. Three such mutations were caught. **Two were not**, and both of those
suites pass today:

- One suite is named for keeping raw internal identifiers off the executive surface. Replacing the
  governed summary with the raw identifiers — the exact leak the check is named for — left it
  green, because the check asserts that a code *comment* is present and that one particular wrong
  spelling is absent. This is the same failure that let a governance control sit deleted for ten
  weeks: a control proved by its own name appearing in a file.
- A second suite has a case named for refusing to widen an admin fallback to a different client.
  Removing that same-client condition outright left the case green, because the test identity can
  never reach the fallback in the first place. The case cannot tell the guard from its absence.

Neither of those was visible from a passing run, which is why they are recorded as first-class
results rather than as a footnote. Both are handed to named follow-on items.

The two failing suites turned out to be stale rather than broken product. One asserts a retired
product name in a timeout message; the other uses a sign-in identity that a deliberate
security narrowing removed from the admin roster, so the route now refuses it — correctly. Neither
is repaired by loosening anything, and the record says so explicitly.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only repository quality work, as the previous
draw in this family was. It ships no client-visible capability and no tenant-scoped behavior: the
whole change is one engineering record and one guard over it.

- **Layer 4 (products) — no change.** No route, component, prompt, schema, query or data-plane path
  is modified. The two mutations applied to product files during measurement were reverted and the
  working tree was verified clean after each.
- **Tests / CI tooling.** One new documentation record and one new behavioral guard over it.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — engineering record and its guard
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/architecture/t479-stale-suite-triage.json` — the triage record: twenty rows, each with the
  counts read from its own jest run, a verdict from the established four-word vocabulary, an owning
  follow-on item, and a written rationale. Plus five mutation proofs, the draw's per-directory
  concentration, and a declaration of each population the controls apply to.
- `src/__tests__/behaviors/t479-stale-suite-triage-record.test.ts` — 22 controls over that record.
- `docs/releases/records/2026-09-25-t479-stale-suite-triage.md` — this record.

No file judged by the record is edited, and `claimedWriteFiles` in the record is asserted disjoint
from both the judged paths and the mutated subject files.

## QA / Validation

**The twenty suites, each executed alone** at base `538ce854a902bf8416ebd32e9f417daa5d998f88`:

```
npx jest --runTestsByPath <path> --no-coverage --ci --json --outputFile <out>
```

20 suites executed, 17 green, 3 red; 176 tests run, 171 passed, 5 failed, 0 pending. Every run was
asserted to report `numTotalTestSuites` 1, exactly one `testResults` entry whose name ends with the
path asked for, and `numTotalTests` greater than zero — a run that matches no file exits green and
reports zero, which is the failure a green exit code hides.

**Mutation evidence — five proofs, each mutating the subject and never the suite, then restoring it:**

| id | suite | mutation | failing before → after | verdict |
|---|---|---|---|---|
| M1 | `walkthrough-export/__tests__/tenancy-fence.test.ts` | route stops passing the requested tenant to the fence | 0 → 4 of 9 | kills |
| M2a | `home/__tests__/no-readmin-reexports.test.ts` | a deleted re-export route reintroduced | 0 → 1 of 7 | kills |
| M2b | same | a banned phrase inserted as a **comment** | 0 → 1 of 7 | kills — and shows the case reads bytes, not rendered copy |
| M3 | `outcome-report/__tests__/route.test.ts` | the same-client condition dropped from the admin fallback | 2 → 2 of 4, same two cases | **survives — the widening case is vacuous** |
| M4 | `home/__tests__/home-layer-boundary-contract.test.ts` | raw identifiers leaked onto the executive surface, comment untouched | 0 → 0 of 3 | **survives — the case cannot see the leak it is named for** |

**The new guard, proven able to fail.** 18 deliberate corruptions of the record were each applied to
a scratch copy, the guard re-run, and the firing control read from its output. **18 of 18 were
caught, and in every case the intended control fired** — including re-judging a path an earlier
record already judged, understating the scanner population, declaring a control vacuous when it
fired, downgrading a killing mutation to a survivor, claiming a surviving mutation raised the count,
applying a mutation to the suite instead of its subject, shrinking the prior-record list back to the
four the previous guard read, and publishing a pool figure that depends on an unsettled number. The
record file was restored and the guard re-run green afterwards.

**Baseline, same command and same scope both sides — `npx jest src/__tests__/behaviors`:**

- Without the new suite (parallel): 136 suites, 1 failing suite, 1 failing test.
- With the new suite (parallel): 137 suites, 7 failing suites / 11 failing tests, then on an
  **unmodified** tree a second run gave 4 failing suites / 3 failing tests with a largely disjoint
  set. The set is nondeterministic, so neither number is attributable to this change.
- With the new suite, **serial** (`--runInBand`): **137 suites, 1326 tests, 0 failing.**

The parallel failures are a pre-existing concurrency defect, not this change: several behaviors
suites shell out to `scripts/quality/test-ci-coverage-census.mjs` concurrently, and another suite
creates and deletes a generated probe file underneath them, so runs fail on `ENOENT` for that probe
or on a half-written shared JSON output. It is present in the baseline, it varies run to run on an
unchanged tree, and it disappears entirely when the suites do not overlap. Filed as a separate
item rather than absorbed here.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics. The exit code is read directly, because a bare `npx tsc --noEmit` exits 134 on this
  machine (a V8 out-of-memory crash that emits nothing and reads as a false clean through `grep`).
- `npx eslint <the new suite>` — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main`. No runtime rollout: two documentation/test files, no route, component, prompt,
schema, migration, flag or data-plane path. The repo-owned ACA deploy workflow will build and deploy
the merge commit as it does every merge; nothing in this change alters what the runtime serves.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime behavior changes.
- ACA runtime invariant: to be captured after merge, as for any merge to `main`.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing rendered, returned or read by any surface differs,
  so a signed-in lane would be a proof with no subject.

## Rollback Plan

Revert the PR. Two added files, no migration, no runtime state, no data written.

## Audit Evidence

- The triage record itself, which carries every count, every verdict, every rationale and the five
  mutation proofs with their before/after numbers.
- The new guard suite, and the 18-corruption sweep summarised above.
- The jest JSON outputs for all twenty isolated runs and the five mutation runs.
- PR URL and CI run: see the PR.

## Known Gaps

- **`T-742`'s +38 pool discrepancy is not reconciled, and is still owed.** The acceptance for this
  item carries "before drawing anything further, reconcile `T-742`'s +38" — re-running the census at
  base `5cb905487` with `node_modules` installed from that base's own lockfile, to settle whether 55
  or 93 is the right pool figure. That precondition governs a **seventh** draw, not the triage of an
  already-fixed twenty, and it is not discharged here. Because every "remaining pool" figure
  inherits that unsettled answer, this record deliberately publishes none, and the guard fails if
  one is added.
- The two vacuous cases found by M3 and M4 are **recorded, not fixed.** Fixing them means editing
  suites this record passes judgement on, which this item is forbidden from doing.
- Wiring, rewriting, updating and repair are all follow-on items. Nothing in this change makes any
  of the twenty suites run in CI.
