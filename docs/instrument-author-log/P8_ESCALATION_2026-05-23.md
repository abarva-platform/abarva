# P8 Instrument Authoring Escalation

Date: 2026-05-23 10:52 CDT

## Summary

P8 is blocked before content authoring. The target Azure Postgres runtime database reachable from the Container Apps environment does not have the P4 instrument schema or the P2 `discovery_instruments` assignment table.

## Live Evidence

Probe path:
- Container Apps environment: `cae-abarva-scale-lab-eastus`
- Temporary manual job: `job-p8-probe`
- Runtime identity: `id-abarva-scale-runtime-lab-eastus`
- Database secret: `azure-postgres-control-database-url`
- Probe runtime: Node `v24.16.0`; `pg` module present; `DATABASE_URL` projected.

Observed `to_regclass` results:

| Required object | Result |
|---|---|
| `public.clients` | `clients` |
| `public.engagements` | `engagements` |
| `public.instrument_templates` | `null` |
| `public.instrument_template_versions` | `null` |
| `public.instrument_template_review_state` | `null` |
| `public.instrument_template_audit` | `null` |
| `public.discovery_instruments` | `null` |

Client rows are present for Apex Retail, First Capital, and Meridian Health. An Apex move row is present (`637530a8-6302-424b-91d2-7adef902c87d`, `Store Associate Productivity`), but P8 cannot attach discovery instruments because the assignment table is absent.

## Missing Prerequisites

Required migrations/tables missing from the target runtime DB:
- `supabase/migrations/20260523100000_instruments_data_layer.sql`
  - `public.instrument_templates`
  - `public.instrument_template_versions`
  - `public.instrument_template_review_state`
  - `public.instrument_template_audit`
- `supabase/migrations/20260523090000_client_extension_it_productivity.sql`
  - `public.discovery_instruments`

## Blocked Acceptance Items

The following P8 acceptance items cannot run until the schema exists:
- Create 12 instrument records at `status='published'`.
- Run depth-lint against the instrument records through the P4 publish path.
- Render/download samples from the P4 `/api/instruments/[id]/download` route.
- Surface all 12 records on the per-Move Discovery Kit page.

## Required Unblock

Apply the missing P4/P2 migrations to the same Azure Postgres runtime DB used by `ca-abarva-web-lab-eastus`, then rerun P8 authoring through the P4 instrument data layer.
