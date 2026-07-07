# 2026-07-05-source-artifact-authority-type-binding — Source Artifact Authority Type Binding

## Release ID

`2026-07-05-source-artifact-authority-type-binding`

## Status

`candidate`

## Plain-English Summary

Source aVa now answers artifact-finality questions against the requested artifact type. If a user asks which RFP version is final, Source binds the answer to the RFP artifact chain instead of accidentally using another client-final document, such as a Scope Memo, from the same sourcing event.

## Layer Impact

- `global-control-lane`: Tightens shared Source answer behavior for artifact governance questions.
- `client-data-lane`: No schema or data changes. The fix changes how existing artifact authority evidence is selected for answers.

## Client Applicability

- All clients: Yes, for Source artifact governance answers.
- Specific clients: Validated against the Lakeshore Source event proof path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: Adds artifact-type inference for RFP and Scope Memo authority questions, then scopes client-final/generated-draft selection to the requested artifact type.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: Adds regression coverage proving a client-final Scope Memo cannot hijack an RFP finality answer, while Scope Memo questions still resolve to the Scope Memo.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — Pass, 56 tests.
- Focused ESLint, TypeScript, release check, PR CI, ACA deploy, and signed-in/live Source proof are required before release.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, shift 100% traffic to the new healthy revision, and rerun the signed-in Lakeshore RFP client-final lineage proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deploy workflow only.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic on the new healthy revision.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR or shift ACA traffic back to the prior healthy revision if artifact-governance answers regress. No migration rollback is required.

## Audit Evidence

- PR URL, commit SHA, CI run, ACA revision, image digest, and live proof bundle to be recorded after merge/deploy.

## Known Gaps

The heavy D09 generation path remains a separate performance/async backlog item. This release fixes artifact authority answer selection after updated documents are accepted.
