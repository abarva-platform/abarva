# Demo Environment Operations

Mapped readiness item: `ABARVA_PILOT_READINESS_PLAN.xlsx` row `T110`.

This runbook defines the repo-controlled part of the AbarVa synthetic demo
environment. It is for sales, investor, and internal rehearsal only. It does not
approve loading real client data and it does not create a private client data
plane.

## Scope

The synthetic demo environment is limited to three rehearsal tenants:

| Tenant                  | Canonical key     | Legacy aliases             | Dataset root                                    | Loader key     |
| ----------------------- | ----------------- | -------------------------- | ----------------------------------------------- | -------------- |
| Apex Retail             | `apex-retail`     | `apex`                     | `datasets/apex-retail-synthetic-v1`             | `apex`         |
| Meridian Health System  | `meridian-health` | `meridian`                 | `datasets/meridian-health-synthetic-v1`         | `meridian`     |
| First Capital Financial | `first-capital`   | `firstcapital`, `arcturus` | `datasets/first-capital-financial-synthetic-v1` | `firstcapital` |

These tenants are synthetic only. Do not present them as live customer data,
live procurement telemetry, live PHI/PII, or production client evidence.

## Nightly Reset Contract

The reset job should rebuild each tenant from committed synthetic substrate
using the existing tenant substrate loader:

```bash
TENANT_KEY=apex npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
TENANT_KEY=meridian npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
```

For a live reset, remove `--dry-run` only in the approved demo data-plane
environment. Never point the reset at a pilot client's private data plane.

The reset scheduler is external evidence. Until the Vercel/Azure scheduler,
logs, and `demo.abarva.com` routing are attached to the release evidence, T110
should remain `In progress`, not `Done`.

## Pre-Demo Verification

Run this before every hosted demo rehearsal:

```bash
npm run demo:environment:verify
```

The verifier checks:

- the three required tenants exist in the demo registry;
- each has a dataset root and manifest;
- each has a loader key and reset command;
- every required product surface has deterministic seed evidence or an honest
  caveat;
- no First Capital demo is treated as shell-only under the legacy `arcturus`
  alias.

The verifier does not prove:

- DNS or routing for `demo.abarva.com`;
- Vercel deployment status;
- Clerk demo users or SSO behavior;
- live Azure/Postgres reset execution;
- browser route screenshots.

Capture those separately when the hosted environment is provisioned.

## Promotion Gate

Before calling the hosted environment demo-ready, attach all evidence below:

| Gate         | Evidence                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| Registry     | Passing `npm run demo:environment:verify` output.                           |
| Hosted route | Browser smoke against `demo.abarva.com` or the approved preview URL.        |
| Auth         | Clerk demo user sign-in and role proof for each tenant.                     |
| Reset        | Last nightly reset log for Apex, Meridian, and First Capital.               |
| Isolation    | Proof that tenant switching does not leak another tenant's seed data.       |
| Copy honesty | Demo banner or talk track says synthetic data and no live client telemetry. |

## Rollback

If a demo tenant breaks, stop using that tenant in live demos and fall back to
the last tenant with passing verifier and browser smoke. If the verifier fails
after a PR, revert that PR or restore the prior registry/data manifest before
running another hosted demo.
