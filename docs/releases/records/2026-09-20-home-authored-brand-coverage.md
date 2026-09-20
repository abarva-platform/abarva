# 2026-09-20-home-authored-brand-coverage — Complete Home Brand Coverage

## Release ID

`2026-09-20-home-authored-brand-coverage`

## Status

`candidate`

## Plain-English Summary

The one current app tenant that previously fell back to generic Home branding now has an authored monogram, industry color, industry label, and plain-language operating description in both Home renderers.

## Layer Impact

- **Release lane — global-control-lane:** Shared Home rendering changes for the authored identity registry.
- **Layer 4 — Products:** Home now renders the existing tenant identity consistently. No source, adapter, canonical-model, or tenant-data rows change.

## Client Applicability

- All clients: No.
- Specific clients: The current app tenant whose authored Home identity was missing.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Complete the authored tenant-brand entry in both supported Home renderers.
- Retain a visible generic fallback for future tenants without authored identity.
- Add rendered behavior coverage for both surfaces.

## QA / Validation

- Failing-first rendered tests proved both surfaces used the fallback before the change.
- Focused renderer tests pass after the change.
- TypeScript, scoped ESLint, behavior coverage, and release control are required before merge.

## Rollout Plan

Squash-merge through the protected repository flow. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Template, active revision, and workers must match the approved digest.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the affected Home surface after deployment.

## Rollback Plan

Revert the merge commit and let the repo-owned deploy workflow restore the previous Home branding behavior. No data rollback is required.

## Audit Evidence

- Pull request and required-check results.
- Focused rendered test output.
- Repo-owned deployment artifact and runtime-invariant proof.
- Signed-in Home screenshot or DOM proof after deployment.

## Known Gaps

Future tenants still require authored identity or use the explicit fallback by design.
