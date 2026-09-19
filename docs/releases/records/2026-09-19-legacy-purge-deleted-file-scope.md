# 2026-09-19-legacy-purge-deleted-file-scope — The legacy-purge proof counts only deletions it has a finding about

## Release ID

`2026-09-19-legacy-purge-deleted-file-scope`

## Status

`candidate`

## Plain-English Summary

The legacy-purge audit writes six reports that are committed to the repository, and one of the
numbers in them is a count of "deleted legacy files". That count was not filtered to legacy files
at all. It was every file deleted in the author's working directory and not yet committed — a
source file, a test, a template, anything. So an author mid-edit who ran the standard
pre-pull-request verification got four committed reports rewritten underneath them, and the
committed proof bundle asserted that an ordinary file was a deleted legacy file.

Reproduced on clean `main` before any edit: deleting the release-record template made
`summary.json` report `deletedLegacyFileCount: 1`, made `deleted-legacy-files.csv` name that
template, made `summary.md` read `Deleted legacy files in this diff: 1`, and made the KPI card in
the committed HTML proof read `1`.

The count is now filtered through the audit's own list of blocked legacy paths — the same list its
`blockedPathFindings` are built from, rather than a second list that could drift from it. A
deletion the audit has no finding about is no longer counted, named, or written anywhere.

This also explains a report of churn that looked like a regression and was not. An earlier change
made these writers skip the write when a report would say the same thing. That guard was intact and
still is; it could not stop this churn, because between runs the findings genuinely differed. They
differed because they were wrong.

## Layer Impact

Lane: `internal-admin`. Release-control and audit tooling only.

- Control plane / product: unchanged. No route, component, agent surface or answer path is touched.
- Data plane: no schema, migration, loader, projection or tenant data change.
- Operator tooling: `scripts/audit/check-no-legacy-tenant-inputs.mjs` narrows one scan to the
  audit's own definition of a legacy path.

## Client Applicability

- All clients: no change. Nothing client-visible is affected.
- Specific clients: none.
- Internal only: yes — verification tooling and its committed report bundle.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/check-no-legacy-tenant-inputs.mjs` — `gitDeletedFiles()` filters its results
  through `blockedPathPatterns`, with the reasoning and the deliberately unchanged base recorded
  beside it.
- `src/__tests__/behaviors/audit-no-legacy-tenant-inputs-report-churn.test.ts` — three cases added
  to the existing suite, driving the real script as a subprocess in a scratch git repository.

## QA / Validation

Measured with the same commands either side, judged by exit code.

- Suite, final test file against the unmodified script taken from `origin/main`: **2 failed /
  7 passed of 9**. After the change: **0 failed / 9 passed**.
- The third new case passes on unmodified code by design. It is the guardrail that makes the cheap
  repair fail: a change that simply stopped counting deletions would satisfy the other two and
  leave the report saying nothing.
- Four mutations of the real script, each caught: the filter removed, i.e. the change reverted
  (2 failed); the filter made to match nothing (1); the filter narrowed by hand to `datasets/`
  rather than derived from the pattern list (1); the filter pointed at the content patterns instead
  of the path patterns (1). Script byte-restored after each.
- End-to-end, the reported scenario driven through the real command: with a non-legacy file deleted
  in the working tree, `node scripts/release-check.mjs --base origin/main --head HEAD` leaves all
  six reports untouched, and `git status` shows only the author's own files.
- Scope baseline `npx jest src/__tests__/behaviors`, same command either side: recorded below.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed beforehand: exit 0.
- `npx eslint` over the changed files: exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: exit 0, with a clean tree
  afterwards.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys on merge as
it does for any commit. Nothing in this change runs at runtime, so there is no functional rollout
step, no migration and no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No hand-run Azure command.
- Approved image digest: whatever the main deploy workflow builds for the merge commit.
- ACA runtime invariant: verified after merge — Container App template image equals the
  100%-traffic revision image, digest-pinned.
- Worker image invariant: verified for the non-manual worker jobs on the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. Operator audit tooling and its behavioral test only; no
  route, component, agent surface or data path changed, so there is nothing a signed-in session
  could observe.

## Rollback Plan

Revert the pull request. The scan returns to its previous scope on the next run of the audit; the
committed reports are regenerated by that run. No migration, no data change, no flag to unwind.

## Audit Evidence

- The pull request and its checks.
- The new suite executing in the `Behavior coverage floor` CI job, read in the job log rather than
  assumed from its presence in the tree.
- The mutation results recorded above, each reproducible by applying the named edit and re-running
  the suite.

## Known Gaps

- **The base of the deletion scan is unchanged and is still `HEAD`**, so what it observes is the
  author's uncommitted working tree. On any committed tree the count is therefore structurally
  zero, which is what the committed report has recorded throughout. Whether a committed proof
  bundle should carry that field at all — and if so what it should be measured against — is a
  decision about what the bundle is proof of, and it is logged in the backlog rather than taken
  inside a bounded repair.
- The wider question of whether generated proof bundles belong under version control is open and
  unchanged by this.
