# Northstar Context Layer Template Catalog

Each dimension lists the business questions unlocked, required templates,
validation posture, steward, refresh cadence, target context shape, and product
surfaces that consume approved facts.

## Enterprise Profile

- Templates: enterprise-profile.yaml
- Business questions unlocked: What is Northstar and what is its scale?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CEO Chief of Staff
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Financial KPIs

- Templates: financial-kpi-workbook.xlsx
- Business questions unlocked: Where is the fastest path to $250M margin expansion?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CFO FP&A
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Annual / Quarterly Reports

- Templates: annual-report.pdf, qbr-board-pack.pdf
- Business questions unlocked: Which claims come from official reporting?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: Investor Relations
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Market / Competitor Intel

- Templates: market-signals.csv, competitor-benchmark.md
- Business questions unlocked: Which market pressures change the decision?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: Chief Commercial Officer
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## C-Suite Strategy

- Templates: strategy-memo.docx, board-priorities.xlsx
- Business questions unlocked: What does the board actually want?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CEO Chief of Staff
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Business Units / Segment P&L

- Templates: segment-pnl-workbook.xlsx
- Business questions unlocked: Which segments fund or block the case?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CFO FP&A
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Product Portfolio

- Templates: product-portfolio.csv
- Business questions unlocked: Which products should be rationalized?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: Chief Product Officer
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Manufacturing / Sites

- Templates: site-and-plant-inventory.csv
- Business questions unlocked: Which plants have quality-cost automation value?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: COO
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## ERP Landscape

- Templates: erp-landscape-workbook.xlsx
- Business questions unlocked: Should Northstar accelerate S/4?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CIO ERP Transformation
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## CMDB / Application Portfolio

- Templates: application-portfolio.csv
- Business questions unlocked: What systems do we have and which matter?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: VP Enterprise Architecture
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Integration Topology

- Templates: integration-topology.json
- Business questions unlocked: What blocks retiring an app?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: VP Enterprise Architecture
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Vendor Contracts

- Templates: vendor-contracts.csv + PDFs
- Business questions unlocked: Which contracts should Source renegotiate?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: VP Procurement
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Transformation Initiatives

- Templates: initiative-portfolio.xlsx
- Business questions unlocked: Which initiatives should we kill, restructure, or accelerate?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: Transformation PMO
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Org / Roles / Teams

- Templates: org-roles.csv, team-topology.csv
- Business questions unlocked: Who owns the decision and blocker chain?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: CHRO
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Delivery / DORA / DevEx

- Templates: dora-baseline.csv
- Business questions unlocked: How healthy are engineering teams?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: VP Engineering
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Regulatory / QMS / Risk

- Templates: qms-events.csv, audit PDFs, CAPA exports
- Business questions unlocked: Where is the FDA/QMS evidence weakness?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: Chief Quality Officer
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## AI Tooling / Model Inventory

- Templates: ai-tool-footprint.csv, model-inventory.csv
- Business questions unlocked: Which AI workflows are regulated or risky?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: AI Governance Lead
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

## Incidents / Ops Telemetry

- Templates: incidents.csv, change-history.csv
- Business questions unlocked: Where does operational risk alter sequencing?
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: VP IT Operations
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.

