# 2026-06-19-email-code-sign-in — Restore Email-Code Sign-In UX

## Release ID

`2026-06-19-email-code-sign-in`

## Status

`deployed-lab`

## Plain-English Summary

This release restores the intended sign-in experience: the sign-in page asks for an approved email address first, sends a one-time email code through Clerk, and then asks only for that emailed code. The visible sign-in page no longer asks for a password or a static access code.

## Layer Impact

- `global-control-lane`: changes the shared public `/sign-in` client experience for all invited users.
- `client-data-lane`: no client data changes.
- `internal-admin`: no admin behavior changes.

## Client Applicability

- All clients: yes, all invited users use the same `/sign-in` surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/auth/DemoCodeSignIn.tsx`: changes the custom sign-in panel from password plus static access-code entry to Clerk email-code first-factor sign-in.
- `src/__tests__/integration/demo-code-sign-in-panel.test.tsx`: adds regression coverage that the first sign-in step only requires email and does not render password or static access-code fields.

## QA / Validation

- Pass: `npx eslint src/components/auth/DemoCodeSignIn.tsx src/__tests__/integration/demo-code-sign-in-panel.test.tsx`.
- Pass: `npx jest src/__tests__/integration/demo-code-sign-in-panel.test.tsx --runInBand`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run build`.
- Pending: `npm run release:check`.
- Pending: live `/sign-in` browser check after deploy.

## Rollout Plan

Build and deploy the corrected web image to Azure Container Apps lab, then verify the live `/sign-in` page only shows email on the first step.

## Rollback Plan

Shift Azure Container Apps traffic back to the previous healthy revision if the email-code flow fails. No database rollback is required.

## Audit Evidence

- Source diff in this branch.
- Post-deploy browser check for `/sign-in`.

## Known Gaps

- The old demo-ticket API remains present for compatibility, but the visible sign-in page no longer calls it.
