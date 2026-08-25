# 2026-08-25-intelligence-proof-answer-source-match - Intelligence ECL Proof Source Matching

## Release ID

`2026-08-25-intelligence-proof-answer-source-match`

## Status

`candidate`

## Plain-English Summary

Keeps the frozen Intelligence ECL evaluation bar in place while fixing the proof-answer trigger to use the full ECL serving evidence set, not only the post-selection source list. It also records streamed route error text in the eval artifact so failed live runs are diagnosable without loosening the validator.

## Layer Impact

Layer 4 PRODUCTS: Intelligence answer routing can now match bounded ECL proof answers against the complete ECL serving context already retrieved for the request.

Global-control-lane runtime: the shared Intelligence route changes after the repo-owned ACA deploy workflow publishes the new image.

## Client Applicability

- All clients: Intelligence route control flow and eval diagnostics only.
- Specific clients: None.
- Internal only: The proof-answer branch remains gated to ECL projection provider requests with matching evidence.
- Public/demo only: None.
- Feature flag: Existing provider/source evidence gates apply.

## Changes Included

- Use full ECL serving sources for proof-answer matching and grounding.
- Preserve route `error` event text in the consultant eval answer rows.
- No validator alias additions, threshold changes, source-data changes, migrations, or provider cutover.

## QA / Validation

- PASS: `node --check src/lib/intelligence/ask/index.ts`
- PASS: `node --check scripts/ecl/run_ecl_ava_consultant_eval.mjs`
- PASS: `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/ecl-consultant-proof-answer.test.ts`
- PASS: `npm run ecl:ava-consultant-eval`
- PENDING: full product pre-deploy gate, release check, ACA deploy, and live baseline plus ablation rerun.

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
