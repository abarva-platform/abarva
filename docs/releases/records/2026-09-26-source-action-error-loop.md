# 2026-09-26 Source action error-loop guard

## Release ID

`2026-09-26-source-action-error-loop`

## Status

`candidate`

## Plain-English Summary

When Source has already received a contract-detail failure, the related action drawer no longer offers a link straight back to that failed detail view. The action remains available for review. A contract outside the preloaded summary is not considered failed until its own detail request actually fails.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source workspace presentation only. Layer 3 contract identities, facts, and action records are unchanged.

## Client Applicability

- All clients: Source workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The action drawer reads the selected contract's actual detail-error state before offering Contract 360 navigation.
- The existing CI-wired workspace browser test covers the error loop. The separate successful off-slice detail case remains covered.
- No migration, loader, email, supplier contact, or tenant data mutation.

## QA / Validation

- Pass: red-first browser behavior and a deliberate false-state mutation that caused the regression test to fail.
- Pass: three focused Source workspace suites, 21/21 tests.
- Pass: ESLint, full TypeScript check with an 8 GB Node heap, and release check.
- Not run: post-deploy signed-in replay; required after the official main workflow.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repo-owned ACA main workflow may build and deploy the web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Verify from the completed workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision after deployment.
- Worker image invariant: Verify required workers separately.
- Feature/env flag update path: None.
- Live signed-in proof required: Reopen the measured missing-detail action, review its drawer, and confirm the failed Contract 360 link is absent; also verify a detail-backed path.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the reverted image. No schema rollback is required.

## Audit Evidence

- PR, CI, deploy run, and signed-in replay are recorded in the private smoke ledger as they complete.

## Known Gaps

The missing contract detail/identity mapping remains a separate read-model task. This release does not create a canonical contract or claim Contract 360 acceptance for that record.

## Post-deployment signed-in replay

**Appended 2026-09-26 (item `C-528`). Every line above is left exactly as
written: this record is audit history, and a correction to it is an addition,
never an edit.** What those lines said was true when they were written — the
record is authored before the merge, and the replay happens after the deploy.

- The signed-in post-deployment replay was run. This section is the record of
  its outcome; the line above is the state as of the candidate, not the result.
- Recorded in the execution register at `2026-09-26T13:26:15Z` by `codex-source-cpo#20260926T125422Z`.
- What it found: the known-error action drawer no longer loops, and the
  canonical detail for the affected record is still absent.
- Residual carried by: item `C-542`, filed by this correction. Nothing carried
  the missing canonical detail before it — the finding existed only in the
  register line, which CI cannot read.
- **Scope is UNDETERMINED and is not claimed here.** The requirement above names
  three assertions — reopening the measured missing-detail action, reviewing its
  drawer, and also verifying a detail-backed path. The register settles the
  drawer; it does not say whether the detail-backed path was exercised.
- No signed-in run was performed by this correction. It reconciles two existing
  accounts of one run, and the appended-to record is the durable one.
