# 2026-09-17-source-empty-export-answer - Refuse unsupported action memo

## Release ID

`2026-09-17-source-empty-export-answer`

## Status

`candidate`

## Plain-English Summary

When a contract has no governed optimization levers, Source aVa no longer calls the empty packet an optimization case or recommends exporting a client action memo. It directs the user to review contract-specific evidence instead.

## Layer Impact

`global-control-lane`: Layer 4 answer presentation only. No intake, adapter, canonical fact, schema, or data mutation.

## Client Applicability

- All clients: Source aVa contract export answers using this builder.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The Source contract export answer branch and its behavior test.

## QA / Validation

PASS: focused answer tests (17/17), with the added export refusal assertion failing before the fix; scoped lint, TypeScript and release gate. The adjacent aVa cluster has the same seven failures in three other suites on this branch (296/303) and untouched main (293/300), so cluster acceptance remains BLOCKED on those baseline failures. NOT RUN: CI and signed-in answer proof.

## Rollout Plan

Squash merge through a PR after the preceding Source answer deploy completes. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA; no migration or data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Verify through the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Ask for an action memo on an empty contract packet and verify refusal.

## Rollback Plan

Revert this presentation change in a new PR and redeploy via the repo-owned workflow; no data rollback.

## Audit Evidence

PR diff, focused/cluster tests, release check, ACA deploy run and signed-in answer capture when available.

## Known Gaps

Missing opportunity evidence remains a data coverage gap. No signed-in answer proof is claimed by this record.
