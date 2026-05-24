# Apex Retail Synthetic Data Pack v1

Packet 18 scaffold for Apex Retail Group. This pack establishes the core portfolio, document, and retrieval substrate used by later onboarding ingestion work.

## Included

- `01-portfolio/application-portfolio.csv`: 120 application rows. The first 30 rows are grounded in the founder-provided reference file and preserve the seven seeded scenarios verbatim.
- `01-portfolio/integration-topology.json`: 320 directed edges. `EDGE-001` through `EDGE-050` are preserved from the reference file.
- `01-portfolio/initiatives-active.csv`: 30 active initiatives with Sentinel posture.
- `01-portfolio/initiatives-closed.csv`: 12 closed initiatives for calibration.
- `02-financial/`: run cost, renewal calendar, initiative commitments, capex/opex, workbook summary JSON, and two valid Excel workbooks.
- `03-org/`: 14-team topology, 1,420-role inventory, leadership bench, and spans of control.
- `04-vendors/`: 45 vendor contracts, 12 infrastructure/managed-service contracts, vendor scorecards, and 30 synthetic contract PDFs for document extraction tests.
- `05-dora/`: six-week DORA baseline, 84 observations total.
- `06-devex/`, `07-ai-tools/`, `08-sponsor-signal/`, `10-incidents-changes/`, `11-regulatory/`, `12-benchmarks/`: supporting substrate for productivity, sponsor, risk, regulatory, and benchmark reasoning.
- `09-charters/charter-pdfs/`: 10 synthetic Wave 0 charter PDFs mapped to active initiatives.
- `13-context/enterprise-context-source-files.csv`: 42 Discovery Kit source-file records targeted at `enterprise_context_source_files`.
- `13-context/client-data-corpus.jsonl`: 280 tenant-grounded retrieval chunks targeted at `enterprise_context_chunks`.
- `99-verification/expected-sentinel-answers.json`: the unmodified 12-question Sentinel verification target.
- `99-verification/expected-row-counts.json`: row-count contract for this scaffold.

## Not yet included

The static data pack is now materially complete for portfolio, financial, vendor, document, and retrieval-substrate simulation. Onboarding upload/parse/validate/confirm/store pipeline, DB ingestion, and live Sentinel execution harness land in later PR-sized slices.
