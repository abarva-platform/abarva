# 2026-08-28-ava-source-system-safety-scope — aVa source-system safety scope

## Release ID

`2026-08-28-ava-source-system-safety-scope`

## Status

`candidate`

## Plain-English Summary

This release tightens aVa's tenant-safety vocabulary so ordinary enterprise platform names can
appear as Source evidence-system guidance without being mistaken for cross-tenant content. Tenant
names, retired aliases, stale facts, and synthetic-only identifiers remain blocked by the same
pre-model and post-model safety gates.

## Layer Impact

- `global-control-lane`: Updates the Intelligence/aVa safety projection used when product surfaces
  send page context into the Ask API.
- `global-control-lane`: Keeps the standalone tenant-safety audit vocabulary aligned with the
  runtime policy.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/tenant-safety-policy.ts`
- `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`
- `scripts/qa/intelligence-safety-tenant-registry.mjs`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts --runInBand`

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the
new image, then run a signed-in Source aVa proof on the affected workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same Azure Container Apps main workflow. The rollback restores
the previous safety vocabulary without data migration or tenant-data changes.

## Audit Evidence

- PR: Pending.
- Deploy workflow: Pending.
- Live signed-in proof: Pending.

## Known Gaps

Live signed-in proof is pending deployment.
