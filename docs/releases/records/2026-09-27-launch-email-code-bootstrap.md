# 2026-09-27-launch-email-code-bootstrap — Launch email-code sign-in bootstraps approved Clerk users

## Release ID

`2026-09-27-launch-email-code-bootstrap`

## Status

`candidate`

## Plain-English Summary

The custom one-time-code sign-in page checked the application's launch roster, but then asked Clerk
to start an email-code sign-in against whatever users already existed in Clerk. If an email was
approved in the app but had not yet been materialized as a Clerk user, the user saw an account-not-
found error even though the product considered the identity approved.

This change makes approved launch sign-in deterministic: before starting the Clerk email-code flow,
the app ensures the approved identity exists in Clerk and carries the same tenant/client metadata
used by the rest of the workspace. Unapproved emails still fail before any Clerk user is created.
The private demo-code route uses the same helper so approved launch identities cannot fall into a
separate missing-user state there either.

The production auth provider also requires a phone-number field when a backend user is created.
Launch bootstrap now supplies a deterministic non-routable phone value for newly materialized
approved identities so email-code sign-in can proceed without collecting a phone number from the
user. If the provider still rejects provisioning, the bootstrap route returns a typed JSON failure
instead of a blank 500.

## Layer Impact

Release lane: `global-control-lane` — shared authentication bootstrap behaviour for the product
workspace.

- **Layer 4 (Products / auth shell):** the sign-in components now call a guarded bootstrap route
  before invoking Clerk email-code sign-in.
- **Control plane / auth integration:** a server-only helper creates or refreshes approved Clerk
  users with scoped metadata derived from the launch-access registry.
- **Data plane:** none. No tenant records, product facts, or governed context objects are modified.

## Client Applicability

- All clients: the route and sign-in path are shared.
- Specific clients: only identities explicitly approved by the launch-access registry or runtime
  launch-access environment variables can be provisioned.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/auth/launch-user-provisioning.ts` — server-only provisioning helper for approved launch
  identities, including auth-provider-required create-time account fields.
- `src/app/api/auth/launch-user/route.ts` — pre-auth bootstrap endpoint guarded by the launch roster.
- `src/components/auth/EmailCodeSignIn.tsx` and `src/components/auth/DemoCodeSignIn.tsx` — call the
  bootstrap endpoint before starting email-code sign-in.
- `src/app/api/auth/demo-code-sign-in/route.ts` — reuses the same helper before issuing a private
  sign-in ticket.
- `src/proxy.ts` — keeps the bootstrap endpoint reachable from the signed-out page.
- `.github/workflows/integration-suites.yml` and `docs/architecture/test-ci-coverage-census.json` —
  register the new integration suite in pull-request CI.
- `docs/security/tenancy-fence-coverage.json` — regenerated route census for the new pre-auth
  bootstrap endpoint.

## QA / Validation

- `npm test -- --runInBand src/__tests__/integration/launch-user-route.test.ts src/__tests__/integration/email-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts src/__tests__/unit/proxy-public-routes.test.ts` — **Pass**, 34 passed / 0 failed.
- `npm test -- --runInBand src/__tests__/integration/launch-user-route.test.ts src/__tests__/integration/email-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts src/__tests__/unit/proxy-public-routes.test.ts src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — **Pass**, 50 passed / 0 failed.
- Follow-up focused regression for provider-required phone bootstrap and typed provisioning errors:
  **Pass** in the follow-up PR; focused auth route/component suite is 36 passed / 0 failed.
- `npm run test:integration:ci-visibility` — **Pass**.
- `npm run audit:test-ci-coverage:check` — **Pass**.
- `npm run audit:tenancy-fence-coverage:check` — **Pass**.
- Broader validation: see PR body for typecheck, lint, release check, deploy, and signed-in smoke
  evidence.

## Rollout Plan

Squash merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys
the runtime image. No migration, manual data job, feature flag, or environment-variable change is
required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded after the workflow completes.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a signed-out launch email-code attempt should advance past
  the prior account-not-found state on the deployed revision.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. Existing Clerk users
created for approved identities are harmless to leave in place; the old route simply stops calling
the bootstrap path.

## Audit Evidence

- Focused auth route and component tests listed above.
- Release check output.
- Pull request diff and CI.
- ACA workflow run, digest invariant proof, and signed-in browser proof after deploy.

## Known Gaps

- This fixes the custom email-code and private ticket bootstrap path. It does not repair external
  identity-provider configuration if an OAuth provider is missing a provider-side client id.
