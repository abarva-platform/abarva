# Independent Semantic Audit Report

Tenant: `healthcare-demo-new`  
Package: `healthcare-demo-new-source-corpus-v1.0.0`  
Status: PASS

## Decision

The review package clears the semantic hold gate for design-package review. It is still not an Azure/Postgres load, parser result, product read model, or live UI proof.

## Audit Results

| Gate | Result | Evidence |
|---|---:|---|
| Multi-origin relationship graph | PASS | 85,000 relationship candidates across 12 origin object types. Applications account for 21.6% of origins, below the 30% ceiling. |
| Endpoint integrity | PASS | 0 broken relationship endpoints. |
| Commercial contract depth | PASS | Contract records include service tower, business scope, dates, pricing model, termination rights, commitments, rate-card, SLA, invoice, change-order, BAFO and evaluation references. |
| Source evidence families | PASS | Structured proposal, requirements, responses, facts, pricing, rate-card, staffing, invoice, change-order, incident, SLA, assumption, exception, BAFO, commitment, evaluation and decision files are present. |
| Bidder/event coverage | PASS | 9 proposal lots and 3 materially different bidders. |
| Reconstructability | PASS | 425 reconstruction-ledger rows, including 365 required-for-publication objects and 38 intentional non-reconstructable review cases. |

## Relationship Origin Mix

| Origin object type | Relationship candidates |
|---|---:|
| application | 18,320 |
| data_product | 9,485 |
| interface | 8,400 |
| contract | 7,435 |
| risk | 5,765 |
| program | 5,645 |
| business_process | 5,024 |
| vendor | 4,986 |
| infrastructure | 4,985 |
| kpi | 4,985 |
| control | 4,985 |
| sql_asset | 4,985 |

## Scale Snapshot

| Domain | Rows |
|---|---:|
| Applications/platforms | 1,670 |
| Epic module/environment records | 115 |
| Interfaces/data feeds | 8,400 |
| SQL Server databases/marts/assets | 2,050 |
| Infrastructure/cloud records | 12,500 |
| Data products/stores | 1,500 |
| BI reports/dashboards | 8,600 |
| Vendors | 480 |
| Contracts/SOWs | 980 |
| Technology workforce records | 11,200 |
| Programs | 220 |
| Risks | 780 |
| Controls | 2,500 |
| KPIs | 650 |
| Relationships | 85,000 |
| Reconstruction-ledger rows | 425 |

## Boundary

This audit proves the generated review package no longer has the prior failure mode of high row counts with an application-only graph, broken endpoints, thin contract evidence or unproven reconstructability. It does not approve any data-plane load or product publication. The next gate is human review of the package and source-corpus design.

