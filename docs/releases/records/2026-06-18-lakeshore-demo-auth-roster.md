# 2026-06-18-lakeshore-demo-auth-roster — Lakeshore Demo Auth Roster

## Release ID

`2026-06-18-lakeshore-demo-auth-roster`

## Status

`candidate`

## Plain-English Summary

Allows the two canonical Lakeshore Holdings executive demo personas to use the same invite-code sign-in flow as Meridian, First Capital, SkyHarbor, and Apex. This unblocks signed-in Lakeshore QA for Intelligence, Tower, and Kyriba rollout scenarios.

## Layer Impact

- `global-control-lane`: Extends the shared demo-code authentication allowlist and post-deploy crawl persona matrix.
- `client-data-lane`: No client data is changed by this PR.

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore Holdings.
- Internal only: No.
- Public/demo only: Demo/auth QA path only.
- Feature flag: None.

## Changes Included

- Adds `cio@lakeshore-holdings.example.com` and `cfo@lakeshore-holdings.example.com` to the canonical demo-code roster.
- Adds `lakeshore-cio` to the post-deploy crawl persona list.
- Updates the post-deploy crawl smoke to expect the Lakeshore persona.

## QA / Validation

- PASS: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `./node_modules/.bin/eslint src/lib/auth/canonical-auth-roster.ts src/lib/crawl/persona-switcher.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `git diff --check`
- NOT RUN: signed-in Lakeshore browser QA cannot pass until this roster change is deployed and the matching Clerk users are provisioned.

## Rollout Plan

Merge after CI, build and deploy the web image to ACA, provision the two Lakeshore Clerk users with tenant-locked metadata, then run signed-in Lakeshore Intelligence/Tower smoke.

## Rollback Plan

Revert this PR and redeploy the prior healthy image. Existing Clerk users can remain tenant-locked but would no longer be able to use demo-code sign-in unless re-added to the roster.

## Audit Evidence

- Local smoke proves `lakeshore-cio` resolves from the post-deploy crawl persona matrix.
- Static roster diff adds only the two Lakeshore Holdings CXO demo emails and does not remove or alter other tenants.
- PR URL: pending.

## Known Gaps

- Does not itself create Clerk users; provisioning is a separate controlled step.
- Does not prove signed-in Lakeshore QA until deployed and provisioned.
