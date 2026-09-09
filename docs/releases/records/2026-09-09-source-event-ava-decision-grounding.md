# 2026-09-09-source-event-ava-decision-grounding - Governed Event Decision Answers

## Release ID

`2026-09-09-source-event-ava-decision-grounding`

## Status

`candidate`

## Plain-English Summary

Source aVa now explains an event's accepted supplier decision from the authoritative selection memo, keeps committed and realized value states distinct, and refuses explicit requests for another tenant's commercial data before retrieval. It does not recalculate evaluation scores, select a supplier, or promote unconfirmed value.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: the Source event answer route gains deterministic, event-scoped explanations for selection and value questions.
- Governance boundary: accepted artifacts still pass through the validated context bundle, and cross-tenant requests fail closed without retrieving protected records.

## Client Applicability

- All clients: Yes, for Source events with authoritative selection and value evidence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add an event-scoped selection-decision answer built from the authoritative selection memo.
- Read an accepted selection memo from its approved, linked artifact-state body when its registry blob is unavailable.
- Render committed value facts as committed rather than projected and state committed, projected, and realized totals separately.
- Add an explicit pre-retrieval refusal for cross-tenant commercial-data requests.
- Add focused intent, parser, governance, value-state, and route-order tests.

## QA / Validation

- Focused Jest selection and value answer tests: passed.
- Focused Jest Source answer-route intent and ordering tests: passed.
- Scoped ESLint and TypeScript checks: required before release.
- Signed-in production selection, value, tenant-boundary, and workflow-regression proof: required after deployment.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. Shift traffic only after the new revision is healthy, then run signed-in Source event proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only
- Approved image digest: recorded by the deploy workflow after merge
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest
- Worker image invariant: no worker change in this release
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the pull request and redeploy the resulting main SHA through the same repository-owned workflow. No schema or data rollback is required because this release changes only read-only answer composition.

## Audit Evidence

- Pull request, merge commit, and ACA main deploy run.
- Focused Jest, scoped ESLint, TypeScript, and release-policy output.
- Signed-in post-deploy answer captures for selection rationale, value-state separation, tenant-boundary refusal, and unchanged event completion.

## Known Gaps

Production proof remains pending until the candidate is merged and the exact SHA is deployed.
