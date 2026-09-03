# 2026-09-03-canonical-tenant-verifier-schema — Make the canonical tenant verifier schema-aware

## Release ID

`2026-09-03-canonical-tenant-verifier-schema`

## Status

`candidate`

## Plain-English Summary

The canonical tenant verifier now discovers the live `public.clients` columns before querying client rows. Required identity columns still fail closed when absent, while optional metadata columns are compared only when the live schema contains them.

## Layer Impact

Internal control lane: hardens a database governance verifier. The change does not alter product behavior, tenant data, migrations, loaders, or client-facing routes.

## Client Applicability

- All clients: The verifier covers the shared control database tenant identity contract.
- Specific clients: None.
- Internal only: Yes, this is an internal governance and security monitor.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/verify-canonical-tenants.ts`: discovers live `public.clients` columns through `information_schema.columns`.
- Required identity columns remain mandatory: `id`, `name`, `tenant_key`, and `slug`.
- Optional metadata comparisons run only when the matching column exists in the live schema.

## QA / Validation

- Pass: Static verifier run without `DATABASE_URL` completed successfully.
- Pass: `git diff --check`.
- Pending: PR validation.
- Pending: Post-merge manual dispatch of the canonical tenant drift workflow from `main`.

## Rollout Plan

Merge to `main`. The next ACA main deploy image will include the script change; scheduled/manual canonical tenant drift runs will use the corrected verifier once they resolve that deployed image.

## Deployment Authority

- Repo-owned deploy workflow: The normal ACA main deploy workflow builds the updated runtime image after merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: To be verified by the repo-owned deploy workflow if a deploy is triggered.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is a database monitor, not a user-facing surface.

## Rollback Plan

Revert the script change. No tenant data rollback is involved because this release performs no writes.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7356.
- Manual smoke that exposed the issue: canonical tenant drift workflow run `33747755261`.

## Known Gaps

This release does not repair live tenant identity drift. It only prevents optional schema differences from causing an unclassified verifier error. Any tenant-key cleanup apply remains a separately approved data-plane mutation.
