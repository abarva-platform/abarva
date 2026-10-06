# Source Evaluation Condition Gates

## Release ID

`2026-09-09-source-evaluation-condition-gates`

## Status

`candidate`

## Plain-English Summary

Source now keeps response-package completeness separate from evaluation readiness. A vendor can submit every required field and citation while still carrying a material exception; those must-resolve conditions now hold the affected score criteria and block advancement until cited cure evidence is reviewed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 - Client intake: no change.
- Layer 2 - Source adapters: no change.
- Layer 3 - Canonical model: no change.
- Layer 4 - Products: Source response normalization, evaluation readiness, scorecard guidance, and BAFO scenario presentation.

## Client Applicability

- All clients: yes, when normalized Source responses contain Mandatory or Scored exceptions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event canvas controls apply.

## Changes Included

- Preserved requirement level, category, and evaluation-criterion lineage when normalized responses become evaluation extraction cards.
- Classified a cited exception as a challenge even when its supporting exhibit is complete.
- Made Mandatory exceptions must-resolve conditions and mapped them to the relevant evaluation criteria.
- Held affected criteria, vendor recommendations, and advancement guidance pending clarification evidence.
- Replaced unsupported post-BAFO score uplift with an explicit held-pending-evidence state.

## QA / Validation

- Focused normalized-workbook, proposal-intelligence, response-forward-gate, scorecard, response-brief, layout, and decision-brief tests: passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed with an 8 GB Node heap.
- `git diff --check`: passed.
- Live signed-in proof is required after the exact merged SHA deploys.

## Rollout Plan

Merge through a pull request. Allow the repository-owned ACA main deploy workflow to build and deploy the exact merge SHA, then verify a Source response set with structurally complete packages and open Mandatory exceptions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository workflow only.
- Approved image digest: record after deploy.
- ACA runtime invariant: template, active 100% traffic revision, and required workers must match the approved digest.
- Live signed-in proof required: yes; open Mandatory issues must hold affected score criteria and vendor advancement, and BAFO scenarios must not claim unsupported uplift.

## Rollback Plan

Revert the merge through a pull request and allow the main deploy workflow to restore the previous evaluation presentation. No data or schema rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment run, revision, image digest, and traffic/runtime invariant readback.
- Signed-in Responses and Evaluation DOM assertions or screenshots.

## Known Gaps

- Provisional numeric suggestions remain evidence-derived; this release does not invent a cured score before revised evidence is received.
- Named evaluators still own final scoring and award decisions.
