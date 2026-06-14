# Client Evidence Handling

Status: scaffold-ready, not executed

Evidence includes uploaded files, extracted rows, parsed text, source citations, generated artifacts, Move artifacts, Source event artifacts, and context bundle traces.

## Handling Rules

- preserve original files in Azure Blob with tenant/client/environment scope
- register source files in Postgres metadata
- preserve source location evidence: file, page, sheet, row, slide, table, or cell where available
- store derived records, facts, chunks, and artifacts with client id and tenant key
- keep stale/superseded facts out of the default current view
- block duplicate active facts
- keep not_reviewed, blocked, and quarantined rows out of model context
- include citations and source basis in promoted context bundles

## Review Rules

XLSX, PDF, DOCX, and PPTX extraction requires deterministic template mapping or review-required status. PHI is not accepted. PII is not accepted unless future policy explicitly changes.
