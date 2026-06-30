# V6 Tenant Pack Validation

Generated: 2026-06-30T22:56:00.433Z

Status: PASS

## Summary

- Tenants: 5
- Required V6 templates per tenant: 16
- Failures: 0

| Tenant | Source Tenant Key | Files | Rows | Data-Thin Cells | Blank Cells |
| --- | --- | ---: | ---: | ---: | ---: |
| apex-retail | apex-retail | 16 | 3589 | 11537 | 0 |
| first-capital-financial | first-capital | 16 | 5609 | 21266 | 0 |
| lakeshore-industries | lakeshore | 16 | 2544 | 9487 | 0 |
| meridian-health | meridian-health | 16 | 3439 | 12729 | 0 |
| skyharbor-air | skyharbor-air | 16 | 14453 | 66466 | 0 |

## Failures

None

## Interpretation

Data-thin cells are expected in this first generated pass. They are explicit evidence gaps, not blank cells. The next improvement loop should reduce data-thin counts by enriching V4 source files or adding V6-only source facts.
