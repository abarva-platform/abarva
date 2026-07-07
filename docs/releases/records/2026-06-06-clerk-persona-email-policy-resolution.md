# 2026-06-06-clerk-persona-email-policy-resolution — Clerk Persona Email Policy Resolution

## Release ID

`2026-06-06-clerk-persona-email-policy-resolution`

## Status

`candidate`

## Plain-English Summary

Tenant-locked Clerk demo/client personas can now resolve their database person row by exact same-tenant email when Clerk metadata does not already carry a `persons.id` UUID. This lets existing person-scoped program and Source assignments become visible without granting cross-client access or broadening the canonical admin shortcut.

## Layer Impact

- `global-control-lane`: Updates shared program and Source access-policy resolution for signed-in tenant personas.
- `client-data-lane`: No schema or data changes. Existing `persons`, `person_client_memberships`, `engagement_participants`, and `source_event_participants` rows are now reachable for same-tenant Clerk personas.

## Client Applicability

- All clients: Tenant-locked Clerk personas whose email maps to their active client and whose `persons.email` row exists.
- Specific clients: SkyHarbor Air is the immediate proof case for `cto@skyharbor-air.example.com`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/program-access-policy.ts`: resolves non-UUID Clerk users to `persons.id` by exact email only when the inferred email tenant matches `ctx.clientKey`.
- `src/lib/auth/source-access-policy.ts`: resolves non-UUID Clerk users to `persons.id` by exact email only when the inferred email tenant matches the active Source client key.
- `src/lib/auth/__tests__/program-access-policy.test.ts`: adds coverage for same-tenant Clerk persona email resolving to program assignments.
- `src/lib/auth/__tests__/source-access-policy.test.ts`: adds coverage for same-tenant Clerk persona email resolving to Source assignments.

## QA / Validation

- Pass: `npx jest src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`
- Pass: `npx jest src/lib/auth/__tests__/program-access-policy.test.ts --runInBand`
- Known test-environment warning: Jest reports pre-existing duplicate manual mocks for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`.

## Rollout Plan

Merge to `main`, allow CI to pass, deploy to Vercel production, then rerun the signed-in SkyHarbor CTO crawl against `https://app.abarva.ai/strategic-moves?client=skyharbor` and `https://app.abarva.ai/source/portfolio?client=skyharbor`.

## Rollback Plan

Revert the access-policy commit and redeploy. No data rollback is required because this release changes only read-time identity resolution.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local proof before PR: focused policy tests listed above.
- Existing data-plane proof: Azure read-only audit confirmed 4 SkyHarbor Moves, 8 `skyharbor` Source events, 8 `skyharbor-air` Source events, 2 persona memberships, 8 move participants, and 16 Source participants before this code fix.

## Known Gaps

Live route proof is still pending until this candidate is merged and deployed.
