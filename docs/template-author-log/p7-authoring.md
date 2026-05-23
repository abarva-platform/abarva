# P7 Template Authoring Log

Date: 2026-05-23

## Scope

Packet P7 authored the Wave 3 Move and Source workflow templates through the already-merged P3 template data layer. This packet did not introduce schema, runtime, auth, hosting, AI egress, or migration changes.

## Runtime Unblock

The Azure Postgres runtime DB initially lacked the already-merged P3/P4/P5 schema. Coordinator applied the merged dependency migrations from inside `ca-abarva-web-lab-eastus`:

- `20260523090000_client_extension_it_productivity.sql`
- `20260523100000_templates_data_layer.sql`
- `20260523100000_instruments_data_layer.sql`
- `20260523104500_workshops_data_layer.sql`

After that, P7 remained content-only.

## Published Templates

- `it-productivity`
- `data-foundation-for-ai`
- `ai-governance-policy`
- `app-portfolio-rationalization`
- `talent-strategy-ai-fluent-engineering-org`
- `mainframe-modernization`
- `source-ams-portfolio-optimization`
- `source-infra-ms-optimization`

## Evidence

- Published templates: 8
- Minimum template depth score: 10
- Gate count range: 5 to 11
- Total artifact rows: 92
- IT-Productivity includes Wave 0 alignment, sibling-move dependency check, T1/T2/T3 discovery, baseline, diagnose, operating model, tooling/governance, business case, mobilization, and operate gates.
- Apex Retail instantiation smoke created 1 `move_instances` row from `it-productivity` with a full gate skeleton and artifact completion map.

## Conventions

Tenant table convention is `clients`; FK convention is `client_id`. No `tenants` or `tenant_id` language was introduced.
