# 2026-06-06-skyharbor-strategic-moves-client-key - SkyHarbor Strategic Moves Client Key

## Release ID

`2026-06-06-skyharbor-strategic-moves-client-key`

## Status

`candidate`

## Plain-English Summary

The signed-in SkyHarbor CTO account was tenant-branded correctly, but the
Strategic Moves page did not pass the active client key into the program access
policy. That prevented the Clerk persona email-to-person resolver from proving
that the user belonged to the active SkyHarbor client, so the page rendered the
empty "No Moves Yet" state even after the SkyHarbor Moves were loaded.

This release carries the active client key through the Strategic Moves tenancy
context so the existing one-client-only access policy can resolve same-tenant
Clerk personas without granting cross-client access.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves tenancy plumbing used
  by all clients. The added field is already part of the `TenancyCtx` contract
  and only narrows same-tenant policy resolution; it does not widen access.

## Client Applicability

- All clients: Strategic Moves tenancy context now includes `clientKey`.
- Specific clients: SkyHarbor route proof is the immediate validation target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/strategic-moves-context.ts` now includes
  `clientKey: activeClient.key` in the returned `TenancyCtx`.
- `src/lib/programs/__tests__/strategic-moves-context.test.ts` covers the
  locked Clerk persona case that requires the client key.

## QA / Validation

- PASS: `npx jest src/lib/programs/__tests__/strategic-moves-context.test.ts src/lib/auth/__tests__/program-access-policy.test.ts --runInBand`
- PASS: `npx eslint src/lib/programs/strategic-moves-context.ts src/lib/programs/__tests__/strategic-moves-context.test.ts`

## Rollout Plan

Merge through the normal PR flow, deploy the merged main commit to Vercel
production, then rerun the signed-in SkyHarbor CTO crawl against
`https://app.abarva.ai/strategic-moves?client=skyharbor`.

## Rollback Plan

Revert this commit. Rollback would restore the previous Strategic Moves tenancy
shape and reintroduce the SkyHarbor empty-state behavior for Clerk personas that
do not carry a `persons.id` in session metadata.

## Audit Evidence

- Prior failing live crawl:
  `/private/tmp/nexus-skyharbor-artifact-seed/reports/skyharbor-post-3198-signed-in-crawl/2026-06-06T10-52-50-836Z/report.md`
- Focused Jest and ESLint commands listed above.

## Known Gaps

The Source portfolio proof remains blocked separately: live production is still
showing older SkyHarbor Source rows while the newly loaded SkyHarbor Source
events were proven in the Azure loader job database. That requires production
data-plane alignment or a deliberate reload into the database used by
`app.abarva.ai`; it is not solved by this Strategic Moves tenancy fix.
