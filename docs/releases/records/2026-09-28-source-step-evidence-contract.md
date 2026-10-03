# 2026-09-28-source-step-evidence-contract - Evidence-owned progression

## Release ID

`2026-09-28-source-step-evidence-contract`

## Status

`candidate`

## Plain-English Summary

Required Source evidence is assigned to the workflow step that collects it. A step remains open until all of its required evidence is usable. Progression stays visible without scrolling: blocked steps show a grey, non-actionable status; ready steps and approval decisions show one green action.

## Layer Impact

`global-control-lane`, Layer 4 Products: Source workflow presentation and readiness mapping. Layer 3 authority, evidence persistence, server authorization, and approval policy are unchanged.

## Client Applicability

- All clients: Source New event workflows on the shared product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reconciled each required canonical evidence identifier with one owning workflow task across the Source stages.
- Kept the active task open until every mapped required item is ready, with one missing item and its template or Files action in context.
- Kept a mismatched or secondary evidence request from displaying the wrong task uploader.
- Moved Continue, open-gate, and stage-approval actions into a viewport-level progression control. A blocked state is grey status text, never a clickable progression button; a ready action is green.
- Kept the approval status visible when no decision item is routed for the stage.
- Preserved recorded approvals and the event-scoped approval-policy rules rather than reopening or relaxing historical decisions.

## QA / Validation

- Pass: red-first catalog reconciliation and mounted second-evidence-item tests failed before the mapping and gating change.
- Pass: removing a mapped item and replacing all-item readiness with any-item readiness each failed focused tests; mutations were restored.
- Pass: a deliberate inversion of approval-button readiness failed three focused tests, including missing sponsor context; mutation was restored.
- Pass: Source component suite, 90 suites and 615 tests.
- Pass: Node 24 TypeScript check with an 8 GB heap; scoped ESLint; `git diff --check`.
- Not run: signed-in post-deploy review, pending the official main deployment.

## Rollout Plan

Squash merge the reviewed PR, then allow only `.github/workflows/aca-main-deploy.yml` to build and deploy the exact main SHA. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned web template, healthy 100%-traffic revision, and both delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: blocked and ready progression control, current-step evidence placement, and no approval action before required evidence is ready.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

Local red/green and mutation output, PR review and CI, official deploy run, Azure digest readback, and signed-in smoke ledger.

## Known Gaps

This presentation change does not create evidence or approve a stage. A secondary missing requirement directs the user to Files for its exact template and upload; a dedicated inline uploader for every secondary item is not included.
