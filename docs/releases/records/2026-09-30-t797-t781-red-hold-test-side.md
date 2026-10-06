# 2026-09-30-t797-t781-red-hold-test-side — Make the T-781 red hold re-ask the test, not only the code

## Release ID

`2026-09-30-t797-t781-red-hold-test-side`

## Status

`candidate`

## Plain-English Summary

The T-781 stale-suite control (`src/__tests__/behaviors/t781-stale-suite-wiring.test.ts`)
keeps held test directories out of CI and must justify each hold with a reason
it recomputes. For a "red" hold it asked the live *code* the failing case's
question (`normalizeCanonicalIndustry(redProbe.input)`) and compared the answer
with the record's `expectedByTest`. It never asked the *test*. Because
`expectedByTest` is read from the record, a held test updated to agree with the
code would still read as a valid red hold. This is the defect T-796 (#8738)
fixed in the T-788 control; T-797 applies the same fix here.

The red reason now also asks the test: the held file is run out of process with
jest, filtered to the row's `failingCase`, and that case's own status is read
from the JSON report. The hold stands only when the case still fails, and the
title must still occur in the file. A case the filter does not reach counts as
"not failing". The failure output now names each red row whose reason is gone
(`redReasonGone`), not only the directory-level hold kind.

For the item that eventually settles the held case (T-783), the control accepts
the same resolution shape as T-788: the row is annotated `redResolved` (item,
pull request, merge SHA), the directory drops `red` from its hold kinds, and the
control checks the annotation in the opposite direction — the named case must
now **pass** (`resolvedButNotPassing`). The row is never deleted.

**Measured on `main` `896b982552`:** the one T-781 red row
(`canonical-grounding.test.ts`, case "normalizes tenant industry codes before
canonical lookup") is still genuinely red, 1 of 5 failing. No row is stale
today, so the record is unchanged.

## Layer Impact

**Release lane: `global-control-lane`.** CI tooling only.

- **Layer 4 (Products):** no change. No product module is imported or edited.
- **Platform tooling / CI:** one behaviour-suite control. It already runs in
  the behaviour suite; no workflow edit, no record edit.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/behaviors/t781-stale-suite-wiring.test.ts`: `askTheTest`
  (out-of-process jest run of one named case, status from its JSON report,
  cached per file and title); the `red` reason now also requires the
  `failingCase` title in the file and that case's status to be `failed`;
  `redReasonGone` names stale red rows; rows carrying `redResolved` must report
  `passed`; the hold case's timeout raised to 180 s for the child run.

## QA / Validation

**Status: pass.** Local runs below; CI runs the behaviour suite on the PR.

**Red first.** With the held case edited (locally, never committed) to agree
with the code — both of its disagreeing expectations — the control on `main`
stays **0 failing / 9** (the defect); with this change it is **1 failing / 9**,
and the failure names exactly `redReasonGone: ["…/canonical-grounding.test.ts"]`.
On unmodified `main` data: 0 failing / 9 before and after. Negative control:
editing only one of the two disagreeing expectations leaves the case red, and
the control correctly stays 0 / 9.

**Same-scope baseline** (`npx jest src/__tests__/behaviors`): 167 suites /
1764 tests / 0 failing before and after; no case added or removed.
`npm run coverage:behavior-gate` exited 0 at lines 90.12 / functions 69.42 /
branches 70.25, unchanged.

**Mutations and scenarios,** each against the final control, files restored
from saved copies afterwards:

| Case | Result |
|---|---|
| M1: test-side check removed, held case updated | 0 of 9 fail — detection lost; the red above comes from the new check |
| M2: `askTheTest` always answers `failed`, held case updated | 0 of 9 fail |
| S3: row annotated `redResolved`, `red` dropped from kinds, case still red | 1 of 9 fails (`resolvedButNotPassing`, the only guard in play) |
| M3: S3 with the resolved check removed | 0 of 9 — the check S3 caught is the one that fired |
| S4: case updated **and** annotated (the intended resolution) | 0 of 9 |

One guard written in the first draft (`red` also excluding `redResolved` rows)
survived its mutation because both callers already exclude such rows; it was
removed rather than kept as untested code.

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

- Earlier stale-suite triage controls (before T-781) were not audited for the
  same red-hold shape in this change.
- The control now costs one child jest run per held red row (about a second
  locally).
