# 2026-07-29-foundation-proof-phone-required — Foundation Proof Login Phone Requirement

## Release ID

`2026-07-29-foundation-proof-phone-required`

## Status

`candidate`

## Plain-English Summary

The foundation proof-login roster now includes controlled, validation-safe phone numbers because the Clerk instance requires a phone number when creating users. The provisioning script sends that phone value when creating proof users and keeps the prior metadata-only update behavior for existing users.

## Layer Impact

- Auth/control plane: updates the foundation-only proof identity roster and the Clerk provisioning helper used to create signed-in preview identities.
- QA/control plane: adds a regression check that the roster has unique E.164 phone numbers and does not use reserved example-domain emails.

## Client Applicability

- All clients: No.
- Specific clients: Foundation preview tenants only.
- Internal only: Yes, for proof identity provisioning.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `src/lib/auth/foundation-proof-logins.ts`
- `scripts/auth/provision-foundation-proof-logins.ts`
- `src/lib/auth/__tests__/foundation-proof-logins.test.ts`
- Follow-up correction: replace an invalid `+1 555` area-code pattern with reserved `+1 202-555-01xx` proof numbers that satisfy phone-number validation.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/auth/__tests__/foundation-proof-logins.test.ts`
- Pass: `FOUNDATION_PROOF_LIST=true npm run auth:foundation-proof:provision`
- Pass: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main lane, confirm the runtime invariant, then rerun the private operator provisioning job with the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: resolved by the ACA main deploy after merge.
- ACA runtime invariant: required before rerunning provisioning.
- Worker image invariant: required before rerunning provisioning.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after proof identities provision successfully.

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. Existing proof users can be left in Clerk with restricted foundation-preview metadata, or disabled by the existing Clerk admin path if needed.

## Audit Evidence

- Focused unit test output.
- Foundation proof roster list-mode output.
- TypeScript check output.
- Release gate output.
- Follow-up ACA deploy and private operator proof bundle after merge.

## Known Gaps

The actual Clerk provisioning and signed-in browser proof are downstream acceptance steps after this change is deployed.
