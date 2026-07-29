# 2026-07-29-foundation-access-sunset — Foundation Access Sunset Guard

## Release ID

`2026-07-29-foundation-access-sunset`

## Status

`candidate`

## Plain-English Summary

Foundation-only proof users now land on the governed Knowledge preview route instead of the legacy Home route. The `/home` entry point is archived as a redirect-only route so the old Home V2/V4 renderer is no longer reachable from that URL. The release also adds a dry-run-first Clerk operator command for disabling retired demo tenant logins without deleting users or mutating Knowledge foundation data.

## Layer Impact

- `global-control-lane`: Knowledge route access is tightened so foundation proof users cannot drift into older product pages.
- `internal-admin`: Clerk login cleanup is now a separate audited command with dry-run and explicit apply confirmation.
- Canonical model: No review, publication, baseline, projection, or source data changes.

## Client Applicability

- All clients: no ordinary client data changes.
- Specific clients: foundation proof tenants only.
- Internal only: Clerk cleanup operator command.
- Public/demo only: retired demo logins are candidates for disablement through the explicit operator command.
- Feature flag: none.

## Changes Included

- Foundation preview routing helpers.
- Post-sign-in routing for foundation proof sessions.
- Proxy guard for foundation proof sessions.
- Home route archive redirect; the old Home renderer is no longer mounted at `/home`.
- Historical Airline Demo labels now resolve to the new foundation tenant before legacy aliases can map them to retired tenant data.
- Clerk legacy-login disable dry-run/apply script.
- Focused unit tests for routing, proxy metadata, and disable classification.

## QA / Validation

- `jest src/lib/auth/__tests__/access-routing.test.ts src/__tests__/unit/proxy-session-identity.test.ts src/lib/auth/__tests__/legacy-tenant-sunset.test.ts src/lib/auth/__tests__/foundation-route-access.test.ts --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 tsc --noEmit --pretty false` passed.
- Hotfix validation repeated focused routing tests and full TypeScript after the hard `/home` archive redirect.

## Rollout Plan

Merge through the normal PR lane. Deploy through the repo-owned Azure Container Apps main deploy workflow. Run the Clerk disable script first in dry-run mode; apply mode requires an explicit confirmation flag and a valid Clerk secret.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime routing changes.
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: captured by ACA deploy workflow.
- ACA runtime invariant: required before calling the runtime live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, foundation proof login to Knowledge preview and `/home` redirect behavior.

## Rollback Plan

Revert the PR and redeploy the prior ACA digest. If the Clerk disable script is applied, unban specific users through Clerk using the generated report as the audit list.

## Audit Evidence

- PR and CI checks.
- Focused Jest output.
- TypeScript output.
- Clerk dry-run or apply JSON report when the operator command is run.
- Signed-in browser proof after deploy.

## Known Gaps

The Clerk disable command requires `CLERK_SECRET_KEY`; without it, only code-level validation can run locally.
