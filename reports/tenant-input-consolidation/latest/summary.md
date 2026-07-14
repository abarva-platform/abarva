# Tenant Input Consolidation

Generated: 2026-07-14T15:50:16.430Z

## Outcome

- Active tenants processed: 6
- Universal files per active tenant: 19
- Legacy/versioned active files remaining: 0
- Nested active packet directories remaining: 0
- Northstar processed: false
- Production tenant data written: false

## Before / After

| Tenant | Before active CSV files | After active CSV files | Before domain duplicates | After domain duplicates |
| --- | --- | --- | --- | --- |
| Apex Retail | 17 | 19 | 0 | 0 |
| First Capital Financial | 17 | 19 | 0 | 0 |
| Lakeshore Holdings | 19 | 19 | 0 | 0 |
| Lakeshore Industries | 52 | 19 | 19 | 0 |
| Meridian Health | 60 | 19 | 16 | 0 |
| SkyHarbor Air | 57 | 19 | 18 | 0 |

## Meridian Applications & Systems

| Before file | Rows |
| --- | --- |
| datasets/tenant-inputs/archive/meridian-health/consolidated-20260714/current-state-pack/templates/V6_05_applications_systems.csv | 15 |
| datasets/tenant-inputs/archive/meridian-health/consolidated-20260714/current-state-pack/v7/V7_05_applications_systems.csv | 15 |
| datasets/tenant-inputs/archive/meridian-health/consolidated-20260714/rich-enterprise-pack/templates/V6_05_applications_systems.csv | 162 |

| After file | Rows |
| --- | --- |
| datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv | 116 |

## Data Layer Truth Split

- This PR consolidates active source inputs and rebuild artifacts.
- It does not write production tenant data.
- It does not change module runtime behavior.
- Active module-context promotion remains report-backed metadata unless a later data-build job writes physical tables.

