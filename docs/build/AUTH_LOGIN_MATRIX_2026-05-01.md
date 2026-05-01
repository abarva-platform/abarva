# Auth Login Matrix — 2026-05-01

## Status

This matrix is the canonical client-test login list for PR #1371. These accounts are code-defined in `src/testing/test-users/spec.ts` and become live after:

1. PR #1371 is merged.
2. `npx tsx scripts/create-test-users.ts` is run with Clerk + Supabase service credentials.
3. Old auth identities are removed using the dry-run-first cleanup in `scripts/cleanup-auth-users.ts`.

## Shared Login Values

| Field | Value |
| --- | --- |
| Password | `AbarVaTest2026!` |
| Verification code | `424242` |
| Client binding | Exactly one client per account |
| Financial visibility | `false` for all accounts |

## Meridian Health System

| Username | Password | Code | Role / person | Modules visible | Existing records visible | Can create | Can approve/admin | Financial visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `nina.patel@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Admin · Nina Patel · Director, IT Procurement | Setup, Programs, Source, Intelligence, Tower | All Meridian Programs + Source | Programs + Source | User/admin, phase gates, Source stages/awards | No exact financial values |
| `elena.rivera@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Elena Rivera · Director, Digital Product Management | Programs, Intelligence, Tower | Existing Meridian programs | Programs | No | No exact financial values |
| `caleb.nguyen@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Caleb Nguyen · Director, Clinical Product Operations | Programs, Intelligence, Tower | Existing Meridian programs | Programs | No | No exact financial values |
| `marcus.chen@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Programs new/unassigned · Marcus Chen · VP, Data and Analytics | Programs, Intelligence, Tower | None until assigned | Programs | No | No exact financial values |
| `omar.rahman@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Source user · Omar Rahman · Director, Vendor Management and Contracts | Source, Intelligence, Tower | Existing Meridian source events | Source | No | No exact financial values |
| `david.henderson@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Source user · David Henderson · Director, RCM Innovation | Source, Intelligence, Tower | Existing Meridian source events | Source | No | No exact financial values |
| `rebecca.hollings@meridian-health.example.com` | `AbarVaTest2026!` | `424242` | Source new/unassigned · Rebecca Hollings · General Counsel | Source, Intelligence, Tower | None until assigned | Source | No | No exact financial values |

## Apex Retail Group

| Username | Password | Code | Role / person | Modules visible | Existing records visible | Can create | Can approve/admin | Financial visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `maya.desai@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Admin · Maya Desai · Director, IT Procurement | Setup, Programs, Source, Intelligence, Tower | All Apex Programs + Source | Programs + Source | User/admin, phase gates, Source stages/awards | No exact financial values |
| `noah.patel@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Noah Patel · Director, Digital Product Delivery | Programs, Intelligence, Tower | Existing Apex programs | Programs | No | No exact financial values |
| `sofia.bennett@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Sofia Bennett · Director, Store Product Operations | Programs, Intelligence, Tower | Existing Apex programs | Programs | No | No exact financial values |
| `camila.torres@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Programs new/unassigned · Camila Torres · Director, Enterprise Data Products | Programs, Intelligence, Tower | None until assigned | Programs | No | No exact financial values |
| `evelyn.brooks@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Source user · Evelyn Brooks · Chief Procurement Officer | Source, Intelligence, Tower | Existing Apex source events | Source | No | No exact financial values |
| `david.kim@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Source user · David Kim · SVP, Supply Chain | Source, Intelligence, Tower | Existing Apex source events | Source | No | No exact financial values |
| `priya.nair@apex-retail.example.com` | `AbarVaTest2026!` | `424242` | Source new/unassigned · Priya Nair · Chief Digital Officer | Source, Intelligence, Tower | None until assigned | Source | No | No exact financial values |

## First Capital

| Username | Password | Code | Role / person | Modules visible | Existing records visible | Can create | Can approve/admin | Financial visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ethan.brooks@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Admin · Ethan Brooks · Director, IT Sourcing | Setup, Programs, Source, Intelligence, Tower | All First Capital Programs + Source | Programs + Source | User/admin, phase gates, Source stages/awards | No exact financial values |
| `lena.ortiz@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Lena Ortiz · Director, Payments Program Management | Programs, Intelligence, Tower | Existing First Capital programs | Programs | No | No exact financial values |
| `rachel.kim@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Programs user · Rachel Kim · Director, Digital Product Management | Programs, Intelligence, Tower | Existing First Capital programs | Programs | No | No exact financial values |
| `priya.mehta@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Programs new/unassigned · Priya Mehta · Chief Product Officer, Digital Banking | Programs, Intelligence, Tower | None until assigned | Programs | No | No exact financial values |
| `nadia.rahman@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Source user · Nadia Rahman · Chief Procurement Officer | Source, Intelligence, Tower | Existing First Capital source events | Source | No | No exact financial values |
| `james.park@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Source user · James Park · Chief Risk Officer | Source, Intelligence, Tower | Existing First Capital source events | Source | No | No exact financial values |
| `kevin.walsh@firstcapital.example.com` | `AbarVaTest2026!` | `424242` | Source new/unassigned · Kevin Walsh · Head of Commercial Banking | Source, Intelligence, Tower | None until assigned | Source | No | No exact financial values |

## Guardrail Expectations For Testers

- Admin users are client admins only. They are not cross-client super admins.
- Programs users must not see Source unless their `moduleAccess` includes Source.
- Source users must not see Programs unless their `moduleAccess` includes Programs.
- New/unassigned users should land with the ability to create new records but should not browse existing program/source records until assigned.
- Exact budgets, spend baselines, ROI, margins, savings, pricing, and sensitive KPI values must remain hidden for every account in this matrix.
- Cross-client requests must be refused by the agent and rejected by the API.
