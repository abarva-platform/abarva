# 2026-06-07-ci-canonical-tenant-azure-db — Canonical Tenant Drift Removes Supabase CI Dependency

## Release ID

`2026-06-07-ci-canonical-tenant-azure-db`

## Status

`candidate`

## Plain-English Summary

The canonical tenant drift CI check no longer uses the legacy generic `DATABASE_URL` secret from GitHub Actions. GitHub-hosted PR CI now performs the static tenant allowlist check without any database connection, while the verifier still supports live Azure/Postgres drift checks when it is run inside the private Azure/VNet operator environment. The verifier fails closed if a future workflow or operator points it at a Supabase host.

## Layer Impact

`global-control-lane`: CI and repository governance only. This changes how the tenant drift check is invoked from GitHub-hosted runners and how it rejects legacy data-plane URLs; it does not change application runtime behavior.

## Client Applicability

- All clients: indirect protection through the shared tenant allowlist guard.
- Specific clients: none.
- Internal only: GitHub Actions and release validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/canonical-tenant-drift.yml` no longer exports a database URL in GitHub-hosted PR CI.
- `scripts/verify-canonical-tenants.ts` rejects Supabase hosts before opening a database connection.
- `scripts/audit/architecture-rules.mjs` keeps the architecture guard active while allowing this verifier to carry Supabase host deny-list markers.

## QA / Validation

- Pass: `npm run db:verify:canonical-tenants` with no `DATABASE_URL` performed the static allowlist check and skipped live drift.
- Pass: `npm run db:verify:canonical-tenants` with a fake Supabase URL failed closed before connecting.
- Blocked as designed in GitHub-hosted CI: live Azure/Postgres drift cannot run from GitHub-hosted runners because the Azure Postgres host is private-DNS/VNet scoped. Run the live drift check from the Azure private operator environment when needed.
- Pass: `npm run audit:architecture-rules:self-test`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run audit:architecture-rules -- --base=origin/main --head=HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. No Azure Container Apps deploy, data migration, DNS change, Vercel change, or Supabase operation is required. The next pull request or scheduled workflow run will stop using any database URL from GitHub-hosted CI.

## Rollback Plan

Revert the PR to restore the previous workflow mapping and verifier behavior. This is a CI-only change, so rollback has no runtime data-plane effect.

## Audit Evidence

- Pull request diff for the workflow and verifier.
- GitHub Actions run for `Verify canonical tenant allowlist`.
- Local validation commands listed above.

## Known Gaps

The old generic `DATABASE_URL` repository secret may still exist in GitHub settings for historical workflows. This PR stops the canonical tenant drift workflow from using any GitHub-hosted database URL and blocks Supabase URLs in the verifier; deleting stale secrets is a separate settings cleanup. Live tenant drift against Azure/Postgres must run inside the private Azure/VNet operator, not GitHub-hosted CI.
