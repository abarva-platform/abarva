# Agent Client Test Login Crawl Auth

## Purpose

Agents need signed-in browser state to crawl client workspaces after Clerk gates private routes. This runbook creates one local Playwright `storageState` file per active automation persona so crawlers can run without shared passwords, copied browser cookies, or cross-client access.

## Security Rules

- Use one Clerk user per active client/persona.
- Never use a multi-client account for buyer/demo crawls.
- Never commit `.auth/*.json`; those files contain live Clerk `__session` cookies.
- Never place real personal phone numbers, OTPs, or private email/cell credentials in repo files.
- The script refuses to save a state when the Clerk user metadata does not match the expected single `clientId`.

## Canonical Agent Personas

| Persona key | Client | Email | Storage state |
| --- | --- | --- | --- |
| `agent-skyharbor` | Airline Demo | `skyharbor-agent@abarva.example.com` | `.auth/agent-skyharbor.json` |

Retired demo tenants are intentionally absent from the automation roster. Recreate them only through the governed new-template onboarding flow, not by restoring old crawl personas.

## Prerequisites

Run from the repo root with a local `.env.local` containing:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

The target app must be reachable at `BASE_URL` and must have the corresponding Clerk users provisioned. If a user is missing, provision the canonical persona first:

```bash
npx tsx scripts/provision-cxo-personas.ts --client skyharbor --clerk-only --apply
```

For CI or other automated browser runs against Clerk bot protection, provide a secret capable of minting Clerk testing tokens:

- `CLERK_TESTING_TOKEN_SECRET_KEY`, preferred and scoped for testing-token creation; or
- `CLERK_SECRET_KEY`, used as the fallback when no dedicated testing-token secret is configured.

The crawl harness mints a short-lived Clerk testing token and injects it into Clerk Frontend API requests as `__clerk_testing_token` before the ticket sign-in exchange. This is a test-only automation allowance; it does not disable Clerk, bypass tenant metadata checks, or broaden any agent user's client access.

## Create Storage States

List supported personas:

```bash
npm run auth:agent-client-states -- --list
```

Prime all supported personas against local dev:

```bash
BASE_URL=http://localhost:3000 npm run auth:agent-client-states -- --refresh
```

Prime one client against production:

```bash
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client skyharbor --refresh
```

Prime one exact persona:

```bash
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --persona agent-skyharbor --refresh
```

The script writes:

- local auth files under `.auth/`
- a report under `reports/agent-client-auth/`

## Use In Playwright

```ts
import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/agent-skyharbor.json' });

test('crawl Airline Demo signed-in pages', async ({ page }) => {
  await page.goto('/home?client=skyharbor');
  await expect(page).not.toHaveURL(/sign-in/);
});
```

## What The Script Verifies

- Clerk user exists.
- `publicMetadata.clientId` equals the expected client key.
- `publicMetadata.defaultClientId`, when present, equals the same client key.
- Multi-client metadata arrays/objects are absent or single-client only.
- `abarva_active_client` cookie is set to the expected client.
- `abarva_selected_client` localStorage is set to the expected client.
- Responsible AI acknowledgment is accepted for that signed-in user when required.
- Responsible AI training is completed for that signed-in user when required.
- Probe routes do not redirect to `/sign-in`.

## Failure Modes

| Failure | Meaning | Fix |
| --- | --- | --- |
| `Missing CLERK_SECRET_KEY` | The script cannot mint Clerk sign-in tickets. | Add the local secret to `.env.local`; do not commit it. |
| `You have been banned` | Clerk bot protection blocked the browser-side ticket exchange before the app route was reached. | Ensure testing tokens are enabled in the Clerk instance and `CLERK_TESTING_TOKEN_SECRET_KEY` or `CLERK_SECRET_KEY` is available to the crawl. |
| `No Clerk user found` | The canonical persona has not been provisioned in Clerk. | Run `scripts/provision-cxo-personas.ts` for that client. |
| `publicMetadata.clientId=<x>; expected <y>` | The user is mapped to the wrong tenant. | Fix Clerk metadata before crawling. |
| `Responsible AI training API returned <status>` | The training gate did not record completion for the signed-in user. | Confirm the training ledger is reachable and the acknowledgment was accepted first. |
| `redirected to sign-in` | Auth state did not work for the target app. | Confirm `BASE_URL`, Clerk keys, deployment, and user status. |

## Cleanup

Refresh one persona:

```bash
rm .auth/agent-skyharbor.json
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --persona agent-skyharbor
```

Remove all local crawl auth:

```bash
rm -rf .auth/agent-*.json
```
