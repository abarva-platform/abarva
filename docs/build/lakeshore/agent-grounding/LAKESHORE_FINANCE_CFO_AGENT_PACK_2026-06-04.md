# Lakeshore Finance and CFO Agent Pack

## Purpose

This pack tells AbarVa agents how to use Lakeshore finance context without pretending that reusable CFO patterns are tenant facts. It is a grounding supplement for Atlas, Nexus, Sentinel, and Steward until the governed load ledger is merged and the live Lakeshore data-plane commit is complete.

## What Is Inside The Corpus

The Lakeshore tenant bundle already includes finance-facing files for:

- `financial-kpi-workbook.csv`: revenue, EBITDA, cash conversion, working-capital, and value-realization metrics by holding company and operating company.
- `segment-pnl.csv`: segment-level revenue, gross margin, operating margin, and capex by operating company and quarter.
- `initiative-portfolio.csv`: Kyriba, ERP harmonization, modernization, vendor consolidation, DORA, QMS, and AI-governance initiatives with owner, value, risk, stage, and decision status.
- `vendor-contracts.csv` plus generated contract PDFs: treasury, ERP, SI, data-platform, security, and logistics-platform agreements.
- `annual-quarterly-reports.csv` and generated board/quarterly documents: CFO narrative, board update, segment performance, and value-at-risk evidence.

In plain English: the corpus gives the CFO a synthetic but realistic holding-company view of money, risk, vendors, projects, and operating-company variance. Agents may summarize this information only when they can cite the loaded Lakeshore file family.

## CFO Questions Agents Should Answer

Atlas should answer:

- Which operating companies carry the highest value-at-risk?
- Which initiatives should Daniel Whitaker review before the next board readout?
- Which vendor or SI contracts are most material to CFO approval?
- What is loaded evidence versus a reusable CFO pattern?

Nexus should answer:

- What Move should be opened for Kyriba value realization?
- What gates, owners, and approvals are needed before a treasury rollout advances?
- Which rate-card assumptions are benchmark fallbacks versus client-specific rates?

Sentinel should answer:

- Which claims are supported by loaded Lakeshore finance files?
- Which CFO recommendations are pattern-based and need tenant evidence before use?

Steward should answer:

- Which data files are loaded, dry-run only, pending approval, or missing?
- Which finance files should be reloaded or reviewed offline before agent availability?

## Dataflow

1. Data files are generated into `docs/build/lakeshore/loaded/data/` and documents into `docs/build/lakeshore/loaded/documents/`.
2. The governed loader parses CSV/XLSX/PDF/DOCX/PPTX files and records run evidence.
3. Approved chunks are committed to the tenant context layer for `clientId=lakeshore` and `tenantKey=lakeshore-holdings`.
4. Embeddings make approved chunks retrievable by agent prompts.
5. Product pages read through brokers, not direct database access.
6. Agents cite the file family, loaded status, and whether the answer is tenant evidence or reusable pattern guidance.

## Hallucination Controls

- Do not treat finance benchmarks as Lakeshore results.
- Do not claim realized savings unless a loaded Lakeshore row says realized or measured.
- Do not use Morgan Street, HAVI, tms, Continental, or Stanley as real client data; Lakeshore is a synthetic analog.
- If a question needs a missing ledger, say the governed load ledger is pending PR #2997.
- If the CFO asks for a committed financial view before live commit, say it is a dry-run or generated-review view.

## Example Grounded Answer Pattern

Question: "Which initiative should I focus on first as CFO?"

Good answer shape:

"Based on Lakeshore's loaded initiative and finance workbook families, Kyriba treasury rollout is the first CFO decision because it links cash visibility, bank connectivity, FX controls, and SI delivery risk. This is tenant-bundle evidence, not a live production commit yet. Before treating it as committed context, the governed load ledger and Data Trust verification must pass."

Bad answer shape:

"Lakeshore has already realized $12M from Kyriba." This is not allowed unless a loaded, committed row supports the realized value.
