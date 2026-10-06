# Stage Synthesis Instance Ownership

## Release ID

`2026-09-26-reasoning-stage-tenant-fence`

## Status

`candidate`

## Plain-English Summary

Stage synthesis now checks that the selected instance belongs to the signed-in client's active tenant before reading a cached answer or sending context to the model. A request for another tenant's instance is refused.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, canonical model: read-only tenant identity; no schema or data change.
- Layer 4, products: the stage-synthesis API enforces instance ownership before synthesis.

## Client Applicability

- All clients: yes, for the affected route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/reasoning/stage-synthesis/route.ts`
- `src/app/api/reasoning/stage-synthesis/__tests__/route.invariants.test.ts`
- No migration or data build.

## QA / Validation

- Pass: real-handler tests refuse cross-tenant Source and program instances before cache or model egress while preserving same-tenant synthesis.
- Pass: deliberate removal and inversion of the owner check caused the behavioral tests to fail.
- Pass: focused Jest suite (6/6), TypeScript no-emit, scoped ESLint, `release:check`, and `git diff --check`.
- CI and signed-in runtime proof: not run before PR creation.

## Rollout Plan

Squash-merge after applicable CI and review. The repo-owned ACA main workflow builds and deploys the exact main commit. No data migration or feature flag is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: verify required worker jobs match the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes; report any unexercised cross-tenant live path separately from runtime proof.

## Rollback Plan

Revert through a new PR and the repo-owned main deploy workflow. No schema or data rollback is involved; reverting restores the prior authorization defect, so avoid rollback without a safer replacement.

## Audit Evidence

- Focused real-handler test and mutation results in the PR.
- PR, CI, deployment run, digest and signed-in smoke evidence to be recorded after execution.

## Known Gaps

The handler-level tests do not exercise middleware authentication. Live cross-tenant route replay remains separate from local proof.
