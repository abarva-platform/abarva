# 2026-09-24-home-export-tenant-alias — Home Export Tenant Alias Gate

## Release ID

`2026-09-24-home-export-tenant-alias`

## Status

`candidate`

## Plain-English Summary

Home walkthrough export links now authorize canonical Home tenant aliases through the matching app client key before producing HTML or PDF export output. The exported record remains the requested Home tenant record; this only corrects the access gate used by the export endpoint.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates the Home export API route authorization path for all Home export users.
- Canonical model: No canonical data, tenant data, schema, or governed record content changes.

## Client Applicability

- All clients: Home export users benefit when a surface uses canonical tenant aliases.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/api/home/walkthrough-export` maps a requested Home tenant alias to the app client key for tenancy authorization.
- Adds route regression coverage for the canonical tenant alias path.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/app/api/home/walkthrough-export/__tests__/route.test.ts src/lib/home/export/__tests__/walkthrough-export.test.tsx src/components/home/v4/__tests__/cross-family-findings.test.ts`

## Rollout Plan

Merge through pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Home export links from a signed-in Home page.

## Rollback Plan

Revert the pull request and redeploy through the same ACA main workflow. No data rollback is required.

## Audit Evidence

Audit evidence will include the pull request, route regression test output, deploy workflow run, ACA runtime invariant, and signed-in browser proof of the export endpoint.

## Known Gaps

None known for the tenant alias gate.
