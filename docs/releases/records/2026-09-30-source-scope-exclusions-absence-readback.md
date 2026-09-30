# 2026-09-30-source-scope-exclusions-absence-readback — Preserve Scope decision readback

## Release ID

`2026-09-30-source-scope-exclusions-absence-readback`

## Status

`candidate`

## Plain-English Summary

An exclusions decision based on an audited no-current-SOW declaration now survives the PostgreSQL read path. PostgreSQL can return the declaration time as a Date object while the decision receipt stores an ISO timestamp. Equivalent instants count as the same source revision; a changed time, reason, or applicability still invalidates the decision.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no supplier, finance, contract, or operational fact changes.
- Layer 4 Source: normalizes an event-scoped workflow decision's timestamp for readback. Existing authority and evidence gates remain unchanged.

## Client Applicability

- All clients: yes, when a Scope exclusions decision cites an audited absence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Normalize the audited absence timestamp to ISO and compare the instant rather than string formatting.
- Cover PostgreSQL Date readback and a changed-timestamp stale-source negative.
- No schema migration or data build.

## QA / Validation

- Pass: red-first PostgreSQL Date readback failed on the prior code and passed after correction.
- Pass: removing the timestamp freshness comparison made the stale-source test fail; the check was restored.
- Pass: four focused suites, 54 behavior tests; TypeScript with an 8 GB Node heap; scoped ESLint; release check; diff check.
- Not run: the default-heap TypeScript attempt exhausted Node's 4 GB limit without a code diagnostic; the larger-heap run passed.
- Not run: PR CI, official deploy, and signed-in acceptance until the release progresses through those independent gates.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repository-owned ACA main workflow may deploy to shared runtime. Verify the exact image digest on the web template, sole 100%-traffic revision, and required workers, then replay the exclusions step signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this branch or agent session.
- Approved image digest: determined by the official main run.
- ACA runtime invariant: verify digest-pinned template and Healthy/Running 100%-traffic revision.
- Worker image invariant: both delivery job templates must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the completed step must survive reload without weakening stale-source rejection.

## Rollback Plan

Revert the PR through protected main and the same deploy workflow. Existing receipts remain auditable; the prior timestamp readback behavior would return.

## Audit Evidence

Focused red/green and mutation output in the PR, then applicable CI, official ACA run, digest readback, and the private signed-in smoke ledger.

## Known Gaps

This release does not mark any gate criterion met, approve a Scope stage, or authorize an external release.
