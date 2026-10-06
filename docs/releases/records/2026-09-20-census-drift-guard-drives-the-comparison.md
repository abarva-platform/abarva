# 2026-09-20-census-drift-guard-drives-the-comparison — A drift guard that reads prose, not arithmetic

## Release ID

`2026-09-20-census-drift-guard-drives-the-comparison`

## Status

`candidate`

## Plain-English Summary

The coverage census is a derived file refreshed by hand. Because a stale one mis-ranks which
directory gets wired next, the census script prints how far the committed file has drifted.

That drift report had been wrong once before, in a way its own comment records: it compared
two fields that were both `undefined`, found no difference, and printed "committed census
matches this run" against a file that was dozens of files stale.

The guard written against that bug **checked the script's source text** — that certain
strings appeared in it — rather than running the comparison. So it guarded the wording of
the fix, not the behaviour.

The comparison function is now exported and driven directly, with committed-census fixtures
written to temp files: agreeing, drifted up, drifted down, drifted by one, counts at the top
level instead of nested, one field missing, file absent, file unparseable. Each case can now
fail for the reason it names.

Nothing about what the script does changes. The one property that genuinely belongs to the
source — that the drift block does not exit non-zero — is still read from the source, and is
now narrowed to that block rather than the whole file.

## Layer Impact

- `global-control-lane`. One QA script gains an export; one behaviour suite is rewritten.
  No product surface, tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a QA measurement script and its guard
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — `describeDrift` is exported, with the
  reason recorded beside it. No behaviour change.
- `src/__tests__/behaviors/census-drift-is-reported.test.ts` — rewritten to drive the
  comparison with fixtures. 4 cases → 10.

## QA / Validation

| What | Result |
|---|---|
| The rewritten guard | 10 passed |
| All five census-related suites | **62 passed, 0 failed** |
| `tsc --noEmit` | exit 0 |
| `eslint` on both changed files | exit 0 |
| Mutation harness, three directions | **7 mutations, 7 caught, 0 survived** |

Mutations, all of which leave the script's prose intact — which is the class the previous
guard could not see:

| direction | mutation |
|---|---|
| back to the original bug | compare the top level instead of `counts` |
| | an unreadable shape is skipped instead of reported |
| the arithmetic stops noticing drift | only a rise counts as drift |
| | only the first of three fields is compared |
| | the delta is reported without its sign |
| the fallbacks stop being distinguishable from agreement | a missing census reports `current` |
| | an unparseable census reports `current` |

### The previous guard was run against the same mutations, rather than assumed inadequate

| mutation | old guard |
|---|---|
| the original bug — compare the top level instead of `counts` | **caught** |
| only a rise counts as drift | **missed** |
| a missing committed census reports `current` | **missed** |

So the precise claim is narrower than "it was vacuous": it caught the one regression whose
textual form it matched literally, and missed the class — any wrong arithmetic or wrong
fallback that keeps the strings in place. The rewrite is what closes the class.

### Measured state of the census itself

Running the generator against the committed file, the report is correct and the file is
stale:

```
committed census is STALE: testFiles 2304 -> 2320 (+16);
  coveredTestFiles 896 -> 910 (+14); uncoveredTestFiles 1408 -> 1410 (+2)
```

Four of fourteen counts have moved, and all four are file counts — every directory-level
count is unchanged. That distinction matters to the open decision below, because the
directory counts are what rank the wiring queue.

## Rollout Plan

Merge to `main`. No runtime rollout — a QA script export and a test file.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores a guard that reads
source text.

## Audit Evidence

- The PR diff — two files.
- The seven mutation results, and the three-row table showing what the old guard caught and
  missed against the same mutations.

## Known Gaps

- **The committed census is not refreshed in this change.** Refreshing it is the manual act
  the current policy calls for, but it would add a large derived diff to a change about a
  test guard, and the staleness is live evidence for the open decision below. It is left for
  whoever settles that decision.
- **The item's open question is not answered here, because it is an owner decision, and the
  measurement changes what is being decided.** The acceptance offers two options: a refresh
  on merge to `main`, or "say so plainly and accept that the drift line is the whole
  remedy." Measured: **nothing in CI runs the census script.** The three references to it
  under `.github/workflows/` are comments naming the census file as an input, not
  invocations. So the drift line is printed only when a person runs the script by hand — and
  a person who remembers to run it would also remember to run `--write`. The second option
  is therefore not currently available: the remedy it names reaches nobody.
  - **Recommendation:** run the script in CI as a report, not a gate, before deciding
    anything about a refresh-on-merge step. It is the cheap half, it makes the drift visible
    to somebody, and it produces the evidence the acceptance itself asks for — whether a
    failing check would fire on every unrelated PR that adds a test, or only when the file
    is genuinely stale. A refresh-on-merge step also has to answer the race the item
    raises, and that question is worth answering with data rather than in advance.
  - **What would reverse it:** if the census is meant to be a point-in-time artifact that a
    person regenerates when they next use it to pick a directory, then nothing is wrong, the
    drift line is for that person at that moment, and the right change is to say so in the
    file's header. Nothing in the script or the census says which, which is why this is a
    question and not a fix.
