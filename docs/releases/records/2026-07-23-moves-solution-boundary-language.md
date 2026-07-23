# 2026-07-23 Moves Solution Boundary Language

## Release ID

`2026-07-23-moves-solution-boundary-language`

## Status

`candidate`

## Plain-English Summary

Moves architecture documents now distinguish a real Source Register appendix
from client-facing narrative even when rendered HTML flattens both onto one
line. The generation prompts also replace control-system language such as
"authorized to build" with executive scope and investment-decision language.

## Layer Impact

- `global-control-lane`: refines the shared deliverable prompt and deterministic
  client-language quality scanner.
- No evidence, gate, phase-state, tenant-data, or architecture-decision contract
  changes.

## Client Applicability

- All clients: yes, for generated client-facing deliverables.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Recognize an explicit inline `Appendix B — Source Register` as the start of
  the evidence appendix after HTML-to-text flattening.
- Continue blocking narrative sentences that discuss Source Register machinery.
- Prohibit `authorized to build` and related control language in both the
  standing system prompt and board-grade rewrite pass.
- Add focused regression tests for both behaviors.

## QA / Validation

- Pass: 49 focused prompt-builder and transformation-gate tests.
- Pass: focused ESLint and `git diff --check`.
- Pending: TypeScript, architecture-rules, tenant-isolation, enterprise-naming,
  and release checks before PR.
- Pending: post-deploy disposable First Capital P3 architecture assembly retry.

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

- Live finding: `moves-p3-architecture-live-proof-v8-2026-07-23T10-12-11Z`.
- Worker diagnostic: inline duplicated Appendix B heading plus client-body
  phrase `authorized to build`.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3 chain proof remains open until the post-deploy retry passes.
