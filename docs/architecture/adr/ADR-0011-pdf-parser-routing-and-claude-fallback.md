# ADR-0011 - PDF Parser Routing and Claude Fallback

## Status

Accepted

## Date

2026-06-03

## Context

Backlog row T188 asks AbarVa to skip Claude native PDF processing in
production paths and treat it as a fallback only.

The repository already has several relevant, verified boundaries:

- `docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md` requires
  context ingestion to be template-first, consent-gated, quarantine-capable,
  and parsed with native Azure capability or an approved parser.
- `docs/runbooks/azure-blob-upload-pattern.md` defines direct-to-Azure Blob
  upload for one client and one client only, with scan-before-parse and
  quarantine-before-indexing rules.
- `src/lib/programs/evidence-ingestion.ts` contains the older Programs
  attachment extraction path. Its current PDF parser is `pdf-parse`, not a
  Claude native PDF call.
- `src/lib/programs/doc-parser.ts` is the thin Programs facade over the same
  local parser path and writes chunks with a tenant key.
- `src/lib/integrations/ai-egress/anthropic-direct.ts` is the audited
  Anthropic text egress adapter. It should remain a reasoning/synthesis path,
  not a raw PDF parser by default.
- `src/lib/context-ingestion/template-registry.ts`,
  `src/lib/context-ingestion/file-classifier.ts`, and
  `src/lib/context-ingestion/validation-engine.ts` define the template,
  classification, and validation surfaces for the future admin data-load
  workflow.
- `package.json` includes `pdf-parse`, which supports local PDF text
  extraction for existing attachment ingestion.

This ADR is an architecture-control decision. It does not implement Azure
Document Intelligence, a parse cache, the admin loader UI, or a live private
data-plane processing run.

## Decision

Production PDF ingestion must not send full uploaded PDFs to Claude as the
primary parser.

The parser routing order for production paths is:

1. Template and metadata validation before parsing.
2. Client data-plane landing, malware scan, sensitive-data screening, and
   quarantine decision.
3. Azure Document Intelligence or another approved parser that preserves page,
   table, section, confidence, and provenance metadata.
4. Parser-cache reuse when the same client, binary hash, template version,
   parser version, and policy version match.
5. Operator-reviewed fallback parser when the primary parser cannot handle the
   document.
6. Claude native PDF only as an explicit last-resort fallback, never as the
   silent default.

Claude native PDF fallback requires all of these controls:

- A human operator or client admin approves the fallback for that one client
  and that one processing run.
- The file has passed malware, sensitive-data, and policy classification gates,
  or the operator has recorded an approved exception path that still prevents
  indexing until review.
- The approval records why the approved parser was insufficient.
- The request is sent through the audited model-egress boundary with tenant
  scope, data classification, artifact id, and workflow metadata.
- The response is treated as uncommitted extraction evidence until a human
  approves the resulting facts, mappings, or chunks.
- The processing ledger records parser choice, model, cost class, reviewer,
  approval, warnings, and provenance.

Claude native PDF may be used for synthetic development fixtures, internal
demo artifacts, or explicitly approved raw-mode exception work. Those uses
must not create a production-default path for uploaded client PDFs.

## Consequences

- Client documents remain inside the client data-plane processing posture by
  default instead of being routed straight to a model provider.
- Azure Document Intelligence and approved deterministic parsers remain the
  primary path for PDF layout, tables, pages, and confidence metadata.
- Model reasoning remains available after extraction, but the model reasons
  over approved context and provenance rather than owning raw document parse.
- Operators get a controlled escape hatch for unusual PDFs, but the escape
  hatch is auditable and cannot silently populate retrieval indexes.
- T184, T185, T186, and T199 remain separate backlog items: Azure parser
  integration, parse-cache reuse, fallback parser evaluation, and raw-mode
  exception handling are not completed by this ADR.

## Alternatives

### Use Claude Native PDF as the Default Parser

Rejected. It weakens data custody, cost predictability, parser provenance, and
pre-indexing policy controls for client documents.

### Ban Claude Native PDF Completely

Rejected. Some unusual low-risk or explicitly approved documents may need a
last-resort extraction path during pilot hardening.

### Use `pdf-parse` for Every Production PDF

Rejected as the sole production answer. `pdf-parse` is useful for the older
Programs attachment path and simple text extraction, but it is not sufficient
as the canonical enterprise parser for layout-heavy PDFs, tables, forms,
confidence scoring, or document-intelligence provenance.

### Parse First and Review Later

Rejected. ADR-0008 requires sensitivity, policy, and template checks before
content enters indexes, retrieval, evidence ledgers, or generated
deliverables.

## References

- `docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md`
- `docs/runbooks/azure-blob-upload-pattern.md`
- `src/lib/programs/evidence-ingestion.ts`
- `src/lib/programs/doc-parser.ts`
- `src/lib/integrations/ai-egress/anthropic-direct.ts`
- `src/lib/context-ingestion/template-registry.ts`
- `src/lib/context-ingestion/file-classifier.ts`
- `src/lib/context-ingestion/validation-engine.ts`
- `package.json`
