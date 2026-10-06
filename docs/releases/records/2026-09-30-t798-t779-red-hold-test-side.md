# 2026-09-30-t798-t779-red-hold-test-side — Make the T-779 red hold re-ask the test, not only the code

## Release ID

`2026-09-30-t798-t779-red-hold-test-side`

## Status

`candidate`

## Plain-English Summary

The T-779 stale-suite control (`src/__tests__/behaviors/t779-stale-suite-wiring.test.ts`)
keeps held test directories out of CI and must justify each hold with a reason
it recomputes. For a "red" hold it asked only the live *code*: the governed
policy's `isCanonicalClientKey(blockedClientKey)` had to still return false. It
never asked the *test*. A held test updated to agree with the code would still
read as a valid red hold, and the directory would stay dark with no reason.
This is the defect T-796 (#8738) fixed in the T-788 control and T-797 (#8742)
fixed in the T-781 control; T-798 applies the same fix to T-779, the last
triage control with a red hold kind (T-785's holds are scanner and test-only
kinds, with no red kind).

The red reason now also asks the test: the held file is run out of process with
jest, filtered to the row's `failingCase`, and that case's own status is read
from the JSON report. The T-779 record names the case by its **full name**
(describe block plus title), so the case is matched on jest's `fullName`, not
its bare title; a case the filter does not reach counts as "not failing". The
failure output now names each red row whose reason is gone (`redReasonGone`),
not only the directory-level verdict.

The resolution shape matches T-788 and T-781: the row is annotated
`redResolved` (item, pull request, merge SHA) and never deleted, and the
annotation is checked in the opposite direction — the named case must now
**pass** (`resolvedButNotPassing`).

**Measured on `main` `63d2f6b79b`:** the one T-779 red row
(`governed-vendor-proposal-facts.test.ts`) is still genuinely red, 1 of 4
failing. No row is stale today, so the record is unchanged.

## Layer Impact

**Release lane: `global-control-lane`.** CI tooling only.

- **Layer 4 (Products):** no change. No product module is edited.
- **Platform tooling / CI:** one behaviour-suite control. It already runs in
  the behaviour suite; no workflow edit, no record edit.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/behaviors/t779-stale-suite-wiring.test.ts`: `askTheTest`
  (out-of-process jest run of one named case, status read by full name from its
  JSON report, cached per file and name); the red reason now also requires that
  case's status to be `failed`; `redReasonGone` names stale red rows; rows
  carrying `redResolved` must report `passed`; the hold case's timeout raised to
  180 s for the child run.

## QA / Validation

**Status: pass.** Local runs below; CI runs the behaviour suite on the PR.

**Red first.** With the held case edited (locally, never committed) to agree
with the code — both of its disagreeing expectations — the held file passes
4 of 4, yet the control on `main` stays **0 failing / 8** (the defect). With
this change it is **1 failing / 8**, naming exactly
`redReasonGone: ["…/governed-vendor-proposal-facts.test.ts"]`. On unmodified
`main` data: 0 failing / 8 before and after. Negative control: editing only one
of the two expectations leaves the case red, and the control correctly stays
0 / 8.

**Same-scope baseline** (`npm run test:behaviors`): 167 suites / 1764 tests /
0 failing before and after; no case added or removed.
`npm run coverage:behavior-gate` exited 0 at lines 90.12 / functions 69.42 /
branches 70.25, unchanged.

**Mutations and scenarios,** each against the final control, files restored
from a saved copy afterwards:

| Case | Result |
|---|---|
| M1: test-side check removed, held case updated | 0 of 8 fail — detection lost |
| M2: verdict forced to `failed`, held case updated | 0 of 8 fail — detection lost |
| M4: case matched on bare `title` instead of `fullName`, main data | 1 of 8 fails — the full-name match is load-bearing |
| S3: row annotated `redResolved`, case still red | 1 of 8 fails (`resolvedButNotPassing`) |
| M3: S3 with the resolved check removed | 0 of 8 — the check S3 caught is the one that fired |
| S4: case updated **and** annotated | 1 of 8 fails on `reasonHolds: false`, which is correct: the directory's only red row is resolved, so its hold has no reason left and it must be wired |

A first draft of M2 forced only the return value; the per-file cache then
served the real verdict on the second call and the control still caught S1, so
that mutation did not test what it claimed. It was redone at the verdict
computation (the M2 row above).

Other checks: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exited 0, judged by exit code. ESLint 0 problems on the changed
file. `npm run audit:test-ci-coverage:check` matches the committed census.
`node scripts/release-check.mjs --base origin/main --head HEAD` run before
opening the pull request.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. Nothing to unwind in a running environment.

## Audit Evidence

- The red-first, baseline and mutation results above, from local runs.
- The behaviour-suite job's run of the control on this PR.

## Known Gaps

- The T-479 triage control checks recorded counts rather than a live probe; it
  was not audited in this change.
- The control now costs one child jest run per held red row.
