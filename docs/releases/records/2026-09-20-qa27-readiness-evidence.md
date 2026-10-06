# 2026-09-20-qa27-readiness-evidence — Readiness manifest evidence must match what the verifier reports

## Release ID

`2026-09-20-qa27-readiness-evidence`

## Status

`candidate`

## Plain-English Summary

The Production Readiness page is manifest-backed: `docs/build/production-readiness.json` is read at
request time by `src/lib/admin/production-readiness-loader.ts` and rendered at
`/admin/production-readiness`. Two statements in its Validation / QA component told operators that
six slice-integration checks in the QA27 storyline verifier were "deferred pending Wave 19
integration".

Re-measured on `82ff93fb1` by running the verifier: it reports **14 pass / 0 fail / 0 deferred**.
Five of the six named slices have a check and it passes. The sixth has **no check in that suite at
all** — it was reported as a deferred check by a report that never tested it. All six are
`code_complete` in `docs/build/build-slices.json`.

Both statements are corrected to what was measured, and a test now holds the manifest to the
verifier so the statements cannot drift again in silence. The test takes its truth from running the
verifier, never from the manifest, so the manifest cannot satisfy the assertion that checks it.

## Layer Impact

- **Layer 4 (Products) — internal admin surface.** The Production Readiness page renders manifest
  text verbatim; a stale sentence there is an operator-facing false statement about what has been
  verified, not a documentation typo. No canonical-model, adapter or intake change.
- **Tooling / CI.** One new deterministic test suite under `src/__tests__/integration/qa/`. No
  schema, migration, route or runtime behaviour changes.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: **yes** — `/admin/production-readiness` is an internal operator surface.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/build/production-readiness.json` — two strings in the `validation_qa` component corrected
  (`testingGates.integration_tests.evidence` and `nextAction`). Two lines changed; the file is
  otherwise byte-identical, edited by targeted substitution rather than a JSON round-trip so the
  diff stays reviewable.
- `src/__tests__/integration/qa/apex-storyline-readiness-evidence.test.ts` — new. Four assertions:
  an anchor that the manifest still makes claims about this suite, no claim of a deferral the
  verifier does not report (including a slice with no check at all), no claim of a clean bill the
  verifier does not report, and every quoted check count equal to the count the verifier runs.

## QA / Validation

**The defect was measured through the real execution path before it was repaired.** Running the
verifier on clean `origin/main` `82ff93fb168cab0b9301fd5ceef84fcafcba9d6a` returns
`pass 14 / fail 0 / deferred 0`, while the manifest asserted six deferrals.

New suite, **1 failed / 2 passed before the fix → 4 passed / 0 failed after** (two assertions were
added after the first run). The failure listed all twelve contradictions by key path — six in
`.testingGates.integration_tests.evidence` and the same six in `.nextAction` — and distinguished
"names X as deferred, but CH-nn=pass" from "names X as deferred, but no check mentions X at all".

Directory CI scope `npx jest src/__tests__/integration/qa --no-coverage`, measured on the same scope
both sides: **7 tests failing before, the same 7 after, in the same 4 suites by name** —
`design-workflow-canon-regression`, `logo-usage-enforcement`, `wireframe-compliance-audit`,
`shell8-legacy-retirement`. Those are pre-existing and are the subject of separate open items; none
was touched here. Suites 39 → 40, tests 957 → 961 (+4, all mine).

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
diagnostics (exit code judged, not grepped: a bare run exits 134 on this machine and emits nothing).
`npx eslint` on the new file — exit 0.

**Six mutations, six caught**, each landing on a different assertion, and the tree restored between
each:

| # | Mutation | Caught by |
|---|---|---|
| M1 | evidence re-asserts the old deferral for slices that pass | deferral assertion |
| M2 | `nextAction` defers one slice whose check passes | deferral assertion |
| M3 | evidence quotes a stale check count (13 for 14) | count assertion |
| M4 | evidence defers a slice the suite has no check for | deferral assertion, "no check mentions it at all" branch |
| M5 | a verifier check starts deferring while the manifest claims a clean bill | clean-bill assertion |
| M6 | every claim about this suite removed from the manifest | anchor |

M4 matters most: it proves the branch that caught the uncovered slice is reachable, which is the
branch the defect actually lived in. M6 proves the check cannot be satisfied by deleting the
sentences — a manifest that stops lying by saying nothing would otherwise read as health.

### Re-verification on 2026-09-21 before merge

This branch sat open for a day. Its single red check was
`Integration suites that pass on main` -> `check:intelligence-integration-quarantine`, which was a
condition of `main` at the time, not of this branch; it was repaired by a separate merge that landed
**after** this branch's checks last ran, so the red result on the PR was stale rather than caused
here. Current `origin/main` `56286b266aca8b83ffad82b2cb0b9a9cfb98e19a` was merged into the branch and
everything below was measured again on the merged tree. The 2026-09-20 figures above are left exactly
as they were recorded; these are a second measurement at a different base, not a correction of them.

**The premise still holds on current `main`.** Both false statements are still present, at
`.components[13].testingGates.integration_tests.evidence` and `.components[13].nextAction`, and the
verifier still runs 14 checks (`CH-01`..`CH-14`).

**Red-first, re-proved on the merged tree.** Restoring the manifest to the `main` text and running the
new suite: **1 failed / 3 passed**. With the correction in place: **4 passed / 0 failed**. The failure
listed all twelve contradictions by key path, six per statement.

**Directory CI scope** `npx jest src/__tests__/integration/qa --no-coverage`, measured on both sides at
this base -- clean `origin/main` `56286b266` in a separate worktree, and the merged branch:

| | suites | tests | failing |
|---|---|---|---|
| clean `origin/main` `56286b266` | 39 | 961 | 2, in `wireframe-compliance-audit` |
| merged branch | 40 | 965 | 2, in `wireframe-compliance-audit` |

Same suite, same two assertions, pre-existing and untouched. The four added tests are the whole
difference. The directory is in better shape than it was on 2026-09-20, when the same command
reported 7 failing across 4 suites; that improvement is other people's merges, not this change, and is
recorded here only so the two baselines in this record are not read as disagreeing.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
`tsconfig.tsbuildinfo` -- **exit 0**, zero diagnostic lines, exit code judged rather than grepped.
`npx eslint` on the new file -- **exit 0**.

**Four mutations re-run on the merged tree, four caught** -- M1 (the `main` text restored), M6 (every
claim about the suite deleted from the manifest), M3 (a stale quoted count), and M5 (a verifier check
begins deferring while the manifest claims a clean bill). M5 is worth its own line: the first attempt
at it **escaped**, and the escape was the mutation's fault rather than the test's. It assigned the
deferred status after the report's counts had already been computed, so the report still said zero
deferred and there was nothing for the assertion to catch. Moved ahead of the count computation, the
same mutation fails the clean-bill assertion with
`claims a clean bill, verifier reports 13 pass / 0 fail / 1 deferred`. A mutation that does not change
the value under test proves nothing about the test, and is recorded here rather than quietly dropped
from the tally.

## Rollout Plan

Merge to `main`. No migration, no flag, no data build. The repo-owned ACA main deploy workflow
carries it to the Lab/Product runtime like any other merge; the manifest is read from the image at
request time, so the corrected text appears once the new revision takes traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: produced by the main deploy workflow for the merge SHA.
- ACA runtime invariant: verified after merge — Container App template image == 100%-traffic
  revision image.
- Worker image invariant: verified on the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **not for correctness of this change** — the assertion is proven by
  the deterministic suite against the real verifier. An operator reading the corrected sentences on
  `/admin/production-readiness` is a presentation confirmation, and is recorded as owed rather than
  claimed.

## Rollback Plan

Revert the single squash commit. Nothing persists outside the image: no migration, no seeded data,
no flag. The previous manifest text returns with the revert and the new suite goes with it.

## Audit Evidence

- PR and its check run on the merge commit.
- The new suite's own output, which prints the contradiction list with key paths when it fails.
- The verifier report itself: `runApexStorylineVerification()` on the merge SHA.
- Slice statuses in `docs/build/build-slices.json` for the six named ids.
- ACA deploy run for the merge SHA, with template digest and 100%-traffic revision digest.

## Known Gaps

- **Half (b) of the item is deliberately not attempted here and is a decision, not code.** Whether a
  slice-integration check should resolve its module from `docs/build/build-slices.json` by slice id
  rather than guessing filenames is a standard for a family of verifiers under `src/lib/qa/`, not a
  one-file change. Recommendation recorded in the backlog; marked `decision needed`.
- **The slice with no check stays uncovered.** This change stops the manifest claiming it was
  deferred; it does not write the missing check, and whether that check should exist is part of the
  same (b) decision.
- **Named limit of the reader.** The test scopes each claim to the sentence that names the suite. A
  claim written in a sentence that does not name it is outside what this text reader can see.
  Widening the window to the whole field was considered and rejected: `nextAction` carries several
  unrelated and accurate deferrals, and flagging those is how a check gets relaxed until it stops
  failing. The limit is stated in the test file rather than left to be rediscovered.
- Signed-in confirmation that the corrected sentences render on the internal page: **owed, not
  performed.**
