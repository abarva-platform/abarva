# 2026-08-30-home-prompt-contract-runtime-fallback — Home Prompt Contract Runtime Fallback

## Release ID

`2026-08-30-home-prompt-contract-runtime-fallback`

## Status

`candidate`

## Plain-English Summary

This release makes the Home ECL narrative job safe to run inside the deployed application image.
The job now reads the documented Home page prompt contract when the docs file is available, and
falls back to a generated runtime copy packaged under `scripts/ecl` when the deployed image omits
architecture documentation files.

## Layer Impact

Layer 4, Products. Release lane: `global-control-lane`.

Home narrative generation can now resolve page and lens prompt contracts in local and ACA operator
job environments.

Layer 3, Canonical model: No canonical data changes.

Layer 1/2, Client intake and adapters: No source data or adapter changes.

## Client Applicability

- All clients: Future Home V2 narrative generation jobs.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Current synthetic demo surfaces.
- Feature flag: No flag change.

## Changes Included

- Adds a generated runtime copy of the Home page prompt contract under `scripts/ecl`.
- Updates the Home ECL narrative job to use the docs JSON when present and the runtime copy when
  docs are not packaged in the image.
- Adds a regression check that the runtime copy matches the documented prompt contract exactly.

## QA / Validation

Run before merge:

- PASS — `npm run test:ecl-home-narrative-layer`
- PASS — `npx eslint scripts/ecl/build_home_ecl_narrative_layer.ts scripts/data-build/build-home-chapters.ts scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs scripts/ecl/home_page_prompt_contracts.ts`

`npm run release:check` is expected before merge and is recorded by the PR.

## Rollout Plan

Merge to `main` by PR and let the repo-owned ACA deploy workflow build a new image. The Home
narrative apply job can then be rerun through the governed ACA operator job from the new digest.

## Deployment Authority

- Repo-owned deploy workflow: Required before the runtime fallback is available to ACA jobs.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before running the data-build job.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a successful Home narrative apply/readback.

## Rollback Plan

Revert the PR to restore docs-only prompt-contract resolution. No data rollback is required unless
a later Home narrative apply job has already written content from this version.

## Audit Evidence

- PR URL and CI results after publication.
- Test output from `npm run test:ecl-home-narrative-layer`.
- ESLint output for changed script/test files.
- Release check output from `npm run release:check`.
- ACA operator log from the failed pre-fix run showing docs-path absence.

## Known Gaps

This release does not itself regenerate or publish Home narrative. It fixes the runtime packaging
blocker that prevented the governed Home narrative apply job from starting.
