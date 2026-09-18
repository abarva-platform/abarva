# 2026-09-18-release-check-no-report-churn — The release gate stops dirtying the tree it verifies

## Release ID

`2026-09-18-release-check-no-report-churn`

## Status

`candidate`

## Plain-English Summary

`node scripts/release-check.mjs` is the command every author is told to run before
opening a pull request. Until now it modified two files in the repository every
time it ran, whether or not it found anything. Both are committed reports, and the
only thing that changed in them was the line recording what time the report was
generated.

The effect was that a verification step made the working copy look edited. An
author who ran the gate as instructed then had two modified files they had not
touched, and had to either notice and undo that or carry the noise into their pull
request. Three separate automated runs hit this on the same day and each worked
around it by hand; two saved-work entries on the shared stash exist only because of
it.

The reports are now written only when what they say has actually changed. When the
findings are the same as last time, the existing file is left exactly as it is,
including its older generation timestamp — which is the more accurate reading, since
that timestamp then records when the content was produced rather than when a check
last looked and found nothing new. When the findings do change, the report is
rewritten with a new timestamp exactly as before.

No check was weakened. The audit computes the same findings, reports them the same
way, and exits the same way. Only the decision to overwrite an identical file
changed.

## Layer Impact

- Lane: `internal-admin`. Operator and release-control tooling only.
- No product layer is affected. This touches no product surface, no API route, no
  component, no adapter and no canonical model object. Layer 1 through layer 4 of
  the enterprise information architecture are untouched, and no data plane is read
  or written.

## Client Applicability

- All clients: no change. Nothing client-visible is altered.
- Specific clients: none.
- Internal only: yes — this affects the local and CI behaviour of the release gate
  and nothing else.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/check-no-legacy-tenant-inputs.mjs` — report writers now skip the
  write when the report content is unchanged. Two helpers added: `writeIfChanged`
  for the four deterministic reports, and `writeJsonIfFindingsChanged` for the two
  that carry a generation timestamp, which is excluded from the comparison.
- `src/__tests__/behaviors/audit-no-legacy-tenant-inputs-report-churn.test.ts` — new
  behavioral suite driving the real script as a subprocess in a scratch repository.
- This record.

## QA / Validation

Defect reproduced on clean `main` before any edit: with a clean working copy,
`node scripts/release-check.mjs --base origin/main --head HEAD` exited 0 and left
`reports/data-standard/legacy-purge/summary.json` and
`.../blocked-loader-paths.json` modified, with a single changed line in each.

- **Suite, measured against the unmodified script taken from `origin/main`:**
  4 failed / 2 passed / 6 total → **0 failed / 6 passed** after.
  The two cases that pass on unmodified code are deliberate guardrails: a report
  that is absent must still be written, and changed findings must still be
  rewritten with a new timestamp. They are what makes an over-broad repair fail.
- **Five mutations, each caught** (failures out of 6): restoring the unconditional
  timestamped write, 4; making the plain writer unconditional, 1; never writing
  when the file already exists — the over-broad repair, 1; comparing without
  excluding the volatile field, 4; reverting the markdown and CSV writers to
  unconditional writes, 1.
- **A gap found and closed during the mutation pass, recorded because it is the
  point.** The first version of the suite asserted only that the working copy stayed
  clean. That assertion cannot see a writer that rewrites a file with identical
  bytes, because the version control system compares content — so the mutation that
  made the plain writer unconditional survived, and the guard on four of the six
  reports was unproven. A case asserting modification times are unchanged was added,
  which states the property directly: the audit does not rewrite an unchanged report.
  That mutation is now caught.
- **End-to-end:** `node scripts/release-check.mjs --base origin/main --head HEAD`
  from a clean tree now leaves the two reports untouched; the only entries in the
  status output are the files this change actually edits.
- **Scope baseline, same scope both sides:** `npx jest src/__tests__/behaviors`
  0 failing / 209 passing before, 0 failing / 215 passing after.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0,
  with `tsconfig.tsbuildinfo` removed beforehand. `npx eslint` exit 0 with no
  warnings. All judged by exit code.
- The new suite runs in CI: `src/__tests__/behaviors` is the scope of the
  `Behavior coverage floor` job in `.github/workflows/coverage-threshold.yml`, and
  is also inside `test:before-commit`.

## Rollout Plan

Merge to `main`. No runtime rollout: this is a build-time and operator script with
no deployed surface. The repository-owned Azure Container Apps deploy workflow will
run on merge as it does for every commit, and this change alters nothing it deploys.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: unaffected; the deploy that follows the merge is verified
  as usual and its result is recorded with the merge.
- Worker image invariant: unaffected. No job image is added, changed or re-pinned.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing renders to a signed-in user; this
  is a script that runs during verification.

## Rollback Plan

Revert the pull request. The change is two files with no state, no schema and no
stored artifact, so reverting restores the previous behaviour immediately and
completely. No migration is involved and no data is written.

## Audit Evidence

- The pull request and its checks.
- The `Behavior coverage floor` CI job, which executes the new suite.
- The suite itself, which drives the real script as a subprocess rather than
  reading it as text, so it observes behaviour rather than the presence of a token.
- The before and after measurements in QA / Validation above, each taken over the
  same scope.

## Known Gaps

- The six reports remain under version control. The item this closes offered two
  acceptable resolutions — stop rewriting unchanged reports, or move the reports out
  of version control — and this takes the one that changes less. Whether generated
  proof bundles belong in the repository at all is a broader question and remains
  open.
- The same pattern may exist in other audits that write committed reports. This
  change does not sweep for them; a sweep is worth doing and is not attempted here,
  because the ones worth changing are the ones a verification command actually runs,
  and establishing that list is its own piece of work.
- Skipping the write preserves the earlier generation timestamp on an unchanged
  report. That is deliberate and argued above, but it does mean the reports no
  longer record when the audit last ran. Nothing reads them for that.
