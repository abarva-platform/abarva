# 2026-09-30-source-client-final-quality-revision — Recover from failed artifact review

## Release ID

`2026-09-30-source-client-final-quality-revision`

## Status

`candidate`

## Plain-English Summary

A current-stage Client Final that fails the consulting-grade review can now be replaced with a revised file. The existing review action remains available, and a failed review stays failed until a separate review of the revised version passes. Replacement is not offered for a past stage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source presentation only. The current-stage artifact queue exposes the existing governed replacement action beside quality review. No canonical object, evidence fact, approval right, database schema, or release authority changes.

## Client Applicability

- All clients: yes, on the Source artifact review queue.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Current-stage Client Final queue action and mounted regression test.
- No route, storage, migration, or worker change.

## QA / Validation

- Pass: red-first mounted test reproduced the missing replacement action on a failed quality receipt.
- Pass: both deliberate mutations were caught: removing replacement, and allowing it on a past stage.
- Pass: three adjacent suites, 58 tests; scoped ESLint; TypeScript `--noEmit`.
- Not run: CI, live signed-in replacement, post-replacement quality review. These remain release follow-up evidence.

## Rollout Plan

Squash merge through the protected PR path. Only the repository-owned ACA main workflow may build and deploy to the shared runtime. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no ad-hoc mutator is authorized.
- Approved image digest: determined by the official main deploy workflow.
- ACA runtime invariant: verify digest-pinned web template and the Healthy 100%-traffic revision.
- Worker image invariant: verify both required delivery workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: replace a failed-quality current-stage Client Final and verify the quality receipt is re-evaluated separately.

## Rollback Plan

Revert this presentation-only commit through a new PR and redeploy via the main workflow. Existing accepted files and review receipts remain in the governed artifact history.

## Audit Evidence

Focused mounted test, deliberate mutation results, PR checks, official ACA run and digest readback, followed by signed-in replacement/readback. The latter evidence is not yet claimed.

## Known Gaps

A failed quality review still requires a human-reviewed revised file and a new quality pass. This UI action does not make an unreviewed file releasable or advance the stage gate.
