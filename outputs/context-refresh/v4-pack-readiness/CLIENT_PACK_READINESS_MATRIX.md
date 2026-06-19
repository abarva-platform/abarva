# Client V4 Load Pack Readiness Matrix

Generated: 2026-06-18T00:00:00Z

## Gate Status

Local artifact generation is complete. This is not a database load. No Azure
truncate, Blob staging, parser worker, embedding refresh, or signed-in retrieval
claim is made by this report.

Loader dry-run preflight has passed against the actual refresh worker. Azure truncate/load should happen only after this matrix and the dry-run output are reviewed.

Dry-run evidence: `outputs/context-refresh/pilot-load-v4-2026-06-18T22-02-44/loader-dry-run-result.txt`

## Density Standard

- SkyHarbor must be the deepest pack because it represents an ~$80B global airline
  with mainframe, SAP, Teradata Vantage on AWS, data lake integrations, complex
  operations, and a large AI/digital investment agenda.
- First Capital remains high density for the financial-services demo.
- Meridian, Lakeshore, and Apex are medium to medium-high density packs with enough
  depth to support Intelligence, Tower, and Moves without pretending to match the
  airline estate.

## Final V4 Volumetric

| Client | Density | Context Rows / Target | Graph Edges / Target | Apps | Integrations | Vendors | Data Products | Initiatives | Tower Rows | Source Docs | Corpus Patterns | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| SkyHarbor Air | very_high | 6,083 / 5,200 | 5,200 / 5,200 | 900 | 1,800 | 320 | 420 | 120 | 882 | 10 docs / 3,230 words | 9 | DRY-RUN PASSED |
| First Capital Financial | high | 2,220 / 1,800 | 1,800 / 1,800 | 260 | 320 | 120 | 140 | 90 | 675 | 6 docs / 2,216 words | 6 | DRY-RUN PASSED |
| Meridian Health | medium_high | 1,532 / 1,150 | 1,000 / 1,000 | 150 | 240 | 95 | 120 | 72 | 259 | 5 docs / 1,735 words | 6 | DRY-RUN PASSED |
| Lakeshore Industries | medium | 1,342 / 1,000 | 850 / 850 | 130 | 200 | 90 | 105 | 62 | 201 | 5 docs / 1,709 words | 5 | DRY-RUN PASSED |
| Apex Retail | medium | 1,649 / 1,250 | 1,000 / 1,000 | 170 | 260 | 100 | 125 | 75 | 261 | 6 docs / 2,693 words | 6 | DRY-RUN PASSED |

## State Truth

- Local artifact generated: yes
- Local parse/preflight passed: yes (`outputs/context-refresh/pilot-load-v4-2026-06-18T22-02-44/loader-dry-run-result.txt`)
- Product loader/API accepted upload: no
- Azure Blob/object storage staged originals: no
- Queue/private worker handoff: no
- Parser extracted text/tables/facts with citations: no
- Review/approval queue populated: no
- Context rows/facts/chunks committed to client data plane: no
- Embeddings/search index refreshed: no
- Live signed-in retrieval or answer QA: no
