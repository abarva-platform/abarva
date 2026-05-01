# Programs Client Test Users

The old `demo-*+clerk_test@abarva.com` Programs identities are retired.
Use the canonical client-bound roster in `docs/build/AUTH_CANONICAL_ROSTER_2026-05-01.md`.

Programs lane accounts:

| Client | Email | Person | Role | Existing program visibility | Can create new Programs | Financial visibility |
| --- | --- | --- | --- | --- | --- | --- |
| Meridian Health System | elena.rivera@meridian-health.example.com | Elena Rivera | Director, Digital Product Management | Existing Meridian programs | Yes | false |
| Meridian Health System | caleb.nguyen@meridian-health.example.com | Caleb Nguyen | Director, Clinical Product Operations | Existing Meridian programs | Yes | false |
| Meridian Health System | marcus.chen@meridian-health.example.com | Marcus Chen | VP, Data and Analytics | None until assigned | Yes | false |
| Apex Retail Group | noah.patel@apex-retail.example.com | Noah Patel | Director, Digital Product Delivery | Existing Apex programs | Yes | false |
| Apex Retail Group | sofia.bennett@apex-retail.example.com | Sofia Bennett | Director, Store Product Operations | Existing Apex programs | Yes | false |
| Apex Retail Group | camila.torres@apex-retail.example.com | Camila Torres | Director, Enterprise Data Products | None until assigned | Yes | false |
| First Capital | lena.ortiz@firstcapital.example.com | Lena Ortiz | Director, Payments Program Management | Existing First Capital programs | Yes | false |
| First Capital | rachel.kim@firstcapital.example.com | Rachel Kim | Director, Digital Product Management | Existing First Capital programs | Yes | false |
| First Capital | priya.mehta@firstcapital.example.com | Priya Mehta | Chief Product Officer, Digital Banking | None until assigned | Yes | false |

Provision with `npx tsx scripts/create-test-users.ts`. Review legacy cleanup with `npx tsx scripts/cleanup-auth-users.ts` before applying deletion.
