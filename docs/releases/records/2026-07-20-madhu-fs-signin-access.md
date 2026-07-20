# 2026-07-20-madhu-fs-signin-access — Madhu FS Sign-In Access

## Release ID

`2026-07-20-madhu-fs-signin-access`

## Status

`candidate`

## Plain-English Summary

Adds a clear Sign in entry point on the public AbarVa page and keeps signed-out users on a page that lets them sign back in. Adds Madhu Reddy's Republic E Bank email as an exact pilot access grant pinned to the Financial Services demo client.

## Layer Impact

- `global-control-lane`: Public marketing and auth routes now expose a direct sign-in path and preserve the email-code sign-in shell.
- `client-data-lane`: `MReddy@RepublicEBank.com` is mapped exactly to the FS/First Capital client key `arcturus`; no Republic E Bank domain-wide grant is added.

## Client Applicability

- All clients: Public `/` and `/signed-out` sign-in navigation.
- Specific clients: Madhu Reddy receives FS demo access through `arcturus`.
- Internal only: None.
- Public/demo only: Public landing page sign-in CTA.
- Feature flag: None.

## Changes Included

- `src/components/marketing/LoggedOutLandingPage.tsx`: adds Sign in links in the nav and hero CTA.
- `src/app/signed-out/page.tsx`: replaces redirect-only behavior with a signed-out confirmation page and Sign in again link.
- `src/app/layout.tsx`: sends Clerk sign-out completion to `/signed-out`.
- `src/app/sign-in/[[...sign-in]]/page.tsx`: keeps email-code sign-in as default and preserves explicit Clerk/demo-code fallback modes.
- `src/lib/client-config.ts` and `src/lib/auth/access-routing.ts`: add exact Madhu Reddy FS pilot mapping and locked client role inference.
- `src/lib/auth/__tests__/pilot-access.test.ts`: covers the Madhu grant and confirms other Republic E Bank emails are not auto-granted.

## QA / Validation

- `npx eslint src/components/marketing/LoggedOutLandingPage.tsx src/lib/client-config.ts src/lib/auth/access-routing.ts src/lib/auth/__tests__/pilot-access.test.ts src/app/layout.tsx 'src/app/sign-in/[[...sign-in]]/page.tsx' src/app/signed-out/page.tsx` — passed with existing `<img>` warnings in the marketing page.
- `npm test -- src/lib/auth/__tests__/pilot-access.test.ts src/lib/auth/__tests__/access-routing.test.ts --runInBand` — passed, with existing duplicate manual mock warnings.
- Local browser smoke at `http://localhost:3017`: confirmed two public `/sign-in` links, public nav click to `/sign-in`, `/signed-out` Sign in again click to `/sign-in`, and email-code form visibility.
- Clerk configured instance: created `mreddy@republicebank.com` with verified email, verified phone, `role=client`, `clientId=arcturus`, `defaultClientId=arcturus`, `tenantKey=first-capital`, and `clientLocked=true`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds the image, deploys to `ca-abarva-web-lab-eastus`, and shifts traffic only after the managed revision is healthy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required after deployment before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify `/` sign-in link, `/signed-out` sign-in link, and Madhu email-code routing to FS after deploy.

## Rollback Plan

Revert this PR and allow the ACA main deploy workflow to publish the rollback image. If needed, remove or update the Madhu Clerk user metadata separately in Clerk.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment evidence: pending.
- Clerk proof: user `user_3GmLSISVm89SrKTDa9ZQAZ9PToB`, email verified, phone verified, metadata pinned to `arcturus`.

## Known Gaps

Live browser proof on `app.abarva.ai` is pending until merge and ACA deployment complete.
