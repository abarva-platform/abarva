# 2026-07-23-source-responses-artifact-prompts — Responses artifact prompt maturity

## Release ID

`2026-07-23-source-responses-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Source can now generate the three Responses-stage working artifacts with governed prompts instead of treating them as unguided stubs. The new templates cover the Vendor Response Pack, Q&A Parity Log, and Response Completeness Report. The workflow is intentionally sequenced: response intake requires the issued RFP and response-control pack, the Q&A log requires the RFP, and response completeness requires the response-control pack plus the response intake pack before evaluation can proceed.

This is the second narrow slice of the broader artifact prompt/workflow maturity backlog item after Pricing. It does not attempt to mature Evaluation, Transition, or Value artifacts in the same PR.

## Layer Impact

- `global-control-lane`: Extends the Source artifact prompt registry with three Responses-stage templates and regression coverage. Existing generation routes use the registry, so no route or schema change is required.
- `client-data-lane`: No migration and no data mutation. New generations after deploy can write richer d13/d14/d15 bodies through the existing governed artifact-generation path.

## Client Applicability

- All clients: Source events with artifact-generation rights can use the new Responses-stage templates once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: adds d13/d14/d15 prompt templates, response-intake controls, Q&A parity controls, response-completeness dimensions, and upstream sequencing.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: asserts d13/d14/d15 availability, sequencing, upstream blocking, uploaded response evidence binding, and completeness dependency behavior.
- `src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`: asserts d13/d14/d15 are projected as prompt-backed in lifecycle/standards output.
- `docs/backlog/source-product-backlog.md`: records item #9 Responses-family slice status.

## QA / Validation

- PASS: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` — 15/15 tests passed.
- Pending: lifecycle matrix regression, focused ESLint, `npm run release:check`, PR checks, ACA deploy, runtime invariant, and signed-in proof after deploy.

## Rollout Plan

Merge via PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA. Because this changes runtime prompt registry behavior and Files/standards projection, run the independent ACA runtime invariant after deploy. Signed-in proof should confirm the Responses artifacts are now prompt-backed in the Files matrix / standards CSV without generating or mutating artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes where authenticated Source access is available.

## Rollback Plan

Revert the application PR and redeploy through the repo-owned ACA main workflow. No migration rollback or data repair is required. Already-generated Responses artifacts, if any, remain as audit history and can be superseded through existing artifact workflows.

## Audit Evidence

- PR: Pending.
- Focused test output: local pass listed above.
- Release check: Pending.
- ACA deploy/invariant: Pending merge.
- Live signed-in proof: Pending deploy.

## Known Gaps

- Evaluation, Transition, and Value artifact prompt/workflow maturity remain open under the broader item #9 backlog.
- This slice adds prompt workflow support only. It does not add new response-specific xlsx renderers or mutate existing Source event data.
