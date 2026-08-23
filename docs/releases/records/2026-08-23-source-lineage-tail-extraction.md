# 2026-08-23-source-lineage-tail-extraction — Source lineage ACA tail extraction

## Release ID

`2026-08-23-source-lineage-tail-extraction`

## Status

`candidate`

## Plain-English Summary

The Source lineage audit can emit structured proof to stdout, but ACA job logs are collected with a bounded tail. A large pretty-printed JSON object can lose its opening `structured_event` line before the proof wrapper reads it. This change emits a compact one-line copy of the same structured event at the end of the run, so the existing proof extractor can read it reliably from bounded ACA logs.

## Layer Impact

- Release lane: `internal-admin`
- Layer 3 — Canonical model/read-model governance: no data model or metric semantics change.
- Layer 4 — Products and operations: improves automated proof extraction for a read-only Source lineage audit.

## Client Applicability

- All clients: applies to the shared Source lineage audit proof path.
- Specific clients: none.
- Internal only: yes, this is operator proof infrastructure.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/source/source-substrate-lineage-report.mjs`
- `scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- `docs/releases/records/2026-08-23-source-lineage-tail-extraction.md`

## QA / Validation

Local validation status:

- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- Pass: `node scripts/ops/submit-aca-operator-job.mjs --self-test`
- Pending: `npm run release:check`
- Pending post-deploy: read-only ACA operator run for `audit:source-substrate-lineage`, verifying `05-proof-extraction.json` contains `extracted: true` and `extractionKind: structured_events`.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Then run the read-only Source lineage job through the private operator and verify automatic structured-event extraction.

## Deployment Authority

- Repo-owned deploy workflow: required for live runtime.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is an internal operator proof enhancement.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. Existing lineage JSON and markdown file outputs remain unchanged; only stdout proof shape changes.

## Audit Evidence

- PR URL and CI/deploy run after opening and merging the PR.
- ACA deploy artifact after merge.
- Read-only operator proof directory showing structured-event extraction from the bounded log tail.

## Known Gaps

This change does not alter Source lineage metric coverage, product UI behavior, signed-in product proof, or source-data values.
