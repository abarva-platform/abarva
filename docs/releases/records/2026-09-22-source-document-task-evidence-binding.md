# 2026-09-22 Source document task evidence binding

## Release ID

`2026-09-22-source-document-task-evidence-binding`

## Status

`candidate`

## Plain-English Summary

A document-upload task no longer appears complete merely because another file was stored in the same sourcing stage. Tasks without an exact evidence binding stay open.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation: the persisted-evidence read model stops promoting an unrelated artifact into task completion. Canonical evidence and stored files are unchanged.

## Client Applicability

- All clients: Source event task checklists using the evidence hydrator.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source event canvas path.

## Changes Included

- Remove stage-wide artifact completion for template-less document tasks.
- Add focused behavior tests for unrelated and filename-only document evidence.

## QA / Validation

- The two new behavioral cases failed before the fix; focused Jest now passes 16/16.
- Node 24 typecheck, scoped ESLint, coverage census, release check, and diff check passed locally.
- Hosted CI, deployment/runtime invariant, and signed-in replay remain separate release gates. None is claimed by this candidate record.

## Rollout Plan

Squash-merge after applicable PR checks pass. The repo-owned ACA main workflow deploys the exact merged image. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deployment.
- ACA runtime invariant: Verify template, 100% traffic revision, and required workers against the approved digest.
- Worker image invariant: Verify through the workflow proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, the affected event's document task must remain open without exact evidence.

## Rollback Plan

Revert the squash commit through a new PR and repo-owned ACA deploy. This restores the previous display behavior without changing stored evidence.

## Audit Evidence

PR and hosted CI, deploy/runtime invariant proof, and signed-in before/after checklist readback.

## Known Gaps

An exact governed binding for template-less document tasks, including proof of any required signature, is not implemented by this change. Such tasks stay open until that contract exists.
