# 2026-08-23-source-lineage-stdout-proof-event — Source lineage structured proof output

## Release ID

`2026-08-23-source-lineage-stdout-proof-event`

## Status

`candidate`

## Plain-English Summary

The Source substrate lineage audit already wrote a structured JSON report to disk. This change also emits that same structured report to stdout when the approved operator script runs, so the ACA proof wrapper can automatically extract the event from job logs instead of requiring manual log parsing.

## Layer Impact

- Release lane: `internal-admin`
- Layer 3 — Canonical model/read-model governance: no data model or read-model semantics change; this only improves proof extraction for an existing readback audit.
- Layer 4 — Products and operations: operator proof bundles become easier to audit because the structured Source lineage event is machine-extracted from logs.

## Client Applicability

- All clients: applies to the shared Source lineage audit script.
- Specific clients: none.
- Internal only: the output is intended for internal proof generation and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `package.json`
- `scripts/source/source-substrate-lineage-report.mjs`
- `scripts/source/__tests__/source-substrate-lineage-report.test.mjs`

## QA / Validation

Local validation status:

- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- Pass: `node scripts/ops/submit-aca-operator-job.mjs --self-test`
- Pending: `npm run release:check`
- Pending post-deploy: read-only ACA operator run for `audit:source-substrate-lineage`, verifying `05-proof-extraction.json` contains `extracted: true` and `extractionKind: structured_events`.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the new digest-pinned image. Then run the read-only Source lineage job through the private operator to prove automatic structured-event extraction.

## Deployment Authority

- Repo-owned deploy workflow: required for live runtime.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is an internal operator proof enhancement.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. Existing lineage report files remain compatible because the JSON and markdown file outputs are unchanged.

## Audit Evidence

- PR URL and CI run after opening the PR.
- ACA deploy artifact after merge.
- Read-only operator proof directory showing structured-event extraction.

## Known Gaps

This change does not alter the Source lineage report's metric coverage or add signed-in product UI proof.
