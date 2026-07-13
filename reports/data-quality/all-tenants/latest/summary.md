# All-Tenant Data Quality And Coverage Audit

Generated: `2026-07-13T04:51:33.512Z`

This is a read-only audit. It does not write production tenant data, update
Active Tenant Access, promote candidates, write physical tables, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Rollup

- Tenants scanned: 7
- Source-rich / candidate-thin tenants: 6
- False-green risk tenants: 4
- Relationship gap tenants: 7
- Promotion-unsafe tenants: 7
- Generated-data watch tenants: 6
- Tenant-isolation failures: 0

## Tenant Quality Matrix

| Tenant | Overall | Source score | Source rows | Candidate coverage | Candidate records | Relationship ops | Source-rich thin | Promotion unsafe |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| skyharbor-air | blocked | 100 | 31213 | 0.2% | 53 | 0 | yes | yes |
| lakeshore-holdings | blocked | 82 | 8721 | 0.0% | 0 | 0 | yes | yes |
| meridian-health | blocked | 100 | 11226 | 0.0% | 0 | 0 | yes | yes |
| first-capital | blocked | 70 | 14576 | 0.0% | 0 | 0 | yes | yes |
| apex-retail | blocked | 100 | 10388 | 0.0% | 0 | 0 | yes | yes |
| northstar | blocked | 100 | 6032 | 0.0% | 0 | 0 | yes | yes |
| morgan-street | blocked | 0 | 0 | 0.0% | 0 | 0 | no | yes |
