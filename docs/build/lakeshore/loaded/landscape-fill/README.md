# Lakeshore landscape-fill — data/analytics (L4) + infrastructure (L5)

These two canonical CSVs close the gaps found by the **Lakeshore comprehensiveness
review (2026-06-08)**: the synthetic generator (`generate-synthetic-context.ts`)
modelled apps, org, financials, vendors, and initiatives, but had **no dedicated
data/analytics-stack segment and no infrastructure layer at all** — so
"what is our data/analytics stack?" and "what is our infrastructure estate?"
returned nothing.

## What's here

- `lakeshore-data-analytics.csv` (16 rows) — L4 data & analytics stack, grounded
  in the real opco platforms (Snowflake, Power BI, Anaplan, Kyriba analytics,
  Salesforce Marketing/Commerce intelligence, Amplitude, SQL Server DWs).
- `lakeshore-infrastructure.csv` (18 rows) — L5 infrastructure estate
  (datacenters, VMware vSphere, hyperconverged, NetApp/Pure storage, Cisco
  network, Azure/AWS cloud accounts, Entra ID), per opco.

Entities = the canonical cast: **Holdco** (Meera Rao CIO / Daniel Whitaker CFO)
+ **Northline**, **Brightmark**, **Forge & Field**, **Great Lakes Pantry**.

## How they were loaded

Loaded live into the `lakeshore-holdings` tenant via the Admin Loader
(preserve → Claude map → Steward → governed commit) on 2026-06-08. The
data/analytics file maps to dimension `data_analytics_stack` (→ `data_estate`
segment); the infrastructure file maps to `infrastructure_estate`
(→ `infrastructure` segment). These two **dedicated segments** were added in the
same change so the layers retrieve from clean segments instead of being starved
inside the overloaded `it_landscape` segment.

## Review findings (for the record)

- **Before**: `chunks=1329, records=0, facts=0, source_files=0` — chunk-only,
  no structured fact layer or Gate-0 provenance.
- **Gaps**: L4 data/analytics (0 sources), L5 infrastructure (0 sources),
  risks/controls thin.
- **Dual-cast resolved**: the loaded/canonical cast is Rao/Whitaker +
  Northline/Brightmark/Forge&Field/Great Lakes Pantry. A separate moves-design
  brief uses a stale, inconsistent roster (Lindqvist/Okonkwo/Morgan Street) —
  that brief is the outlier and should be corrected, not the canonical data.
- **Still open** (out of scope here): the structured fact layer + provenance
  (records/facts/source_files = 0) remains a chunk-only gap; the embed pipeline
  (`embed-pending-chunks`) is Supabase-legacy and not Azure-wired (not blocking,
  since retrieval is Postgres full-text, not vector).
