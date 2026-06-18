# 20260618-sign-in-email-code-restore — Restore email-code sign-in as default

## Release ID
`20260618-sign-in-email-code-restore`

## Release Lane
`global-control-lane` (shared authentication/sign-in surface).

## Status
`candidate`

## Plain-English Summary
Restores the expected sign-in experience: users enter their provisioned workspace email first, then Clerk sends a one-time email code. The previous private demo credential flow remains available as a secondary "Demo invite" fallback so existing scripted QA and crawlers can still use the shared demo password and access code.

## Layer Impact
- `global-control-lane`: updates the public `/sign-in` client component behavior for all tenants and demo users.
- No tenant data, corpus, retrieval, loader, or context ingestion path changed.

## Client Applicability
- All clients: yes, for the shared sign-in page.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included
- `src/components/auth/DemoCodeSignIn.tsx` — default mode is now email-code sign-in through Clerk JS (`signIn.create({ identifier })`, `prepareFirstFactor({ strategy: 'email_code' })`, and `attemptFirstFactor`). Demo credential sign-in remains behind a "Demo invite" mode.
- `src/__tests__/integration/demo-code-sign-in-panel.test.tsx` — updated to assert the new default email-code flow and the retained demo fallback.

## QA / Validation
- PASS: `npx eslint src/components/auth/DemoCodeSignIn.tsx src/__tests__/integration/demo-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts`
- PASS: `npx jest src/__tests__/integration/demo-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts --runInBand`
- PASS: Local browser render at `http://localhost:3000/sign-in` shows Email code as default, no password field initially, Send code enabled after entering email, and Demo invite fallback with password/access-code fields.
- PASS: Local Clerk send-code probe for `anand.sundaram+firstcapital@thesundaram.com` returned "Code sent" and exposed the access-code entry field.
- BLOCKED/UNRELATED: Repo-wide `npx tsc --noEmit --pretty false --skipLibCheck` is currently blocked by pre-existing Lakeshore/context-dimension type errors outside this auth change.

## Rollout Plan
Merge and deploy the web app. No migration, seed, or data-plane operation is required.

## Rollback Plan
Revert `src/components/auth/DemoCodeSignIn.tsx` and the associated panel test to the prior private demo credential flow. No database rollback required.

## Audit Evidence
- Focused Jest and ESLint command output.
- Local Playwright browser proof against `/sign-in`.
- Local Clerk network proof that `prepare_first_factor` succeeded for the First Capital email alias.

## Context Ingestion Evidence
Not applicable. This release does not touch Admin Data Loads, setup/admin loaders, Azure Blob ingestion, queues, document parsing, client corpus loading, embeddings, or retrieval.

## Known Gaps
- Production deployment and live production browser verification still need to run after merge/deploy.
