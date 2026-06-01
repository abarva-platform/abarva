# Pilot Data Load Studio Design Spec

Date: 2026-06-01
Status: candidate design control
Scope: Admin Setup data-loading workflow for Apex Retail, Meridian Health, and SkyHarbor Air

## Executive Decision

Setup must not feel like a raw connector page. The correct experience is a guided Data Load Studio where an operator chooses a business dimension, reviews the available templates and accepted formats, gives the required consent/attestation, uploads through the private data plane, resolves quarantine or validation exceptions, secures owner approval, then commits the load into the tenant context layer.

Home and Setup serve different audiences:

- Home: read-only review of what is in the system, what is trusted, what is incomplete, and what assistants can safely use.
- Setup: restricted operator workflow for loading, processing, approving, committing, rolling back, and auditing client data.

## Design Principles

1. Dimension first, file second.
   The first choice is not CSV/PDF/XLSX. The first choice is the business dimension the operator is trying to load.

2. Client identity stays obvious.
   The page header must show the active client name and must never show all client manifests or cross-client data in the runtime canvas.

3. Key information appears above the fold.
   The first viewport must show active client, readiness, dimensions, next action, workflow status, and the path to start a governed load.

4. Implementation details stay behind the product language.
   No API paths, source file paths, or engineering labels such as "tenant isolation guard" should be primary user text.

5. Every control maps to a real workflow or contract.
   Buttons cannot imply a fake action. If the worker or ledger is not directly clickable, show it as monitored, with the next human control clearly named.

6. Approval and consent are mandatory controls.
   No data moves from uploaded file to assistant-available context without attestation, validation, and owner approval.

7. Quarantine is visible, reversible, and auditable.
   Sensitive-data, malware, schema, and tenant-boundary failures must stop processing and create an auditable case.

8. Commit is batch-scoped and reversible.
   Each load has a batch id, template version, source file manifest, validation results, approval evidence, and rollback/unload path.

## First Viewport Wireframe Contract

The first viewport of `/admin/setup` should contain:

| Zone | Purpose | Required content |
| --- | --- | --- |
| Header | Confirm context | Active client name, module title, private data-plane state |
| Summary strip | Make status scannable | Overall readiness, dimensions loaded, blocked actions, templates available |
| Dimension library | Let operator choose what to load | Dimension cards with completeness, formats, template count, next action |
| Active load plan | Make workflow obvious | Stepper for select template, consent, upload, scan/quarantine, validate, approve, commit |
| Primary action | Start safely | Start load button routed to real upload flow, not a raw inline connector |
| Exceptions | Avoid hidden blockers | Quarantine and approval counters visible above the fold |

## Full Workflow

| Stage | Operator experience | System control | Pass condition | Stop condition |
| --- | --- | --- | --- | --- |
| 1. Access | Operator enters Setup for one active client | Clerk auth and admin tenant resolver | User has upload-capable role for active client | User lacks role or tenant mismatch |
| 2. Select dimension | Choose a business dimension such as Application portfolio or ERP landscape | Template registry and format matrix | Dimension has a versioned template and owner | Unknown dimension or no template |
| 3. Select template | View accepted formats, required fields, owner, surfaces unlocked | `template-registry` and enterprise template manifests | Template version is recorded on the load draft | Template version missing |
| 4. Consent and attestation | Confirm data-use permission, source ownership, and prohibited-data policy | Consent ledger and data-use policy gate | Attestation captured with actor/time | Consent missing or stale |
| 5. Upload | Upload CSV, XLSX, JSON, JSONL, PDF, DOCX, PPTX, Markdown, or ZIP when allowed | Private landing-zone upload, client-scoped storage key, file hash | File manifest created for active client | Tenant key mismatch or unsupported format |
| 6. Malware scan | Scan file before parsing | Malware/virus scanner contract | Clean scan result recorded | Malware signal routes to quarantine |
| 7. Sensitive-data guard | Detect PHI, PII, financial identifiers, and prohibited content | Sensitive upload guard | Allowed classification or approved exception | Quarantine case created |
| 8. Parse and extract | Extract rows, sheets, document facts, slides, or archive contents | Format-specific parser and extraction strategy | Facts have source locators and confidence | Parser fails or unsupported structure |
| 9. Map and validate | Map fields to template, inspect required-field coverage | Validation engine | Required fields, enum checks, owner, freshness, and duplicates pass | Schema anomaly or missing field |
| 10. Clarify anomalies | Ask operator or owner to resolve missing fields and conflicts | Clarification queue | Resolution added to load ledger | Unresolved blocker |
| 11. Owner approval | Route preview to named owner role | Approval queue | Approval actor, timestamp, rationale, and target batch captured | Rejection or timeout |
| 12. Commit | Commit approved facts to tenant context layer | Batch commit ledger, idempotency key, evidence rows | Assistants can use approved evidence | Commit conflict or idempotency duplicate |
| 13. Rollback/unload | Reverse a bad batch without manual cleanup | Batch-scoped rollback contract | Facts and evidence from that batch are unloaded | Missing batch id or dependent commit lock |
| 14. Audit export | Export run history, approvals, quarantine, and commit evidence | Audit export | Auditor can inspect full chain | Missing log event |

## Dimension And Format Matrix

The studio should expose the following dimensions using the existing context template registry:

| Dimension | Accepted formats | Owner | Primary surfaces unlocked |
| --- | --- | --- | --- |
| Enterprise profile | Markdown, JSON, PDF | Chief Strategy Officer | Sentinel, Source, Moves, Tower |
| Financial KPIs | XLSX, CSV | CFO | Sentinel, Source, Moves, Tower |
| Annual and quarterly reports | PDF, PPTX, DOCX | Investor Relations | Sentinel, Source, Moves, Tower |
| Market and competitor intel | CSV, Markdown, PDF | Chief Commercial Officer | Sentinel, Source, Moves, Tower |
| C-suite strategy | DOCX, PDF, Markdown | CEO Chief of Staff | Sentinel, Source, Moves, Tower |
| Business unit segment P&L | XLSX, CSV | CFO FP&A | Sentinel, Source, Moves, Tower |
| Product portfolio | CSV, XLSX | Chief Product Officer | Sentinel, Source, Moves, Tower |
| Manufacturing sites | CSV, XLSX | COO | Sentinel, Source, Moves, Tower |
| ERP landscape | XLSX, CSV | CIO ERP Transformation | Sentinel, Source, Moves, Tower |
| Application portfolio | CSV, XLSX | VP Enterprise Architecture | Sentinel, Source, Moves, Tower |
| Integration topology | JSON, JSONL, CSV | VP Enterprise Architecture | Sentinel, Source, Moves, Tower |
| Vendor contracts | CSV, XLSX, PDF | VP Procurement | Sentinel, Source, Moves, Tower |
| Transformation initiatives | XLSX, CSV, JSON | Transformation PMO | Sentinel, Source, Moves, Tower |
| Org, roles, and teams | CSV, XLSX, JSON | CHRO | Sentinel, Source, Moves, Tower |
| Delivery, DORA, and DevEx | CSV, XLSX, JSON | VP Engineering | Sentinel, Source, Moves, Tower |
| Regulatory, QMS, and risk | CSV, XLSX, PDF | Chief Quality Officer | Sentinel, Source, Moves, Tower |
| AI tooling and model inventory | CSV, XLSX, JSON | AI Governance Lead | Sentinel, Source, Moves, Tower |
| Incidents and ops telemetry | CSV, JSON, JSONL | VP IT Operations | Sentinel, Source, Moves, Tower |

## Setup Page Interaction Model

### Default State

- Shows active client and "Private data plane ready" if access, storage, scan, validation, and approval contracts are available.
- Highlights the highest-value incomplete dimension.
- Shows templates and formats for that dimension.
- Shows the active workflow stepper with status for each gate.

### Start Load

The Start Load action opens a guided load drawer or route with these panels:

1. Dimension and template
2. Consent and data-use attestation
3. File selection and manifest preview
4. Scan and quarantine results
5. Parsed preview and field mapping
6. Validation findings and clarification requests
7. Owner approval
8. Commit, rollback, and audit export

### Quarantine

Quarantine must be visible in the same operator flow:

- Reason: malware, sensitive data, tenant mismatch, schema anomaly, unsupported format, parser failure, duplicate batch, or policy block.
- Actions: release with approval, delete, request clarification, or retry scan.
- Required evidence: actor, role, timestamp, reason, source file hash, and resulting state.

### Consent And Approval

Consent and approval are separate:

- Consent: the uploader attests they are allowed to load the file and that the file follows the client data-use policy.
- Approval: the dimension owner approves parsed and validated facts before commit.

No assistant-facing context can be created from a load with missing consent or missing owner approval.

### Commit And Rollback

Commit creates a batch-scoped record:

- tenant client id
- dimension
- template id and version
- source file manifest
- parser/extraction strategy
- validation result
- approval id
- commit id
- idempotency key
- rollback status

Rollback removes or disables context facts and evidence rows created by the batch while retaining audit history.

## Data Binding Requirements

| UI element | Data source |
| --- | --- |
| Active client name | Admin tenant resolver |
| Dimension cards | `NORTHSTAR_CONTEXT_TEMPLATES` and enterprise context manifests |
| Accepted formats | `acceptedFormats` in template registry plus format matrix |
| Required fields | `requiredFields` in template registry |
| Owner role | `ownerRole` in template registry |
| File classification | `classifyUploadedFile` |
| Sensitive upload result | `evaluateSensitiveUpload` |
| Queue event shape | Azure landing-zone message types |
| Parser strategy | File classification extraction strategy |
| Validation findings | `validateExtractedFacts` |
| Quarantine cases | Quarantine audit source or durable quarantine table |
| Approval status | Approval queue / approval request records |
| Commit status | Durable ingestion ledger / context commit records |
| Audit export | Load run ledger, file manifests, approvals, quarantine, and commit history |

## Implementation Backlog Slices

| Slice | Scope | Acceptance |
| --- | --- | --- |
| DL-1 | Replace Setup page with final Data Load Studio layout | First viewport matches wireframe; no raw connector; active client obvious |
| DL-2 | Guided load drawer/route | Dimension, template, consent, upload, scan, validate, approval, commit panels exist |
| DL-3 | Durable ingestion schema | Upload runs, file manifests, quarantine, clarifications, approvals, commits, rollback records |
| DL-4 | Consent and data-use policy gate | No upload can process without attestation |
| DL-5 | Malware and sensitive-data quarantine | Blocked files create auditable quarantine cases |
| DL-6 | Format-specific parsing | CSV/XLSX/JSON/JSONL/PDF/DOCX/PPTX/Markdown/ZIP map to strategies |
| DL-7 | Preview before commit | Parsed facts and validation findings are visible before approval |
| DL-8 | Owner approval | Approval actor/time/rationale captured before commit |
| DL-9 | Commit and rollback | Batch-scoped commit and unload paths work |
| DL-10 | Audit export | Client/admin can export load and approval history |
| DL-11 | Tenant isolation test pack | Apex, Meridian, and SkyHarbor cannot see or commit each other's data |
| DL-12 | SkyHarbor clean-load proof | Existing SkyHarbor seed erased, synthetic files generated by dimension, loaded through the new workflow, parsed, validated, approved, and committed |

## QA Contract

Minimum QA before production:

- Unit tests for read model and workflow state transitions.
- API tests for upload, consent, quarantine, approval, commit, and rollback contracts.
- Tenant isolation tests for Apex Retail, Meridian Health, and SkyHarbor Air.
- Browser walk for every Setup control for the three pilot clients.
- No cross-client data displayed in any runtime page.
- No hidden raw API path or engineering label in Maestro-facing UI.
- Production post-deploy crawl must complete without cancellation or product failure.

## HTML Wireframe

Open `docs/build/PILOT_DATA_LOAD_STUDIO_WIREFRAME_2026-06-01.html` to inspect the proposed page. It is intentionally static and does not claim that the workflow is implemented yet.
