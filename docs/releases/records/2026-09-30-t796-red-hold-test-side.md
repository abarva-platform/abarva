# 2026-09-30-t796-red-hold-test-side — Make the T-788 red hold re-ask the test, not only the code

## Release ID

`2026-09-30-t796-red-hold-test-side`

## Status

`candidate`

## Plain-English Summary

The T-788 stale-suite control (`src/__tests__/behaviors/t788-stale-suite-wiring.test.ts`)
keeps two test directories out of CI and must say why, with reasons it
recomputes rather than reads from its record. For a "red" hold it asked the
live *code* the failing case's question and checked that the test file still
contained the case's title. It never asked the *test*. So once a held test was
updated to agree with the code, the row still read as a valid red hold.

That is what happened on `main`: the change merged as `5e7f1ed482` (T-790 half
a) updated `corpus-activation.test.ts` to the current persona register, and the
file now passes 5 of 5, yet the control stayed 9 of 9 green on a record row that
still says the case is red. The directory's hold stayed correct only because the
sibling row, `load-rehearsal.test.ts`, is genuinely red.

This change makes the red reason ask the test as well: the held file is run out
of process with jest, filtered to its one failing case, and that case's own
status is read from the JSON report. The hold stands only when the case still
fails. A case the filter does not reach counts as "not failing", so a renamed or
mistyped title cannot keep a hold alive.

The now-stale row is **not deleted**. It is annotated `redResolved` (item,
pull request, merge SHA), is held beside its still-red sibling, and the control
checks that annotation in the opposite direction: the named case must now
**pass** when run. The triage-time fields (`green`, `redProbe`, `failingCase`)
stay as they were observed. Superseding the row when the directory is finally
wired remains T-790's last step.

## Layer Impact

**Release lane: `global-control-lane`.** CI tooling only.

- **Layer 4 (Products):** no change. No product module is imported or edited.
- **Platform tooling / CI:** one behaviour-suite control and its triage record.
  The control already runs in the behaviour suite; no workflow edit.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test and record only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/behaviors/t788-stale-suite-wiring.test.ts`: `askTheTest`
  (out-of-process jest run of one named case, status from its JSON report,
  cached per file and title); the `red` reason now also requires that status to
  be `failed`; rows carrying `redResolved` are no longer red carriers and must
  report `passed`; the hold case's timeout raised to 180 s for the two child
  runs.
- `docs/architecture/t788-stale-suite-triage.json`: `redResolved` and
  `heldWithSibling` added to the `corpus-activation.test.ts` row, with a note.

The child processes are run out of process for the same reason the code probe
is: importing held suites or product modules into the behaviour suite would
move its coverage denominator (T-781's finding).

## QA / Validation

**Status: pass.** Local runs below; CI runs the behaviour suite on the PR.

**Red first, on real data.** On `main` `5e7f1ed482` with only the control
change applied: **1 failing / 9**, and the failure names exactly one row —
`reasonGone: ["…/corpus-activation.test.ts"]`. The still-red sibling is not
named, so the child run reached its case and read `failed`. On `main` without
the change: 0 failing / 9 (the defect). With the record annotation: 0 failing / 9.

**Same-scope baseline** (`npx jest src/__tests__/behaviors`): 167 suites /
1764 tests / 0 failing before and after; no case added or removed.
`npm run coverage:behavior-gate` exited 0 at lines 90.12 / functions 69.42 /
branches 70.25, unchanged.

**Mutations,** each against the final control and record, then both files
restored byte-for-byte from saved copies:

| Mutation | Result |
|---|---|
| M1: test-side check removed, record as on `main` | 0 of 9 fail — the old control, confirming the red above comes from the new check |
| M2: the still-red sibling marked `redResolved` | 1 of 9 fails |
| M3: `askTheTest` always answers `failed` | 1 of 9 fails |
| M4: case matched against a title that never occurs (reported `missing`) | 1 of 9 fails |
| M5: sibling's `failingCase` pointed at one of its passing cases | 1 of 9 fails |
| M6a: resolved row's `failingCase` pointed at a title not in the file | 1 of 9 fails (`resolvedButNotPassing`) |
| M6b: M6a with the resolved check removed | 0 of 9 — the check M6a caught is the one that fired |
| M7: `redResolved` annotation removed, control kept | 1 of 9 fails (`reasonGone`) |

Six of six mutations against the final control are caught; M1 and M6b show
which check catches them.

Other checks: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exited 0, judged by exit code. ESLint reported 0 problems on the
changed file. `node scripts/release-check.mjs --base origin/main --head HEAD`
run before opening the pull request.

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

- Other triage controls with the same red-hold shape (earlier stale-suite draws)
  were not audited for the same defect in this change.
- The control now costs two child jest runs (about two seconds locally); it
  grows by one run per held red row.
