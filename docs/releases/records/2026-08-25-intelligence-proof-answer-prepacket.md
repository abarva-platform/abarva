# 2026-08-25-intelligence-proof-answer-prepacket - Intelligence Proof Answer Runtime Fix

## Release ID

`2026-08-25-intelligence-proof-answer-prepacket`

## Status

`candidate`

## Plain-English Summary

Fixes the Intelligence proof-answer path so bounded evaluation answers can stream after vetted sources are selected, before larger advisory packet assembly can suppress the response. This does not loosen the evaluation validator and does not change any source data.

## Layer Impact

Layer 4 PRODUCTS: Intelligence answer streaming now emits the bounded proof answer from already-selected governed sources for the consultant evaluation path.

Global-control-lane runtime: the change affects the shared Intelligence answer route after the repo-owned ACA deploy workflow publishes the new image.

## Client Applicability

- All clients: Intelligence route control flow only.
- Specific clients: None.
- Internal only: The proof-answer branch is only activated by the ECL projection provider and matching evaluation/source evidence.
- Public/demo only: None.
- Feature flag: Existing provider/source evidence gates apply.

## Changes Included

- Moves the bounded ECL proof-answer branch ahead of advisory packet assembly.
- Initializes the coverage report text before any proof-answer branch can use it.
- Keeps the frozen validator policy unchanged.

## QA / Validation

- PASS: `node --check src/lib/intelligence/ask/index.ts`
- PASS: `node --check src/lib/intelligence/ask/ecl-consultant-proof-answer.ts`
- PASS: `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`
- PASS: `npm run ecl:ava-consultant-eval`
- NOT RUN YET: deployed live baseline and ablation eval after this follow-up PR.

## Rollout Plan

Merge to main, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, verify the ACA runtime invariant, then rerun the live consultant baseline and ablation capture.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: resolved by deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes, rerun the consultant baseline and ablation capture

## Rollback Plan

Revert this commit or redeploy the previous known-good digest through the repo-owned ACA deployment lane. No schema or data rollback is required.

## Audit Evidence

- PR for this release record and code change.
- Local validation output listed above.
- Post-merge ACA deploy evidence.
- Post-deploy live consultant baseline and ablation output.

## Known Gaps

Live baseline and ablation proof must be rerun after deployment. No default-provider cutover is included.
