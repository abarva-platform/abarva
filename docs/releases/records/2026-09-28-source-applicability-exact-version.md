# 2026-09-28 Source evidence applicability exact-version guard

## Release ID

`2026-09-28-source-applicability-exact-version`

## Status

`candidate`

## Plain-English Summary

An accountable evidence-applicability decision could be rejected as stale even when its requirement had not changed. PostgreSQL retains microseconds in the row version, while a JavaScript date read rounds that version to milliseconds. This change reads the exact database version before the guarded update. A genuinely changed row is still rejected.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source evidence-decision route only. No canonical commercial fact, evidence readiness state, or authorization rule changes.
- Layer 3 Canonical Model: No schema or data migration in this release.

## Client Applicability

- All clients: Source events using the requirement-applicability decision path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Read a tenant-scoped evidence row with a precise text form of its database version, then use that version in the existing optimistic update.
- Add behavioral coverage for microsecond precision, tenant scoping, and concurrent-change rejection.

## QA / Validation

- Pass: red-first test reproduced the false stale rejection; the fix passes the focused route suite.
- Pass: deliberate mutation restoring the rounded date was caught by the focused regression test.
- Pass: focused adjacent tests, Node 24 typecheck, scoped ESLint, and release control, recorded in the PR.
- Not run: live signed-in positive replay until main deployment.

## Rollout Plan

Squash merge after applicable CI/review, then use only the repo-owned ACA main deploy workflow. No migration or data build is part of this code release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required worker jobs match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, repeat the previously rejected requirement decision after deployment.

## Rollback Plan

Revert the application change via a reviewed PR and the same main deploy workflow. The independent applicability schema migration is not rolled back by this release.

## Audit Evidence

PR, CI, main deploy run, runtime digest readback, and signed-in decision replay will be recorded in the private smoke ledger.

## Known Gaps

This repair does not create a contract, spend baseline, or Stage approval. Evidence and deliverable gates remain separate.
