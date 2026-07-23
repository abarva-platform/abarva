# 2026-07-23-moves-architecture-output-budget — Moves Architecture Output Budget

## Release ID

`2026-07-23-moves-architecture-output-budget`

## Status

`candidate`

## Plain-English Summary

Moves Target Architecture assembly now has enough output capacity to complete
its structured current-state, target-state, traceability, architecture-level,
and exhibit model. If Claude reaches the output limit, Nexus reports a precise
truncation failure instead of presenting it as missing client evidence.

## Layer Impact

- `global-control-lane`: changes the shared governed generation envelope and
  diagnostics for Moves P3 Target Architecture.
- No client data, retrieval policy, evidence threshold, gate, or architecture
  validation rule changes.

## Client Applicability

- All clients: yes, when governed Moves Target Architecture generation runs.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves and deliverable-generation eligibility remains
  unchanged.

## Changes Included

- Increase the ArchitectureModel forced-tool output budget from 8,000 to 32,000
  tokens, matching the existing premium deliverable generation envelope.
- Preserve Anthropic `stop_reason` and output-token usage through the governed
  architecture adapter.
- Stream the forced-tool response through `finalMessage()` so the expanded
  budget is supported by the Anthropic SDK's long-request contract.
- Fail explicitly when structured architecture output is truncated.
- Add focused regression coverage for the output budget and truncation class.

## QA / Validation

- Pass: 35 focused ArchitectureModel, renderer, and orchestration tests.
- Pass: governed architecture adapter streaming regression test.
- Pass: ESLint on changed TypeScript files.
- Pass: TypeScript with `NODE_OPTIONS=--max-old-space-size=8192`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run audit:tenant-isolation:moves`.
- Pending: signed-in disposable First Capital P3 rerun after deployment.

## Rollout Plan

Merge through a protected PR. The repo-owned ACA main workflow builds the exact
main SHA, deploys the web revision, updates both delivery worker jobs, verifies
the runtime invariant, and shifts 100% traffic. Then rerun the disposable First
Capital P3 architecture assembly with a new approved-option version. Do not
approve the P3 gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the repo-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: required before live generation proof.
- Worker image invariant: both `job-abarva-deliv-worker` and
  `job-abarva-deliv-worker-event` must match the web digest.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes, disposable First Capital Move only.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. This
restores the prior smaller output budget while preserving fail-closed schema,
approved-option, evidence, and dependency validation.

## Audit Evidence

- Streaming adapter PR: https://github.com/abarva-platform/abarva/pull/5452.
- Pre-fix signed-in proof:
  `/Users/anand/Downloads/moves-p3-architecture-live-proof-final-2026-07-23T07-22-49Z`.
- Transport finding proof:
  `/Users/anand/Downloads/moves-p3-architecture-live-proof-v4-2026-07-23T07-50-02Z`.
- PR, merge SHA, deploy run, digest invariant, and post-fix signed-in proof:
  pending.

## Known Gaps

- Post-deployment signed-in proof remains pending.
- This slice does not relax architecture quality gates or create a deterministic
  client-facing fallback.
