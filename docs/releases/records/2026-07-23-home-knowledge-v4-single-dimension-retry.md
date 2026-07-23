# 2026-07-23-home-knowledge-v4-single-dimension-retry — Home V4 dimension generation reliability

## Release ID

`2026-07-23-home-knowledge-v4-single-dimension-retry`

## Status

`candidate`

## Plain-English Summary

This release makes the Home Knowledge Pack V4 review generator ask Claude for one dimension page at a time instead of asking for several full pages in one response. It preserves the prompt-first authorship contract while reducing empty tool responses during governed candidate generation.

## Layer Impact

- `client-data-lane`: Changes only the candidate-review generation script used by the governed ACA operator job. It does not publish candidate content or change approved Home packs by itself.
- `global-control-lane`: Adds failure proof-bundle emission so failed operator runs still return prompts and raw response attempts for audit.

## Client Applicability

- All clients: The generator behavior applies to every tenant when the Home V4 review job is run.
- Specific clients: Meridian and FS Demo are the first validation targets.
- Internal only: Candidate-review output remains internal until approved.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - Uses one Claude-authored dimension page per prompt call.
  - Updates the prompt contract version.
  - Emits a failure proof bundle before exiting when `EMIT_ACA_PROOF_BUNDLE=true`.

## QA / Validation

- PASS: `node --check scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
- PASS: `npm run home:knowledge-v4:review-job:meridian -- --packet-only --out-dir=/tmp/home-v4-single-dimension-packet-meridian`
- PASS: `npm run release:check`
- PENDING: After merge and ACA deploy, rerun `home:knowledge-v4:review-job:meridian` through `scripts/ops/submit-aca-operator-job.mjs` using the deployed digest-pinned image.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the image, verify the ACA runtime invariant, then run focused Home V4 review jobs through the governed ACA operator lane.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow and ACA operator job.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before operator job rerun.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for candidate generation; browser proof is required only after approved content is wired/published.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. Existing approved Home content is unaffected because this release only changes candidate generation.

## Audit Evidence

- PR URL
- GitHub checks
- ACA deploy evidence
- Operator job output bundle in Downloads
- Generated prompts, responses, candidate JSON, review HTML, and `PROMPT_AND_OUTPUT_REVIEW_DIGEST.md`

## Known Gaps

Candidate content is not production-approved by this release. Any validation findings must be resolved by prompt/context regeneration, not renderer patching.
