# 2026-09-21 Source New Phase-Aware aVa Answer

## Release ID

`2026-09-21-source-new-phase-aware-ava`

## Status

`candidate`

## Plain-English Summary

When a user asks what is required to complete the current Source New phase and also asks which evidence is missing, aVa now answers both parts from the same governed event and evidence state. It names the recorded phase, blocker, next action, missing inputs, and evidence-processing gaps without treating stored files as search-ready evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product behavior only. No canonical rows, source adapters, workflow decisions, approval records, or tenant data are changed.

## Client Applicability

- All clients: yes, for governed Source event chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event chat availability.

## Changes Included

- Added deterministic recognition for phase-completion questions.
- Passed the event's recorded phase, blocker, next action, and missing inputs into the governed evidence answer.
- Distinguished parser/review exceptions from outstanding parsing and search-index readiness.
- Added library and real-route behavioral tests for the combined intent.

## QA / Validation

- Red-first library test failed before the completion-intent implementation.
- Red-first route test failed before the event context was wired into the governed answer.
- Focused library and route suites pass after the change.
- TypeScript, scoped ESLint, release validation, and PR CI run before merge.

## Rollout Plan

Squash merge through the protected pull-request path. The repo-owned Azure Container Apps main workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, repeat the combined phase-completion and evidence question on a governed event.

## Rollback Plan

Revert the squash merge and let the repo-owned workflow restore the previous answer routing. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned ACA deployment run and runtime-invariant artifact.
- Signed-in read-only Source New chat smoke after deployment.

## Known Gaps

This release reports existing evidence states. It does not parse files, create search indexes, promote evidence into enterprise context, or repair missing event data.
