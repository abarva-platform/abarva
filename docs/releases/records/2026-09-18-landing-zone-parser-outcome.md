# 2026-09-18-landing-zone-parser-outcome

## Release ID

`2026-09-18-landing-zone-parser-outcome`

## Status

`draft`

## Plain-English Summary

The landing-zone consumer now distinguishes invalid document content from a parser or infrastructure fault. Explicitly invalid input is audited and rejected so the queue can dead-letter it. Unknown parser faults remain retryable. If the audit for invalid input cannot be written, the consumer retries instead of dead-lettering without an audit.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 source adapter: document parsing identifies deterministic invalid input without changing extracted content or canonical object production.
- Ingestion control plane: the existing queue outcome determines dead-letter versus retry after the existing audit step.

## Client Applicability

- All clients using the shared landing-zone consumer receive this outcome classification when released.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/ingestion/document-upload-parser.ts`: typed errors for explicit unsupported, mismatched, oversized, and empty input decisions.
- `src/lib/ingestion/azure-landing-zone-consumer.ts`: reject typed invalid input after audit; retry other parser faults and audit-write failures.
- `src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts`: exercise these outcomes through the consumer.
- This release record. No migration or data-plane write is included.

## QA / Validation

- Passed: focused consumer and parser suites (32 tests), including a simulated binary extractor fault through the real consumer and parser.
- Passed: mutating the permanent classification made all four invalid-input cases fail; mutating the transient extractor classification made its case fail. Both changes were restored.
- Passed: scoped ESLint, 8 GB TypeScript check, `git diff --check`, and `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

The change remains a local candidate. A later approved PR may enter the shared main deployment workflow. No runtime or tenant data mutation is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: required for any future shared runtime rollout.
- Shared runtime mutators: none in this candidate.
- Approved image digest and ACA runtime invariant: to be verified during a future authorized deployment.
- Worker image invariant: to be verified before claiming a live worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: assess at deployment for affected ingestion workflow.

## Rollback Plan

Revert the parser error type and consumer classification through the controlled release lane. Queue outcomes then return to the previous retry behavior; no schema or data rollback is needed.

## Audit Evidence

The focused test output, mutation check, lint, TypeScript check, release gate, and local diff in this isolated worktree support review. No PR, deployment, or live proof exists for this draft.

## Known Gaps

Queue settlement is validated through the consumer outcome contract, not a live Service Bus run. Unknown parser failures remain retryable for operator investigation.
