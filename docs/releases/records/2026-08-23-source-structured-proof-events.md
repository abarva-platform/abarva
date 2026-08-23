# 2026-08-23-source-structured-proof-events — ACA Structured Proof Events

## Release ID

`2026-08-23-source-structured-proof-events`

## Status

`candidate`

## Plain-English Summary

Operator proof jobs can now emit structured JSON proof events that the ACA wrapper extracts automatically. This removes the need to manually copy JSON proof payloads from logs when a job does not emit a tarball-style proof bundle.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 2 — Source adapters and operators: proof scripts now emit a stable `structured_event` marker in their JSON output.
- Operations proof layer: the ACA operator wrapper treats structured proof events as extracted proof artifacts while preserving tarball proof-bundle support.

## Client Applicability

- All clients: yes, for operator proof extraction behavior.
- Specific clients: none.
- Internal only: operator/runbook proof tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ops/submit-aca-operator-job.mjs`
- `scripts/source/vendor-proposal-parse-proof-job.ts`
- `scripts/source/source-substrate-lineage-report.mjs`
- Focused tests for the vendor proposal proof job and Source-substrate lineage report.

## QA / Validation

- `node scripts/ops/submit-aca-operator-job.mjs --self-test` — passed.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/source/__tests__/vendor-proposal-parse-proof-job.test.mjs` — 11/11 passed.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs` — 16/16 passed.

## Rollout Plan

Merge to `main`. The repo-owned ACA deployment workflow will include the updated wrapper and proof scripts in the next runtime image.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime activation.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned ACA workflow after merge.
- ACA runtime invariant: required before claiming live behavior.
- Worker image invariant: required for operator job proof behavior after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is operator proof tooling, not a signed-in product surface.

## Rollback Plan

Revert this PR. Tarball proof bundle extraction remains the stable fallback path.

## Audit Evidence

- Focused test output from the commands listed above.
- ACA wrapper self-test output.
- Future operator proof runs should show `05-proof-extraction.json` with `extractionKind: structured_events` when the job emits structured JSON proof.

## Known Gaps

- This change does not retroactively alter existing proof bundles whose `05-proof-extraction.json` already reported `extracted=false`.
