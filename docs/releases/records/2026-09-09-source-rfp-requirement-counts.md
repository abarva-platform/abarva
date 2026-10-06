# Source RFP Requirement Count Semantics

## Release ID

`2026-09-09-source-rfp-requirement-counts`

## Status

`candidate`

## Plain-English Summary

Source aVa now distinguishes mandatory pass/fail requirements from scored and informational requirements. It reports the evaluation-ready submission total as Mandatory plus Scored, without describing that combined total as mandatory.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 - Client intake: no change.
- Layer 2 - Source adapters: no change.
- Layer 3 - Canonical model: no change.
- Layer 4 - Products: the Source aVa RFP-design read path gains stricter deterministic parsing and reconciled response-control language.

## Client Applicability

- All clients: yes, when a Source event has accepted RFP and response-control artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source analytics and aVa availability controls apply.

## Changes Included

- Count only structured requirement-matrix entries, excluding requirement-like references in narrative text.
- Classify a requirement only when its exact Requirement Level cell is Mandatory, Scored, or Informational.
- Reconcile the three levels to the accepted requirement total and fail closed on a mismatch.
- Report the evaluation-ready total as Mandatory plus Scored.
- Avoid public-output terms that the answer scrubber reserves for internal substrate descriptions.

## QA / Validation

- Focused RFP-design and public-answer scrub tests: passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed with an 8 GB Node heap.
- `git diff --check`: passed.
- Live signed-in proof is required after the exact merged SHA deploys.

## Rollout Plan

Merge through a pull request. Allow the repository-owned ACA main deploy workflow to build and deploy the exact merge SHA, then repeat the accepted-RFP design question in a signed-in Source event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository workflow only.
- Approved image digest: record after deploy.
- ACA runtime invariant: template, active 100% traffic revision, and required workers must match the approved digest.
- Live signed-in proof required: yes; the answer must report the governed requirement total and the Mandatory, Scored, Informational, and evaluation-ready counts without public-answer scrub corruption.

## Rollback Plan

Revert the merge through a pull request and allow the main deploy workflow to restore the previous parser and wording. No data or schema rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment run, revision, image digest, and traffic/runtime invariant readback.
- Signed-in exact-question response and rendered structured evidence table.

## Known Gaps

- This release corrects RFP control semantics; it does not change accepted artifacts or vendor-response data.
- Historical stage-readiness presentation remains a separate product-state issue.
