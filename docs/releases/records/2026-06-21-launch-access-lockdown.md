# 2026-06-21-launch-access-lockdown — Launch Access Lockdown

## Release ID

`2026-06-21-launch-access-lockdown`

## Status

`candidate`

## Plain-English Summary

The public app entry now behaves like a request-access-only surface, while the actual sign-in form lives behind a non-advertised `/access` path. Email-code sign-in checks an AbarVa launch allowlist before Clerk sends a code, and signed-in sessions whose email is not approved are redirected away from tenant workspaces.

## Layer Impact

`global-control-lane`: updates public/auth routing, launch email allowlisting, and signed-in session gating for the shared application shell.

## Client Applicability

- All clients: protected by the same launch access gate.
- Specific clients: current static test mappings cover Apex, First Capital, Meridian, SkyHarbor, and Lakeshore.
- Internal only: admin access is limited to the approved AbarVa admin identities plus runtime env-provisioned admin emails.
- Public/demo only: `/` remains public marketing/request-access; `/sign-in` redirects back to public marketing for signed-out users.
- Feature flag: none.

## Changes Included

- Added launch access roster and runtime allowlist support.
- Added hidden `/access` sign-in page.
- Added `/api/auth/access-eligibility` pre-check before email-code delivery.
- Updated proxy redirects and public route contract.
- Removed visible sign-in CTAs from public marketing navigation defaults.
- Removed secondary public marketing navigation/actions so the visible launch surface has only Request access.
- Added Lakeshore as a first-class client key for auth/client inference.

## QA / Validation

- PASS: `npx jest src/lib/auth/__tests__/launch-access.test.ts src/__tests__/unit/proxy-public-routes.test.ts src/__tests__/integration/demo-code-sign-in-route.test.ts --runInBand` — 3 suites / 21 tests passed. Jest emitted pre-existing duplicate manual mock warnings.
- PASS: focused `npx eslint ...` over touched auth, proxy, marketing, shell, invite, and route files — 0 errors. Existing marketing `<img>` warnings remain.
- PASS: `npm run release:check` — Release Control Gate passed.
- PASS: local browser sanity check on `http://localhost:3000` — `/` rendered request-access marketing, `/sign-in` redirected to `/`, and `/access` rendered the private sign-in form.
- PASS: local browser sanity check after launch-surface tightening — `/` visible nav contained only `Request access`, visible links list was empty, and `/sign-in` still redirected back to `/`.
- PASS: local browser sanity check for `/signed-out` — route returned a 307 redirect to `/`, then rendered the request-access-only public surface.
- PASS: local API sanity check — `anand.sundaram+meridian@thesundaram.com` returned 200 with `clientKey=meridian`; `cdio@meridian-health.example.com` and `random@example.com` returned 403 `access_not_provisioned`.

## Rollout Plan

Merge to the controlled release branch, build the production container, deploy the app runtime, and set runtime allowlist env vars for the real Kiran/Surekha/KK emails:

- `ABARVA_LAUNCH_MERIDIAN_EMAILS`
- `ABARVA_LAUNCH_LAKESHORE_EMAILS`
- `ABARVA_LAUNCH_SKYHARBOR_EMAILS`
- `ABARVA_LAUNCH_ADMIN_EMAILS`

## Rollback Plan

Revert this release commit to restore the previous `/sign-in` behavior and old canonical demo roster. Runtime env vars can be removed without a code rollback.

## Audit Evidence

- Source diff for auth roster, middleware, `/access`, and eligibility route.
- Focused Jest/ESLint output listed above.
- Browser QA: `/` public marketing visible; `/sign-in` redirects to `/`; `/access` renders sign-in; unapproved email receives `access_not_provisioned`.

## Context Ingestion Evidence

Not applicable.

## Known Gaps

The exact real emails for Kiran Mysore, Surekha, and KK are not present in the repository. The code supports them through runtime allowlist env vars; production must set those exact email values before launch.
