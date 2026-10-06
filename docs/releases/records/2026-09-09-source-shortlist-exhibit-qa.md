# 2026-09-09-source-shortlist-exhibit-qa - Recognize Shortlist Decision Headings

## Release ID

`2026-09-09-source-shortlist-exhibit-qa`

## Status

`candidate`

## Plain-English Summary

Source now recognizes clear human headings for approved vendors, excluded or not-invited vendors, and coverage/commercial/risk screening when evaluating a shortlist decision note. It continues to block a shortlist when any required decision concept is actually absent.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / product quality controls: deterministic required-exhibit matching for shortlist decision artifacts.
- Layers 1-3: no intake, adapter, canonical model, schema, or tenant-data changes.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Map approved-vendor headings to the shortlisted-vendors requirement.
- Map coverage/commercial/risk-fit headings to screening criteria.
- Map excluded or not-invited rationale headings to eliminated-vendor coverage.
- Preserve a blocking result when an exclusion rationale is missing.

## QA / Validation

- PASS required before merge: focused Source documentation-quality tests, scoped ESLint, TypeScript no-emit validation, release control, and diff checks.

## Rollout Plan

Merge through a protected pull request and deploy the exact merge SHA through the repository-owned ACA main workflow. Existing artifact bodies remain unchanged; deterministic quality receipts are recomputed at read time.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Template, traffic revision, and approved digest must match.
- Worker image invariant: No independent worker mutation.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, inspect a shortlist decision quality receipt after deployment.

## Rollback Plan

Revert the squash merge through a new pull request and deploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- Pull request, merge SHA, focused tests, lint, typecheck, release checks, ACA workflow run, and signed-in artifact-quality readback.

## Known Gaps

This change does not accept a draft or alter its content. Human acceptance remains a separate workflow control.
