# Apex Retail Synthetic Data Pack v1

Packet 18 scaffold for Apex Retail Group. This slice establishes the core portfolio and verification spine used by later onboarding ingestion work.

## Included

- `01-portfolio/application-portfolio.csv`: 120 application rows. The first 30 rows are grounded in the founder-provided reference file and preserve the seven seeded scenarios verbatim.
- `01-portfolio/integration-topology.json`: 320 directed edges. `EDGE-001` through `EDGE-050` are preserved from the reference file.
- `01-portfolio/initiatives-active.csv`: 30 active initiatives with Sentinel posture.
- `01-portfolio/initiatives-closed.csv`: 12 closed initiatives for calibration.
- `02-financial/`: run cost, renewal calendar, initiative commitments, capex/opex, and workbook summary JSON.
- `03-org/`: 14-team topology, 1,420-role inventory, leadership bench, and spans of control.
- `04-vendors/`: 45 vendor contracts, 12 infrastructure/managed-service contracts, and vendor scorecards.
- `05-dora/`: six-week DORA baseline, 84 observations total.
- `06-devex/`, `07-ai-tools/`, `08-sponsor-signal/`, `10-incidents-changes/`, `11-regulatory/`, `12-benchmarks/`: supporting substrate for productivity, sponsor, risk, regulatory, and benchmark reasoning.
- `99-verification/expected-sentinel-answers.json`: the unmodified 12-question Sentinel verification target.
- `99-verification/expected-row-counts.json`: row-count contract for this scaffold.

## Not yet included

This is not the full 160-file Packet 18 pack. PDF mock contracts/charters, client corpus chunks, `data_sources`, XLSX binaries, onboarding upload pipeline, DB ingestion, and live Sentinel execution harness land in later PR-sized slices.
