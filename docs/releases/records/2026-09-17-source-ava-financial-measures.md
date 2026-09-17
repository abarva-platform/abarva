# 2026-09-17-source-ava-financial-measures - Distinct contract money measures

## Release ID

`2026-09-17-source-ava-financial-measures`

## Status

`candidate`

## Plain-English Summary

Source aVa distinguishes a contract's recorded annual value, total committed value, and actual annual spend in its evidence-bound answer. It does not infer that invoices were paid from spend or that a candidate opportunity became realized savings.

## Layer Impact

`global-control-lane`: Layer 4 answer presentation only. No intake, adapter, canonical fact, schema, or data mutation.

## Client Applicability

- All clients: Source aVa contract answers using this builder.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The Source workspace visual answer builder and its financial-measure behavior test.

## QA / Validation

PASS: focused answer tests (16/16), with the financial-measure assertion failing before the code change; scoped lint, TypeScript and release gate. The Source aVa cluster has the same seven failures in three unrelated suites on this branch (295/302) and untouched main (293/300); broader cluster acceptance remains BLOCKED on those baseline failures. NOT RUN: CI and signed-in answer proof.

## Rollout Plan

Squash merge through a PR only after the preceding Source answer deploy completes. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA; no migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Verify through the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Check one contract with all three measures and one with an absent commitment.

## Rollback Plan

Revert this presentation change in a new PR and redeploy via the repo-owned workflow; no data rollback.

## Audit Evidence

PR diff, focused and adjacent tests, release check, ACA deploy run and signed-in answer capture when available.

## Known Gaps

Paid-invoice evidence and finance confirmation remain separate from actual spend. No signed-in answer proof is claimed by this record.
