# 2026-09-27-source-evaluation-authority-gate - Evaluation advance authority

## Release ID

`2026-09-27-source-evaluation-authority-gate`

## Status

`candidate`

## Plain-English Summary

Advancing a Source event out of Evaluation now requires the current event's approved, complete human scorecard. An unavailable read, incomplete score, missing evidence reference, unlocked score, wrong tenant, or criterion weights that do not total 100 blocks the transition before an approval or stage write.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source workflow only. Existing scorecard authority records are read from the data plane; no canonical commercial facts, supplier records, or evaluator decisions are created or altered.

## Client Applicability

- All clients: Source events using the Evaluation stage.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The shared stage-advance contract, both persisted stage-advance routes, the scorecard authority view, and focused behavioral tests. No migration or data job.

## QA / Validation

- Pass: red-first tests demonstrated a missing scorecard read and an invalid weight total were previously accepted.
- Pass: focused contract, view and route tests (61/61).
- Pass: deliberate Evaluation-guard removal made the missing-authority and opposite-tenant tests fail; restoring the guard returned 61/61 to green.
- Blocked (pre-existing): related-test sweep ran 481/502 tests green. Five seeded-canvas suites (21 failures) could not resolve their golden event; the same missing-event failure reproduced on the clean base checkout.
- Pass: TypeScript no-emit check.
- Pass: scoped ESLint and release check before PR.
- Not run: live positive evaluator score readback, because it requires an authorized human and governed response evidence.

## Rollout Plan

Squash merge through a reviewed PR. Only the repo-owned ACA main deploy workflow may build and deploy the merged SHA. No data build, migration apply, feature flag, or external notification is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only.
- Approved image digest: Determine from the completed main workflow.
- ACA runtime invariant: Verify template and healthy 100%-traffic revision match the digest.
- Worker image invariant: Verify required delivery workers match the digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Replay the exact Evaluation advance failure on an eligible signed-in event; distinguish blocked earlier-stage events from a positive Evaluation readback.

## Rollback Plan

Revert the merge through a PR and redeploy through the same main workflow. No schema or data rollback is needed.

## Audit Evidence

The PR, CI checks, focused red/green test output, official ACA run and digest-pinned read-only runtime proof. Signed-in acceptance is recorded separately.

## Known Gaps

No positive live evaluator scoring or Evaluation advance is claimed. The frozen synthetic event remains at its earlier Scope gate.
