# Source Performance Unit Integrity

## Release ID

`2026-10-07-source-performance-unit-integrity`

## Status

`candidate`

## Plain-English Summary

Contract performance measures now retain their declared measurement unit. A response time is displayed as time, a backlog as a count, and a percentage as a percentage. Previously loaded rows whose metric and stored unit disagree are withheld from the numeric display pending source-record correction.

## Layer Impact

- Release lane: `client-data-lane`, because the contract-depth loader can write canonical performance observations only through a separately governed data build.
- Layer 2 Source Adapters: the contract-depth package loader resolves and validates measurement units during preflight, before either adapter or canonical apply.
- Layer 3 Canonical Model: the existing performance observation's `unit`, numeric value, actual text, and target text are written consistently on a separately authorized load. No schema change or data load is included in this release.
- Layer 4 Products: Source contract performance refuses to present contradictory units and only charts comparable observations.

## Client Applicability

- All clients: shared Source code paths using contract performance observations.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Contract performance unit resolution and display guard.
- Contract-depth loader unit persistence, including conflict-update behavior.
- Behavioral tests for time, count, percentage, unknown units, and legacy unit conflicts.

## QA / Validation

- Pass: red-first and mutation checks demonstrate that a stored percent for a time metric is refused.
- Pass: focused loader and display tests, TypeScript typecheck, changed-file lint, release validation, and read-only package plan.
- Not run yet: applicable PR CI; green completion is required before merge.
- Not run yet: signed-in display replay after deploy; code checks alone are not live acceptance.

## Rollout Plan

Merge by PR after green applicable checks. The repo-owned ACA main deploy workflow is the only shared-runtime rollout path. Existing canonical rows are not rewritten by the deploy. Any corrective package replay requires a separate, exact data-build authorization and ledger/readback evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: verify from the main deploy run.
- ACA runtime invariant: confirm the web template and 100%-traffic revision match the approved digest.
- Worker image invariant: confirm required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for affected contract performance rows.

## Rollback Plan

Redeploy the previous approved digest through the repo-owned main workflow if code behavior regresses. This does not roll back or repair canonical rows. A data correction, if separately authorized later, needs its own rollback and readback plan.

## Audit Evidence

- PR, applicable CI checks, main deployment run, digest/traffic/worker inspection, and signed-in contract performance replay.
- Separate governed data-build proof bundle if canonical observations are corrected later.

## Known Gaps

- Existing contradictory canonical observations remain unchanged until a separately authorized data correction.
- External benchmark and contract-to-archetype lineage are outside this unit-integrity release.
