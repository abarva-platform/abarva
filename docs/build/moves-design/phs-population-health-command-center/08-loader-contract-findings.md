# PHS Population Health Command Center — Loader Contract Findings

Date: 2026-06-05
Status: Phase 0 implementation map

## Finding

The governed context loader exists and is tenant-scoped, but it is too narrow
for the PHS demo contract today. It can upload CSV rows, create
`data_ingestion_runs`, write `enterprise_context_chunks`, and queue embeddings.
That is necessary, but not enough to prove a stage is ready.

For PHS, a loaded file must also support:

- citation keys for material claims
- source artifact or storage path references
- evidence ledger binding
- workload and rate-card structure
- gate criteria and waiver rules
- named approval records
- artifact parse and approval state

## Existing Capabilities

| Capability | Current state |
|---|---|
| Context upload UI | `/admin/context-layer/uploads` supports structured CSV and corpus JSONL import controls |
| CSV upload API | `/api/admin/context-layer/csv-upload` enforces tenancy, file type, size, attestation, and sensitive-upload guard |
| CSV parser | maps CSV rows into tenant context chunks |
| Read model | context-layer pages can summarize source files, chunks, and evidence map entries |
| Corpus import | governed JSONL corpus import exists under the context-layer upload path |
| Evidence ledger | append-only evidence ledger exists, but context CSV upload does not yet bind every row to ledger IDs |

## Gaps Blocking A Full Demo

| Gap | Why it matters |
|---|---|
| No PHS manifest contract in loader path | Loader can accept rows without proving the full Phase 0 object set exists |
| No generic source-file registry for context uploads | Source has a richer artifact registry model; Setup/Admin context uploads need equivalent lifecycle state |
| Evidence ledger not automatically bound | Generated answers cannot reliably cite loaded evidence keys unless the loader writes or returns them |
| Approval queue semantics are embedding-oriented | PHS needs human evidence/artifact approval, rejection, and waiver states |
| Stage completion not enforced by manifest | A stage could look complete after chunking even if artifacts/gates/approvals are missing |

## Implementation Slices

| Slice | Scope | Status |
|---|---|---|
| 1. Phase 0 manifest contract | Typed manifest + validator for evidence, artifacts, workloads, rates, gates, and approvals | Started in this PR |
| 2. Governed upload registry | Generic context source file registry or reuse of Source artifact lifecycle model | Next PR |
| 3. Loader write expansion | Write inventory records, audit log, chunks, and evidence ledger in one governed run | Next PR after registry decision |
| 4. Evidence ledger binding | Return citation keys / ledger IDs in loader receipt | Next PR after Slice 3 |
| 5. Human approval workflow | Replace embedding-only approval semantics for this lane with evidence/artifact approvals | Runtime PR |
| 6. PHS QA crawl | Prove no stage advances without persisted, parseable, evidence-linked, approved artifacts | QA PR |

## Rule For Next PR

The next implementation PR should extend the loader contract before adding any
visible Moves demo stage. A visible stage without loader-backed evidence would
recreate the exact quality problem this lane is meant to solve.
