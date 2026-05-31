# 2026-05-31-corpus-wave-a-prod-load-workflow — Wave A Production Corpus Load Workflow

## Release ID

`2026-05-31-corpus-wave-a-prod-load-workflow`

## Status

`candidate`

## Plain-English Summary

Adds a manual, auditable GitHub Actions workflow that loads the 10 Codex Wave A genome seed files into the production Postgres data plane and prints database counts by vertical, seed file, and vertical/domain.

## Layer Impact

- Data-plane operations: introduces a workflow-dispatch loader that uses the repository `DATABASE_URL` secret and does not expose database credentials in logs.
- Corpus operations: makes the Wave A seed load repeatable and idempotent through `scripts/corpus/load-authored-genome-seeds.ts`.
- Runtime application: no product route, UI, API, or application behavior changes.

## Client Applicability

- All clients: none directly; this is an internal corpus operations workflow.
- Specific clients: First Capital, Northstar Clinical, and Meridian Health receive additional industry corpus rows when the workflow is run.
- Internal only: workflow execution and DB count reporting.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/corpus-wave-a-prod-load.yml` — manual production load and count report workflow for Codex Wave A.

## QA / Validation

- `git diff --check` passed locally before commit.
- Workflow is `workflow_dispatch` only.
- Workflow guards that `DATABASE_URL` is present before loading.
- Workflow reports persisted `genome_patterns` counts after load.

## Rollout Plan

Merge the workflow to `main`, allow the normal production checks to complete, then manually run `Corpus Wave A production load` from GitHub Actions against `main`.

## Rollback Plan

Delete `.github/workflows/corpus-wave-a-prod-load.yml` if the manual loader is no longer needed. The underlying seed load is idempotent by `genome_patterns.code`; no destructive rollback is required for re-runs.

## Audit Evidence

- PR: to be attached after creation.
- Workflow run: to be attached after dispatch.
- DB count output: emitted by the workflow after load.

## Known Gaps

The workflow depends on the repository `DATABASE_URL` secret being populated with the production Postgres data-plane DSN.
