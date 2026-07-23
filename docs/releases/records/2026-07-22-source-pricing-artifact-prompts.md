# 2026-07-22-source-pricing-artifact-prompts — Pricing artifact prompt maturity

## Release ID

`2026-07-22-source-pricing-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Source can now generate the three Pricing-stage working artifacts with a governed workflow instead of falling back to static stubs. The new prompt templates cover the Locked Assumptions Record, Pricing Normalization Workbook, and Pricing Trap Log. The sequence is intentional: assumptions must be locked before a pricing workbook can be drafted, and the trap log requires both assumptions and the normalized workbook.

This is the first narrow slice of the broader artifact maturity backlog item. It does not attempt to mature Responses, Evaluation, Transition, or Value artifacts in the same PR.

## Layer Impact

- `global-control-lane`: Extends the Source artifact prompt registry with three Pricing-stage templates and regression coverage. Existing generation routes use the registry, so no route or schema change is required.
- `client-data-lane`: No migration and no data mutation. New generations after deploy can write richer d19/d20/d21 bodies through the existing governed artifact-generation path.

## Client Applicability

- All clients: Source events with artifact-generation rights can use the new Pricing-stage templates once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: adds d21/d19/d20 prompt templates, cost-section controls, trap-category controls, and upstream sequencing.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: asserts availability, sequencing, upstream blocking, evidence binding, and trap-log workflow behavior.
- `docs/backlog/source-product-backlog.md`: records item #9 pricing-family slice status.

## QA / Validation

- PASS: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` — 11/11 tests passed.
- Pending: focused ESLint, release-check, PR checks.

## Rollout Plan

Merge via PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA. Because this changes runtime prompt registry behavior, run the independent ACA runtime invariant after deploy. Signed-in proof should confirm the pricing artifacts are now listed as supported generation codes or, if a suitable event is available, that d21/d19/d20 generation sequencing returns the expected missing-upstream behavior before generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes where authenticated Source access is available.

## Rollback Plan

Revert the application PR and redeploy through the repo-owned ACA main workflow. No migration rollback or data repair is required. Already-generated Pricing artifacts, if any, remain as audit history and can be superseded through existing artifact workflows.

## Audit Evidence

- PR: Pending.
- Focused test output: local pass listed above.
- Release check: Pending.
- ACA deploy/invariant: Pending merge.
- Live signed-in proof: Pending deploy/auth availability.

## Known Gaps

- Responses, Evaluation, Transition, and Value artifact prompt/workflow maturity remain open under the broader item #9 backlog.
- This slice adds prompt workflow support only. It does not add new xlsx renderers or a dedicated Pricing UI editor.
