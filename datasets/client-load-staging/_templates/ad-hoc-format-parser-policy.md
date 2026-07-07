# Ad Hoc Format Parser Policy

Accept messy enterprise evidence, but keep the state honest.

## Supported Raw Formats

- PDF: annual reports, board packs, contracts, audit reports, architecture exports.
- PPT/PPTX: investor decks, org charts, architecture diagrams, program readouts, steering committee packs.
- DOC/DOCX: memos, policies, strategy notes, vendor summaries, operating procedures.
- XLS/XLSX: budgets, CMDB exports, KPI workbooks, renewal calendars, cost models, capacity models.
- CSV/TSV: system inventories, incidents, changes, tickets, cost exports, integration lists.
- JSON/JSONL/YAML: structured exports, model inventories, telemetry, context chunks.
- Images: architecture diagrams, network diagrams, org charts, screenshots, scanned pages.
- HTML/MHTML: exported reports, internal dashboards, public investor pages.
- Email/archive exports: only after sensitivity review; extract metadata and cited snippets, not raw private mail by default.
- ZIP: allowed only as a package container when the manifest enumerates each file. Server-side unzip is not assumed unless implemented by the loader.

## Parser Expectations

- PDF: cite page and section.
- PPT/PPTX: cite slide number and shape/text block when possible.
- DOC/DOCX: cite heading/paragraph/table.
- XLS/XLSX: cite sheet, row, column, and cell range.
- CSV/JSON/JSONL/YAML: cite row/object id.
- Images: cite file, page/slide if embedded, and OCR region if extracted.

## Promotion Rule

Unstructured documents should default to review-required unless a deterministic parser exists for that source type. Structured CSV/JSON can commit directly only after schema validation, tenant/client id validation, and sensitivity checks.
