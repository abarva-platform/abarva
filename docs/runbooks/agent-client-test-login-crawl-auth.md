# Agent Client Test Login Crawl Auth

## Purpose

Agents need signed-in browser state to crawl client workspaces after Clerk gates private routes. This runbook creates one local Playwright `storageState` file per client/persona so crawlers can run without shared passwords, copied browser cookies, or cross-client access.

## Security Rules

- Use one Clerk user per client/persona.
- Never use a multi-client account for buyer/demo crawls.
- Never commit `.auth/*.json`; those files contain live Clerk `__session` cookies.
- Never place real personal phone numbers, OTPs, or private email/cell credentials in repo files.
- The script refuses to save a state when the Clerk user metadata does not match the expected single `clientId`.

## Canonical Agent Personas

| Persona key | Client | Email | Storage state |
| --- | --- | --- | --- |
| `apexretail-cio` | Apex Retail Group | `cio@apex-retail.example.com` | `.auth/agent-apexretail-cio.json` |
| `meridian-cdao` | Meridian Health System | `cdao@meridian-health.example.com` | `.auth/agent-meridian-cdao.json` |
| `firstcapital-cio` | First Capital | `cio@firstcapital.example.com` | `.auth/agent-firstcapital-cio.json` |
| `northstar-cio` | Northstar Clinical Technologies | `cio@northstar-clinical.example.com` | `.auth/agent-northstar-cio.json` |
| `skyharbor-cto` | SkyHarbor Air | `cto@skyharbor-air.example.com` | `.auth/agent-skyharbor-cto.json` |
| `skyharbor-admin` | SkyHarbor Air | `admin@skyharbor-air.example.com` | `.auth/agent-skyharbor-admin.json` |
| `lakeshore-cfo` | Lakeshore Holdings | `cfo@lakeshore-holdings.example.com` | `.auth/agent-lakeshore-cfo.json` |
| `lakeshore-cio` | Lakeshore Holdings | `cio@lakeshore-holdings.example.com` | `.auth/agent-lakeshore-cio.json` |

## Prerequisites

Run from the repo root with a local `.env.local` containing:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

The target app must be reachable at `BASE_URL` and must have the corresponding Clerk users provisioned. If a user is missing, provision the canonical persona first:

```bash
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --clerk-only --apply
npx tsx scripts/provision-cxo-personas.ts --client skyharbor --clerk-only --apply
```

Use `--client meridian`, `--client apexretail`, or another supported client when provisioning other clients.

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
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client lakeshore --refresh
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client meridian --refresh
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client skyharbor --refresh
```

Prime one exact persona:

```bash
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --persona meridian-cdao --refresh
```

The script writes:

- local auth files under `.auth/`
- a report under `reports/agent-client-auth/`

## Use In Playwright

```ts
import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/agent-meridian-cdao.json' });

test('crawl Meridian signed-in pages', async ({ page }) => {
  await page.goto('/home?client=meridian');
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
| `No Clerk user found` | The canonical persona has not been provisioned in Clerk. | Run `scripts/provision-cxo-personas.ts` for that client. |
| `publicMetadata.clientId=<x>; expected <y>` | The user is mapped to the wrong tenant. | Fix Clerk metadata before crawling. |
| `Responsible AI training API returned <status>` | The training gate did not record completion for the signed-in user. | Confirm the training ledger is reachable and the acknowledgment was accepted first. |
| `redirected to sign-in` | Auth state did not work for the target app. | Confirm `BASE_URL`, Clerk keys, deployment, and user status. |

## Cleanup

Refresh one persona:

```bash
rm .auth/agent-meridian-cdao.json
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --persona meridian-cdao
```

Remove all local crawl auth:

```bash
rm -rf .auth/agent-*.json
```
