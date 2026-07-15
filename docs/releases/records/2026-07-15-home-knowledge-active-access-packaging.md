# 2026-07-15-home-knowledge-active-access-packaging — Home Knowledge Active Access Packaging

## Release ID

`2026-07-15-home-knowledge-active-access-packaging`

## Status

`candidate`

## Plain-English Summary

The Home Knowledge cutover needs the active module-context supplier to read
promoted Active Tenant Access metadata at runtime. The ACA image intentionally
excludes most generated `reports/` artifacts, but the default Home route now
depends on the narrow `reports/active-tenant-access/**` metadata subtree to know
which active version is safe to serve.

This release keeps `reports/` excluded by default and re-includes only
`reports/active-tenant-access/**`. It also extends the Home Knowledge cutover
audit so missing active-access packaging becomes a P0 failure before deploy.

## Layer Impact

- `global-control-lane`: Runtime packaging fix for the shared Home/Knowledge
  route.
- `client-data-lane`: Read-only packaging of active access metadata. No tenant
  data is written, promoted, or mutated.
- `internal-admin`: Extends deterministic cutover proof to cover runtime image
  packaging.

## Client Applicability

- All clients: Yes, for tenants whose default Home route reads active
  module-context metadata.
- Specific clients: No tenant-specific code path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.dockerignore`
- `scripts/audit/build-home-knowledge-cutover-proof.ts`
- Regenerated `reports/enterprise-knowledge-layer/home-cutover-proof/`

## QA / Validation

- `npm run audit:home-knowledge-cutover` — Pass.
- `npm run release:check` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge by PR into `main`. Deploy only through the repo-owned ACA main deploy
workflow. After deploy, verify the runtime invariant, production health, and
signed-in Home/Knowledge browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required for live ACA rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior `main` SHA through the repo-owned ACA main
deploy workflow. No data rollback is required because this change only adjusts
which read-only proof/control metadata is packaged in the image.

## Audit Evidence

- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.md`
- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.json`

## Known Gaps

- Home/aVa chat still uses the existing Home KNOW endpoint; this packaging fix
  does not migrate Claude answer behavior.
- Canonical relationship depth remains governed by the active Knowledge packet;
  this fix only ensures the active access metadata is available in ACA.
