# 2026-09-10-moves-evidence-signal-retention — Moves Evidence Signal Retention

## Release ID

`2026-09-10-moves-evidence-signal-retention`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now preserve selected high-signal evidence metrics instead of treating citation count alone as enough evidence use. The generator promotes metric-dense governed evidence statements into required carry-forward signals, tells the model to include them, deterministically appends any omitted signals with citations, and blocks export if they are still missing.

## Layer Impact

Layer 4 Products (`global-control-lane`): Moves deliverable generation and quality validation are strengthened for all tenants using the shared Moves orchestrator.

Layer 3 Canonical Model: No schema or canonical data changes.

Layer 2 Source Adapters: No adapter changes.

Layer 1 Client Intake: No intake template changes.

## Client Applicability

- All clients: Applies to generated Moves deliverables that use the shared deliverable orchestrator.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves deliverable orchestration controls still apply.

## Changes Included

PR #7569. Code changes are limited to:

- `src/lib/deliverables/orchestrator/types.ts`
- `src/lib/deliverables/orchestrator/prompt-builder.ts`
- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/orchestrator/quality-validator.ts`
- `src/lib/programs/deliverables/orchestrated/build-request.ts`
- Focused orchestrator and validator tests

## QA / Validation

Completed locally with pass status:

- Pass: `npm test -- --runTestsByPath src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts`
- Pass: `npx eslint src/lib/deliverables/orchestrator/types.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/orchestrator/quality-validator.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/programs/deliverables/orchestrated/build-request.ts src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts`

Pending:

- `npm run release:check`
- PR CI
- ACA deploy from `main`
- Live signed-in Moves smoke readback

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the Moves smoke artifact generation/readback path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Moves smoke readback after deploy.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned workflow. No data rollback is required because this is generation/validation behavior only.

## Audit Evidence

Pending:

- PR URL: `https://github.com/abarva-platform/abarva/pull/7569`
- CI run
- Deploy run
- Live smoke report path

## Known Gaps

The release does not alter source evidence, delete existing artifacts, or rewrite past generated artifacts. Existing deliverables improve only when regenerated or superseded by a new version.
