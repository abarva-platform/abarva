# 2026-07-23 Moves Quality Flattened Source Register

## Release ID

`2026-07-23-moves-quality-flattened-source-register`

## Status

`candidate`

## Plain-English Summary

Moves document quality review now recognizes a rendered Source Register table
after HTML-to-text conversion flattens its heading and columns onto one line.
The quality gate still blocks narrative instructions that expose the Source
Register as internal process machinery.

## Layer Impact

- `global-control-lane`: adjusts the shared deterministic document-quality
  scanner used before generated deliverables are persisted.
- No tenant data, evidence policy, architecture prompt, or gate criteria change.

## Client Applicability

- All clients: yes, when a generated client-facing artifact includes a rendered
  Source Register appendix.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Recognize the flattened register-column signature as an appendix boundary.
- Preserve blocking behavior for Source Register references in client narrative.
- Add regression coverage for both cases.

## QA / Validation

- Pass: 18 focused transformation-gate tests.
- Pass: ESLint and TypeScript with the required 8 GB heap.
- Pass: architecture rules and Moves tenant-isolation audits.
- Not run: disposable First Capital P3 assembly retry, pending deployment.

## Rollout Plan

Merge through a PR, deploy from `main` through the repo-owned ACA deploy
workflow, prove the web and delivery workers use the same digest, then rerun the
disposable First Capital P3 architecture assembly without approving its gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior approved digest. Generated drafts remain
governed records; no phase or evidence mutation is required for rollback.

## Audit Evidence

- Live finding: `moves-p3-architecture-live-proof-v6-2026-07-23T08-56-13Z`.
- Worker diagnostic: matched flattened text beginning `Source Register [n]
  Source Family Confidence As of`.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3 document-chain proof remains open until the post-deploy retry passes.
