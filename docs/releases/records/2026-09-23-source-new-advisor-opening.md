# 2026-09-23-source-new-advisor-opening - Neutral advisor opening

## Release ID

`2026-09-23-source-new-advisor-opening`

## Status

`candidate`

## Plain-English Summary

The default Source New advisor opening now describes a sourcing event without
assuming it is an IT request. It matches the already-neutral five-fact form.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source presentation only. No intake, adapter, or canonical-model change.

## Client Applicability

- All clients using default manual Source New intake.
- No client-specific or private-data change.
- No feature flag.

## Changes Included

- Correct the default advisor quote shown beside the manual intake.
- Add a rendered component assertion covering the quote and the existing form.
- Preserve imported-request quotes, five-fact readiness, and event-creation gates.

## QA / Validation

- The CI-run rendered component test failed before the quote change and passed
  after it; the former IT wording is explicitly rejected.
- Scoped lint, Node 24 typecheck, and release check run before PR.
- Signed-in verification is required after deployment.

## Rollout Plan

Squash merge after applicable checks pass, deploy only through the repo-owned
ACA main workflow, prove digest alignment, and replay the default intake.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators outside that workflow: none.
- Approved image digest and ACA/worker invariant: pending deployment.

## Rollback Plan

Revert through a PR and redeploy through the same repo-owned workflow. No data
rollback is needed.

## Audit Evidence

- PR, hosted CI, deploy digest, and signed-in quote readback are distinct gates.

## Known Gaps

This copy fix does not import a request, complete classification, or advance a
sourcing event.

## Post-deployment signed-in replay

**Appended 2026-09-26 (item `C-528`). Every line above is left exactly as
written: this record is audit history, and a correction to it is an addition,
never an edit.** What those lines said was true when they were written — the
record is authored before the merge, and the replay happens after the deploy.

- The signed-in post-deployment replay was run. This section is the record of
  its outcome; the line above is the state as of the candidate, not the result.
- Recorded in the execution register at `2026-09-23T05:31:12Z` by `codex-source-new-advisor-opening`.
- What it found: the default signed-in intake rendered a neutral opening and
  five neutral form prompts. No defect is recorded against it.
- **Scope is UNDETERMINED and is not claimed here.** The requirement above names
  no individual assertions to check, so there is nothing to compare the
  register's account against assertion by assertion. What the register settles is
  the sentence quoted above, and no more than it.
- No signed-in run was performed by this correction. It reconciles two existing
  accounts of one run, and the appended-to record is the durable one.
