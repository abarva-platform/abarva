# 2026-06-29-demo-safe-tenant-display-names — Demo-Safe Tenant Display Names

## Release ID

`2026-06-29-demo-safe-tenant-display-names`

## Status

`candidate`

## Plain-English Summary

Replaces customer-like demo tenant names with category-safe labels in shared tenant display configuration and the V6 synthetic demo packs. Old names remain accepted as aliases for login, routing, and compatibility, but user-visible surfaces should now show labels such as `Retail Demo`, `Airline Demo`, `Healthcare Demo`, `Financial Services Demo`, and `Industrial Demo`.

## Layer Impact

- `global-control-lane`: Updates shared client display-name resolution used by nav, tenant context, and agent headers.
- `client-data-lane`: Updates V6 synthetic demo pack display names and narrative text so V6-backed Home answers do not expose old customer-like names.
- `public-demo`: Makes the soft-launch demo safer by avoiding named demo-client brands in visible product surfaces.

## Client Applicability

- All clients: Shared display-name resolution accepts old aliases but emits demo-safe names for configured demo tenants.
- Specific clients: Apex/Retail, SkyHarbor/Airline, Meridian/Healthcare, First Capital/Financial Services, Lakeshore/Industrial, and Northstar/Clinical Technology demo tenants.
- Internal only: No.
- Public/demo only: Yes, this is demo-client naming hygiene.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`: Canonical client labels now emit demo-safe names while retaining legacy aliases.
- `src/lib/tenant/aliases.ts`: Tenant alias profiles now use the shared demo-safe display labels.
- `datasets/*-synthetic-v6/**`: V6 pack manifests, metadata dictionaries, READMEs, and template records now use demo-safe display names.
- `src/lib/__tests__/client-config-canonical.test.ts`: Enforces old aliases resolving to demo-safe visible names.
- `src/app/api/home/know/ask/__tests__/route.test.ts`: Enforces Home V6 answers using demo-safe tenant labels and not leaking old demo brands.

## QA / Validation

- Passed: `npx jest --runTestsByPath src/lib/__tests__/client-config-canonical.test.ts src/app/api/home/know/ask/__tests__/route.test.ts --runInBand`.
- Passed: `npx eslint src/lib/client-config.ts src/lib/tenant/aliases.ts src/lib/__tests__/client-config-canonical.test.ts src/app/api/home/know/ask/__tests__/route.test.ts`.
- Passed: `rg -n "Apex Retail|SkyHarbor|Meridian Health|First Capital|Lakeshore|Northstar" datasets/*-synthetic-v6` returned no matches.
- Passed: `npm run release:check`.
- Pending before final live proof: ACA deploy and signed-in Home Ask smoke for demo tenants.

## Rollout Plan

Build an Azure Container Apps image from the exact release SHA, deploy to `ca-abarva-web-lab-eastus`, wait for the new revision to become healthy, assign 100% ingress traffic, then run signed-in smoke proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps production/lab release path.
- Shared runtime mutators: `src/lib/client-config.ts`, `src/lib/tenant/aliases.ts`, and V6 dataset artifacts.
- Approved image digest: Pending.
- ACA runtime invariant: `app.abarva.ai` must run the digest built from the release SHA.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by shifting ACA traffic to the prior healthy revision. Code rollback is a revert of this release commit; old tenant aliases remain in place, so routing compatibility should not require data-plane rollback.

## Audit Evidence

- PR/commit: Pending.
- Focused Jest output: Passed locally.
- Release check output: Passed locally.
- ACA revision/digest: Pending.
- Signed-in smoke output: Pending.

## Known Gaps

Historical fixtures, release notes, and compatibility aliases may still contain old demo names as non-user-visible references. This release does not rename tenant keys, directory names, IDs, auth email aliases, or historical release records.
