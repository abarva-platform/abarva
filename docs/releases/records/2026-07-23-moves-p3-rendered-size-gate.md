# 2026-07-23-moves-p3-rendered-size-gate — P3 Rendered Size Gate

## Release ID

`2026-07-23-moves-p3-rendered-size-gate`

## Status

`candidate`

## Plain-English Summary

Live First Capital P3 proof showed that the P3 architecture chain could generate all four artifacts successfully while the final rendered executive artifacts still exceeded their intended size. This release makes the rendered artifact quality bar enforce the word ceiling for concise Moves decision artifacts and tightens the P3 authoring budgets so generated solution, operating-model, and sourcing documents fit the executive-review contract after wrapper, source-register, and appendix overhead.

## Layer Impact

- `global-control-lane`: Changes shared Moves deliverable quality behavior for concise decision artifacts.
- `product-runtime`: Adjusts deterministic artifact acceptance logic and the P3 orchestrator prompt structure used by live generation.
- `client-data-lane`: No client data schema, tenant access, candidate data, or context-corpus behavior changes.

## Client Applicability

- All clients: Applies to generated Moves artifacts when the affected deliverable types are used.
- Specific clients: First Capital proof Move is the live verification target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; this is a quality-gate correction.

## Changes Included

- Enforce `maximumWordCount` in the rendered Golden Bar only when the artifact contract opts in.
- Opt in concise Moves decision artifacts: `charter`, `solution_design`, `operating_model_design`, and `sourcing_strategy`.
- Preserve advisory-only maximums for deeper architecture artifacts such as `target_state_architecture`.
- Reduce P3 solution, operating-model, and sourcing section budgets to account for final rendered artifact overhead.
- Further reduce Solution Design authoring budgets after live v16 proof showed the final rendered artifact still exceeded the 5,200-word executive ceiling by 197 words.
- Add regression tests for advisory versus blocking maximum-word behavior and updated P3 budget contracts.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand` (Jest emitted pre-existing duplicate mock warnings; all targeted suites passed).
- Pass: `npx eslint` on changed files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`.
- Pending: `npm run release:check` after this QA status update.
- Pass: `git diff --check`.
- Pending: ACA deploy and runtime-invariant proof.
- Partial: signed-in First Capital P3 v16 generation proof on disposable Move `4bf889aa-d4ee-4c1d-936b-51574614d191` generated all four artifacts; Operating Model and Sourcing fit their rendered ceilings, while Solution Design rendered at 5,397 words against a 5,200-word ceiling and required this follow-up headroom reduction.
- Pending: signed-in First Capital P3 v17 proof after the follow-up Solution Design budget reduction.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA runtime invariant and rerun the signed-in First Capital P3 architecture-chain proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: pending deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Rollback by reverting this PR and redeploying the prior ACA image through the repo-owned main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- Live failed/partial proof: `/Users/anand/Downloads/moves-p3-architecture-live-proof-v15-2026-07-23T13-49-08Z/11-artifact-content-audit.json`
- Live partial proof: `/Users/anand/Downloads/moves-p3-architecture-live-proof-v16-2026-07-23T14-40-56Z/11-artifact-content-audit.json`
- PR URL: pending
- Merge SHA: pending
- ACA deploy proof: pending
- Signed-in P3 v16 proof: pending

## Known Gaps

- This release does not approve the P3 gate or advance the disposable Move to P4.
- This release does not change Target Architecture depth; that artifact is intentionally allowed to be deeper and remains advisory on maximum word count.
