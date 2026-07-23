# 2026-07-23 Moves Sourcing Evidence Instruction Leak

## Release ID

`2026-07-23-moves-sourcing-evidence-instruction-leak`

## Status

`candidate`

## Plain-English Summary

Generated client documents must apply evidence and citation controls without
explaining those internal authoring rules to the reader. The quality scanner
also now separates client-body references from the actual rendered evidence
appendix when both appear in flattened visible text.

## Layer Impact

- `global-control-lane`: strengthens the shared deliverable prompt and the
  deterministic machinery-language scanner.
- No gate criteria, evidence eligibility, tenant context, or phase state change.

## Client Applicability

- All clients: yes, for generated client-facing deliverables.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Prohibit generated prose from explaining citation/evidence authoring rules.
- Reinforce the rule in full-draft and board-grade rewrite passes.
- Find explicit appendix boundaries independently of earlier body references.
- Preserve a block for genuine body references to evidence machinery.

## QA / Validation

- Pass: 48 focused prompt-builder and transformation-gate tests.
- Pass: ESLint and TypeScript with the required 8 GB heap.
- Pass: architecture-rules and Moves tenant-isolation audits.
- Not run: release and diff checks at record creation; required before PR.
- Not run: post-deploy disposable First Capital P3 assembly retry.

## Rollout Plan

Merge through a PR, deploy through the repo-owned ACA main workflow, prove the
web and delivery workers use the same digest, then rerun the disposable First
Capital P3 document chain without approving its phase gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior approved digest. No schema, evidence, or
phase-state rollback is required.

## Audit Evidence

- Live finding: `moves-p3-architecture-live-proof-v7-2026-07-23T09-26-50Z`.
- Worker diagnostic: body phrase stating claims were tied to an evidence
  register, followed by a valid Source Register appendix.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3 chain proof remains open until the post-deploy retry passes.
