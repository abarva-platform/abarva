# Apex Retail Synthetic Data Pack v1

Packet 18 scaffold for Apex Retail Group. This slice establishes the core portfolio and verification spine used by later onboarding ingestion work.

## Included in this scaffold

- `01-portfolio/application-portfolio.csv`: 120 application rows. The first 30 rows are grounded in the founder-provided reference file and preserve the seven seeded scenarios verbatim.
- `01-portfolio/integration-topology.json`: 320 directed edges. `EDGE-001` through `EDGE-050` are preserved from the reference file.
- `99-verification/expected-sentinel-answers.json`: the unmodified 12-question Sentinel verification target.
- `99-verification/expected-row-counts.json`: row-count contract for this scaffold.

## Not yet included

This is not the full 160-file Packet 18 pack. Vendor contracts, DORA baselines, corpus chunks, PDFs, onboarding upload pipeline, and live Sentinel execution harness land in later PR-sized slices.
