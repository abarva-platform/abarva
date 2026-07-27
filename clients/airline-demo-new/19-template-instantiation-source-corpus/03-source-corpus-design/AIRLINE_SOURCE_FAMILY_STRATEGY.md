# Airline Source Family Strategy

Airline Demo New should not ask a client to produce one file per object. A realistic client collection uses source families that carry thousands of records in structured extracts, plus representative narrative documents where obligations, ambiguity and commercial leverage live.

| Source family | Example volume | Records carried | Why it matters |
|---|---:|---:|---|
| CMDB/application extracts | 3-5 files | 1,495 applications/platforms | Carries application ownership, hosting, stack, tower and contract linkage. |
| Integration/interface extracts | 3-4 files | 6,200 interfaces | Carries MQ/API/batch/event density and transition risk. |
| Cloud asset inventories | 4-6 files | 10,000 infra/cloud/mainframe rows | Carries AWS, Azure, private cloud, data-center, station edge and mainframe footprint. |
| Data-platform extracts | 4-6 files | 1,250 data products/stores | Carries Teradata-scale, cloud lakehouse, marts, data movement and lineage evidence. |
| BI/report catalogs | 2-4 files | 6,200 reports/dashboards | Carries stale reports, duplicates, KPI conflicts and executive-critical reporting. |
| Vendor/contract registers | 4-6 files | 420 vendors and 820 active contracts/SOWs | Carries vendor concentration, renewal risk and Source scope. |
| MSA/SOW documents | 50-100 representative documents | obligation families | Carries exit terms, SLAs, transition assistance, audit rights and exclusions. |
| Rate cards | 20-40 workbooks | role/rate/location rows | Carries pricing normalization and labor arbitrage evidence. |
| Invoice extracts | 12-24 monthly files | invoice lines | Carries baseline spend, change orders and volume/run-rate evidence. |
| ITSM incidents/tickets | 6-12 extracts | incident/service records | Carries operational pain and service-level evidence. |
| SLA reports | 12-24 reports | KPI/SLA observations | Carries target/actual/breach evidence. |
| Architecture documents | 20-40 documents | dependency narratives | Carries why dependencies matter and what cannot be transitioned blindly. |
| Strategy/roadmap documents | 10-20 documents | strategic context | Carries business outcomes and investment priorities. |
| Executive interviews | 12-18 interview transcripts | executive signals | Carries CIO, CTO, procurement, operations, data, finance and service-owner context. |
| Vendor proposals | 3 complete response packs | proposal facts | Carries differentiated vendor responses, pricing, assumptions and exceptions. |
| BAFO packs | 3 packs | revised offers | Carries negotiation response, risk movement and commercial improvement. |
| Evaluation artifacts | complete event set | scorecard/evidence | Carries decision traceability and board-ready tradeoffs. |

This strategy lets the hidden truth and parser-visible corpus reach large-enterprise scale without making the client fill thousands of isolated worksheets.
