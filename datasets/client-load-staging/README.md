# Client Load Staging

This area stages client evidence before it is loaded into the enterprise context layer. It is intentionally split into raw uploads, normalized templates, and load receipts so nobody collapses "file received" into "context loaded."

## Standard Folder Contract

Each client folder follows this shape:

- `00_manifest/` - intake manifest, source catalog, sensitivity notes, and load plan.
- `01_public_company_evidence/` - annual reports, quarterly earnings, investor decks, conference transcripts, public KPIs, risk disclosures.
- `02_strategy_and_finance/` - board packs, operating plans, budgets, segment P&L, capital allocation, KPI workbooks.
- `03_org_and_operating_model/` - org charts, role inventories, team topology, RACI, capacity models, location/site maps.
- `04_it_systems_landscape/` - application inventory, CMDB exports, system ownership, hosting model, software/function budget.
- `05_architecture_infrastructure/` - data center/private cloud/public cloud topology, x86/Linux/Windows/mainframe estate, network/security diagrams, DR architecture.
- `06_data_and_integration/` - data platform inventories, lineage exports, integration topology, API/file/batch/event flows, data volumes.
- `07_security_risk_compliance/` - controls, audit findings, risk registers, regulatory obligations, cyber evidence, DR tests.
- `08_vendors_contracts_sourcing/` - contracts, renewal calendars, scorecards, RFPs, pricing, SLAs, termination/exit terms.
- `09_operations_service_management/` - incidents, changes, problems, SLAs, observability reports, service reviews, DORA/DevEx.
- `10_ai_data_science_automation/` - AI tool footprint, model inventory, governance decisions, usage telemetry, automation candidates.
- `11_customer_product_market/` - customer/product metrics, journey analytics, NPS, demand, sales/service volumes.
- `12_ad_hoc_raw_uploads/` - anything useful that does not yet fit the structured folders.
- `90_normalized_templates/` - cleaned CSV/JSON/XLSX templates ready for loader mapping.
- `99_load_receipts/` - evidence that the file was accepted, parsed, committed, embedded, indexed, and retrieval-proven.

## Ad Hoc Format Rule

PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX, images, exported HTML, email archives, logs, and ZIP packages are allowed as raw evidence. They are not "loaded facts" until a parser extracts cited rows/chunks with page/slide/sheet/cell/section provenance and the live app can retrieve them tenant-safely.

## Minimum Receipt States

Report these separately:

- Local artifact received
- Sensitivity/preflight passed
- Loader/API accepted upload
- Object storage staged source file
- Parser extracted cited facts/chunks
- Review queue received low-confidence records
- Context rows committed to tenant data plane
- Embeddings/search refreshed
- Insights evaluated where applicable
- Signed-in retrieval/QA proved usability
