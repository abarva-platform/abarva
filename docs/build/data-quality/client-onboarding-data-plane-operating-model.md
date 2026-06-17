# Client Onboarding Data Plane Operating Model

## Operating Assumption

For each new pilot client, AbarVa provisions two client-specific Azure subscriptions/environments plus a governed data landing zone. The landing zone exists before any evidence is uploaded. Setup/Admin should show the landing zone, templates, how-to guide, upload status, parser status, review queue, committed context counts, embedding/search status, and retrieval proof.

## What Gets Created During Client Setup

- Client tenant record and canonical `client_key` / `client_id`.
- Azure Blob containers or folder prefixes for raw uploads, normalized templates, parse outputs, review queues, and load receipts.
- Template pack bundle:
  - enterprise IT landscape templates
  - public company strategy evidence templates
  - source catalog and intake manifest
  - dimension coverage checklist
  - ad hoc parser policy
- README/how-to guide visible in Setup/Admin and downloadable from the landing zone.
- Empty load receipt ledger for the client.
- Parser policy defaults: structured CSV/JSON can map directly after validation; PDF/PPT/DOCX/XLSX default to review-required unless the parser is deterministic for that source type.

## Setup/Admin Visibility

The admin module should show a client onboarding workspace with these views:

- Landing Zone: Blob path, containers/prefixes, last upload, file counts by dimension, sensitivity warnings.
- Templates: approved templates, version, required/optional status, download links, example-free headers.
- Uploads: raw files received, file type, dimension, owner, classification, expected parser, current state.
- Parse Queue: parser selected, parse progress, citation grain, failures, review-required rows.
- Mapping Review: proposed fields, confidence, missing required columns, tenant/client id validation.
- Approval Queue: low-confidence facts, unstructured-document extractions, sensitive records.
- Context Commit: records/facts/chunks committed by dimension.
- Search/Embedding: chunks embedded, pending, failed, indexed.
- Retrieval Proof: tenant-scoped QA that proves the context is usable.
- Insight Readiness: whether significance/insight rules have run on the committed facts.

## First-Time Reality

The first few clients will be manually assisted. That is expected and healthy.

Manual work likely includes:

- Sorting uploaded files into dimensions.
- Reviewing PDFs, PPTs, DOCX, and XLSX for sensitivity.
- Choosing parser mode and citation grain.
- Extracting tables from quarterly reports, investor decks, org charts, architecture diagrams, contracts, and budget workbooks.
- Normalizing messy column names to canonical fields.
- Splitting source-only evidence from commit-ready structured facts.
- Confirming client-specific acronyms, system names, and owner roles.
- Approving low-confidence facts before commit.
- Writing the first retrieval proof questions.

The product should make this manual work observable, not pretend it is automated. The state should progress as:

`uploaded -> preflight passed -> staged in Blob -> parsed/extracted -> mapped -> review required/approved -> committed -> embedded/indexed -> retrieval proven -> insight evaluated`.

## Ad Hoc File Handling

Ad hoc formats are allowed, but not treated as facts until parsed with provenance.

- PDF: annual reports, quarterly reports, board packs, contracts, audit reports. Cite page and section.
- PPT/PPTX: investor decks, org charts, architecture diagrams, steering packs. Cite slide and shape/text block when available.
- DOC/DOCX: memos, policies, strategy notes. Cite heading, paragraph, or table.
- XLS/XLSX: budgets, CMDB, KPI workbooks, cost models. Cite sheet, row, column, and cell range.
- CSV/JSON/JSONL/YAML: structured exports. Cite row/object id.
- Images: architecture diagrams, network diagrams, org charts, screenshots. Cite file and OCR/region where extracted.
- ZIP: allowed as a package container only when manifest enumerates every file. Do not assume automatic server-side unzip unless the loader implements it.

## Backend Contract

The backend should store at least these entities:

- Client landing zone config: client key, subscription/environment, container/prefixes, allowed formats.
- Template registry: template pack, version, dimension, required fields, parser policy.
- Source catalog: every uploaded file and its sensitivity, owner, dimension, and expected parser.
- Parse job ledger: parser version, status, extracted artifacts, citations, errors.
- Mapping plan: source fields to canonical fields, confidence, required-field gaps.
- Review queue: proposed records/facts/chunks awaiting approval.
- Commit receipt: table counts, tenant/client ids, source ids, evidence ids.
- Retrieval proof: questions, expected citations, observed answers.
- Insight run receipt: evaluator version, facts considered, insights created/updated.

## What Not To Claim

- Do not call a file "loaded" because it exists in Blob.
- Do not call a PDF/PPT/DOCX/XLSX "committed" until parser output has citations and review state.
- Do not call context "usable" until tenant-scoped retrieval proves it.
- Do not call insights "live" until the insight evaluator has run against committed facts.
- Do not hard-delete bad uploads or bad generated artifacts; quarantine or archive with provenance.
