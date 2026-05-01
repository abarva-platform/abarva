# Auth Canonical Roster — 2026-05-01

## Decision

AbarVa demo auth now uses real client-persona accounts, not `demo-*` identities. Every account is pinned to exactly one client. There is no cross-client super admin in the canonical roster.

## Operating Rules

- One scoped admin per client.
- Three Programs users per client.
- Three Source users per client.
- One Programs user and one Source user per client are intentionally unassigned to existing records but can create new records.
- Financial visibility is `false` for every canonical user by default.
- Hidden navigation is UX only; server-side route/data guards still enforce module access.

## Canonical Users

| Client | Lane | Email | Person | Client role | Existing-record visibility | Create rights | Approval/admin rights | Financial visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Meridian Health System | Admin | nina.patel@meridian-health.example.com | Nina Patel | Director, IT Procurement | All client Programs + Source via client_admin | Programs + Source | User/admin + gates + Source approvals | false |
| Meridian Health System | Programs | elena.rivera@meridian-health.example.com | Elena Rivera | Director, Digital Product Management | Existing Meridian programs | Programs | No | false |
| Meridian Health System | Programs | caleb.nguyen@meridian-health.example.com | Caleb Nguyen | Director, Clinical Product Operations | Existing Meridian programs | Programs | No | false |
| Meridian Health System | Programs new/unassigned | marcus.chen@meridian-health.example.com | Marcus Chen | VP, Data and Analytics | None until assigned | Programs | No | false |
| Meridian Health System | Source | omar.rahman@meridian-health.example.com | Omar Rahman | Director, Vendor Management and Contracts | Existing Meridian source events | Source | No | false |
| Meridian Health System | Source | david.henderson@meridian-health.example.com | David Henderson | Director, RCM Innovation | Existing Meridian source events | Source | No | false |
| Meridian Health System | Source new/unassigned | rebecca.hollings@meridian-health.example.com | Rebecca Hollings | General Counsel | None until assigned | Source | No | false |
| Apex Retail Group | Admin | maya.desai@apex-retail.example.com | Maya Desai | Director, IT Procurement | All client Programs + Source via client_admin | Programs + Source | User/admin + gates + Source approvals | false |
| Apex Retail Group | Programs | noah.patel@apex-retail.example.com | Noah Patel | Director, Digital Product Delivery | Existing Apex programs | Programs | No | false |
| Apex Retail Group | Programs | sofia.bennett@apex-retail.example.com | Sofia Bennett | Director, Store Product Operations | Existing Apex programs | Programs | No | false |
| Apex Retail Group | Programs new/unassigned | camila.torres@apex-retail.example.com | Camila Torres | Director, Enterprise Data Products | None until assigned | Programs | No | false |
| Apex Retail Group | Source | evelyn.brooks@apex-retail.example.com | Evelyn Brooks | Chief Procurement Officer | Existing Apex source events | Source | No | false |
| Apex Retail Group | Source | david.kim@apex-retail.example.com | David Kim | SVP, Supply Chain | Existing Apex source events | Source | No | false |
| Apex Retail Group | Source new/unassigned | priya.nair@apex-retail.example.com | Priya Nair | Chief Digital Officer | None until assigned | Source | No | false |
| First Capital | Admin | ethan.brooks@firstcapital.example.com | Ethan Brooks | Director, IT Sourcing | All client Programs + Source via client_admin | Programs + Source | User/admin + gates + Source approvals | false |
| First Capital | Programs | lena.ortiz@firstcapital.example.com | Lena Ortiz | Director, Payments Program Management | Existing First Capital programs | Programs | No | false |
| First Capital | Programs | rachel.kim@firstcapital.example.com | Rachel Kim | Director, Digital Product Management | Existing First Capital programs | Programs | No | false |
| First Capital | Programs new/unassigned | priya.mehta@firstcapital.example.com | Priya Mehta | Chief Product Officer, Digital Banking | None until assigned | Programs | No | false |
| First Capital | Source | nadia.rahman@firstcapital.example.com | Nadia Rahman | Chief Procurement Officer | Existing First Capital source events | Source | No | false |
| First Capital | Source | james.park@firstcapital.example.com | James Park | Chief Risk Officer | Existing First Capital source events | Source | No | false |
| First Capital | Source new/unassigned | kevin.walsh@firstcapital.example.com | Kevin Walsh | Head of Commercial Banking | None until assigned | Source | No | false |

## Implementation Files

- `src/lib/auth/canonical-auth-roster.ts` is the runtime-safe canonical email list.
- `src/testing/test-users/spec.ts` defines Clerk metadata, DB person rows, memberships, Programs assignments, and Source assignments.
- `scripts/create-test-users.ts` provisions Clerk users, Supabase `persons`, `person_client_memberships`, `engagement_participants`, and `source_event_participants`.
- `scripts/cleanup-auth-users.ts` dry-runs or applies deletion of old auth/test identities.
- `src/lib/auth/demo-code.ts` allows code sign-in only for canonical roster emails.
- `src/lib/auth/module-access.ts` gives Setup only to canonical scoped admins.
- `src/lib/auth/source-access-policy.ts` gives non-UUID fallback Source admin only to canonical scoped admins.

## Cleanup Protocol

1. Run `npx tsx scripts/create-test-users.ts` to provision or refresh canonical users.
2. Run `npx tsx scripts/cleanup-auth-users.ts` to generate the deletion report.
3. Review `reports/auth-cleanup/latest.local.json`.
4. Only then run `npx tsx scripts/cleanup-auth-users.ts --apply --confirm-delete-non-roster-users`.

The cleanup script intentionally does not delete ordinary org-chart persons. It only selects old auth/test rows matching legacy `demo-*`, `+clerk_test`, `@abarva-test.example.com`, `person_demo_*`, `source_operator_*`, or `test_person_*` patterns.
