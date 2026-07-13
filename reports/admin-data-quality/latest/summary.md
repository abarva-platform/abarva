# Admin Data Quality Control Center

Generated: `2026-07-13T04:51:33.512Z`

This is an Admin-only, read-only control-center proof. It does not write
production tenant data, promote a candidate, update Active Tenant Access, or
change module runtime behavior.

## Rollup

- Tenants shown: 7
- Source-rich / candidate-thin tenants: 6
- False-green risk tenants: 4
- Relationship gap tenants: 7
- Promotion-unsafe tenants: 7
- Generated-data watch tenants: 6

## Quality Matrix

| Tenant | Overall | Source score | Candidate coverage | Relationship ops | Promotion | Top blocker |
| --- | --- | ---: | ---: | ---: | --- | --- |
| SkyHarbor Air | blocked | 100 | 0.17% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| Lakeshore Holdings | blocked | 82 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| Meridian Health | blocked | 100 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| First Capital | blocked | 70 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| Apex Retail | blocked | 100 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| Northstar | blocked | 100 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |
| Morgan Street | blocked | 0 | 0.00% | 0 | blocked | Expand candidate packet so canonical records materially cover the discovered source estate. |

## Guardrails

- Production tenant data written: false
- Active Tenant Access updated: false
- Candidate promoted: false
- Module runtime changed: false
- Module reads candidate by default: false
- Realized value claimed: false

## Validation Findings

- P0: None
- P1: None
- P2: None
