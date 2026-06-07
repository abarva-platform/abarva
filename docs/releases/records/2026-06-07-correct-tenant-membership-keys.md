# 2026-06-07-correct-tenant-membership-keys — Correct Tenant Membership Keys

## Release ID

`2026-06-07-correct-tenant-membership-keys`

## Status

`candidate`

## Plain-English Summary

Tenant membership rows store the client as a database UUID, while tenant guards need the product tenant key such as `meridian` or `apexretail`. This change carries both values in the current-user context so users are checked against the correct tenant without losing UUID-based data scoping.

## Layer Impact

- `global-control-lane`: Updates shared identity/access context and tenant guard behavior for authenticated app routes. No schema or data-plane write changes are included.

## Client Applicability

- All clients: Yes, for authenticated tenant-scoped routes and Strategic Moves-adjacent access checks that rely on current-user tenant membership.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/current-user.ts` now exposes `AccessibleClient.clientKey`, normalizes Clerk metadata aliases, and uses tenant keys for default client fallback.
- `src/lib/auth/tenant-access.ts` now derives membership access from tenant keys instead of comparing route tenant keys to membership UUIDs.
- `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx` now gates approve affordance with `clientKey`.
- `src/lib/auth/__tests__/current-user.test.ts` covers UUID membership rows with tenant-key mapping.

## QA / Validation

- Pending in this pre-validation checkpoint: targeted Jest and release checks.

## Rollout Plan

Merge to `main` through PR. The change becomes active on the next application deployment; no migrations, flags, or manual runbooks are required.

## Rollback Plan

Revert the application commit. No persisted data or schema changes need rollback.

## Audit Evidence

- PR URL and CI/check output once the branch is opened.
- Targeted Jest output for current-user tenant membership mapping.
- `npm run release:check` output.

## Known Gaps

None known.
