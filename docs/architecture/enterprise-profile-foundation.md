# Enterprise Profile Foundation

Status: governed data-domain standard.

Enterprise Profile is a required tenant data domain. It is not a Home feature and it is not executive narrative text. Home, aVa, Intelligence, Moves, Source, and Tower may derive presentation from Enterprise Profile, but the source truth must be parsed into governed canonical records first.

## Required Flow

```text
enterprise profile source/template
-> source parsing and placeholder rejection
-> canonical profile records
-> profile gaps and caveats
-> source lineage
-> Home/aVa consumption readiness
```

This flow is non-destructive until an explicitly governed candidate/promotion path writes or activates data.

## Required Fields

Every active tenant profile source must include:

- tenant and display identity
- legal name
- industry and sub-industry
- headquarters
- revenue, revenue basis, and as-of period
- employee count and basis
- global locations or operating footprint
- business model
- business segments
- mission statement or operating purpose
- vision statement or strategic ambition
- leadership roles
- strategic priorities
- source file
- source as-of date
- source validation status
- known gaps

## Canonical Objects

The foundation builder emits canonical records such as:

- `tenant_profile`
- `business_segment`
- `business_model_component`
- `strategic_priority`
- `leadership_role`
- `location`
- `mission_statement`
- `vision_statement`
- `profile_gap`

These records belong in the governed canonical data path. Executive prose is derived later and must not be stored as source truth.

## Placeholder Rule

Placeholder values do not pass as facts. The parser rejects values such as:

- `not_loaded`
- `unknown`
- `TBD`
- `to be determined`
- `N/A`
- `sample`
- `lorem ipsum`
- `placeholder`

Missing or placeholder fields become profile gaps with source/caveat metadata.

## Active Tenant Scope

Active tenants are derived from `CANONICAL_TENANTS`. Northstar is explicitly retired/excluded from this active processing lane and must appear as excluded in audit evidence rather than silently disappearing.

## Proof Artifacts

The audit command writes:

```text
reports/enterprise-profile-foundation/latest/
  summary.md
  summary.json
  tenant-profile-source-inventory.json
  parsed-enterprise-profile-records.json
  canonical-profile-records.json
  placeholder-rejection-report.json
  profile-gaps.json
  source-lineage.json
  home-ava-consumption-readiness.json
  all-tenant-profile-audit.html
```

## Guardrails

- No production tenant data writes.
- No Active Tenant Access Layer update.
- No candidate promotion.
- No module runtime consumption change.
- Synthetic facts remain planning/demo grade unless client evidence promotes their status.
