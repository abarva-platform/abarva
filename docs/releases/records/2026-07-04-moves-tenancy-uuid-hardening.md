# 2026-07-04-moves-tenancy-uuid-hardening — Ignore non-UUID tenancy person ids

## Release ID

`2026-07-04-moves-tenancy-uuid-hardening`

## Status

`candidate`

## Plain-English Summary

During the live Moves recording-readiness proof, the signed-in Industrial Demo lane exposed a server error on `/api/v1/programs`. The auth context was trusting a legacy display-name value, `Anand Sundaram`, as if it were a database person UUID. That value then reached a UUID-typed Postgres membership query and failed before the route could list Moves.

This release hardens tenancy, program access resolution, and Moves summary person-label resolution so only real UUID-shaped person ids are passed as database actor ids. Legacy display-name values now fall through to the existing Clerk-backed actor path, are ignored by email-based policy lookup, or render as legacy display labels without querying UUID-typed `persons.id`.

## Layer Impact

- `global-control-lane`: Shared tenancy/auth resolution for product routes that require a tenant and actor context.
- `public-demo`: Improves the Industrial Demo recording path by preventing a demo-lane list route from failing on a legacy display-name id.

## Client Applicability

- All clients: Yes. The guard is shared tenancy behavior.
- Specific clients: The live failure was observed in Industrial Demo.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/tenancy.ts`: validates `person.id`, `user.personId`, and JIT-provisioned person ids before treating any value as a database UUID actor id.
- `src/lib/auth/program-access-policy.ts`: ignores legacy non-UUID `persons.id` values returned from email lookup before querying UUID-typed access tables.
- `src/lib/programs/transformers.ts`: prevents legacy non-UUID participant `user_id` values from being used as `persons.id` lookup keys while building Moves summary sponsor/lead/team labels.
- `src/app/api/v1/programs/__tests__/_auth.test.ts`: adds regression coverage for a legacy display-name person id at tenancy resolution.
- `src/lib/auth/__tests__/program-access-policy.test.ts`: adds regression coverage for a legacy display-name person id returned from policy email lookup.
- `src/lib/programs/__tests__/transformers-azure-read.test.ts`: adds regression coverage for legacy display-name participant ids in Moves summary rendering.

## QA / Validation

- Pass: `npx jest src/app/api/v1/programs/__tests__/_auth.test.ts --runInBand`
- Pass: `npx jest src/app/api/v1/programs/__tests__/_auth.test.ts src/lib/auth/__tests__/program-access-policy.test.ts --runInBand`
- Pass: `npx jest src/lib/programs/__tests__/transformers-azure-read.test.ts src/app/api/v1/programs/__tests__/_auth.test.ts src/lib/auth/__tests__/program-access-policy.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/transformers.ts src/lib/programs/__tests__/transformers-azure-read.test.ts src/lib/auth/tenancy.ts src/lib/auth/program-access-policy.ts src/app/api/v1/programs/__tests__/_auth.test.ts src/lib/auth/__tests__/program-access-policy.test.ts`
- Pending: `git diff --check`.
- Pending: `npm run release:check`.
- Pending: live signed-in `/api/v1/programs` proof after ACA deploy.

## Rollout Plan

Merge to `main`, build and deploy through the repo-owned Azure Container Apps main deploy workflow, wait for the new revision to become healthy, assign 100% traffic, and rerun the signed-in Industrial Demo proof.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps `ca-abarva-web-lab-eastus`
- Approved image digest: Pending deploy
- ACA runtime invariant: `app.abarva.ai` must run the digest-pinned image for this commit at 100% traffic before live proof is claimed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback to the previous healthy ACA revision if the tenancy guard causes route regressions. No migration or data rollback is required.

## Audit Evidence

- Live failure root cause observed in ACA logs: `invalid input syntax for type uuid: "Anand Sundaram"` on `/api/v1/programs`.
- Post-first-deploy proof showed the same display-name row could still enter through program access policy email lookup, so the candidate now guards both tenancy and policy lookup.
- Post-second-deploy proof showed the same legacy display-name row could still enter through Moves summary participant label resolution, so the candidate now guards that transformer path too.
- Local regression test validates that display-name ids fall through to `clerk:<clerkUserId>`.
- Local regression test validates that legacy participant display names render without querying `persons.id`.
- Post-deploy proof report will be added after live verification.

## Known Gaps

- Live signed-in verification is pending until this candidate is deployed.
