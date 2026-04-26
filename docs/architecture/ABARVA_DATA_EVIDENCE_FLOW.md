# AbarVa Data and Evidence Flow

Slice ID: ARCH3
Document: ABARVA_DATA_EVIDENCE_FLOW.md
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Specification / architecture document — no application code,
no runtime modification, no migrations, no model calls.

This document traces the journey from a raw tenant upload to an
evidence-usable, E-### citable chunk in the AbarVa evidence ledger.
It is the canonical reference for teams implementing the live ingestion
pipeline (deferred from ARCH1 §11.2).

---

## 1. Overview

AbarVa's evidence model is built on a strict principle: **every claim
must trace to a named chunk, and every chunk must pass all seven
pipeline stages before it is citable**.

The pipeline is intentionally deterministic. Models are not parsers
(ARCH1 §3.2). Every extraction that names a value — a dollar baseline,
a gate criterion, an owner name, a phase binding — flows through a
typed deterministic extractor, not through a model completion.

---

## 2. Seven-stage ingestion pipeline

```mermaid
flowchart TD
    A["Raw Upload\n(PDF / DOCX / XLSX /\nPPTX / CSV / MP4 /\ntranscript)"]

    subgraph STAGE1["Stage 1 — Parse"]
        B["Binary → Structured Text\n+ Structural Metadata\n(page / paragraph /\ntable / slide / row)"]
        B1{{"parse status:\nok | failed |\nunsupported_format"}}
    end

    subgraph STAGE2["Stage 2 — Chunk"]
        C["Split into\nEvidence-Sized Chunks\n(respects document\nstructure — not\narbitrary 512-token splits)"]
        C1{{"chunk status:\nok | empty"}}
    end

    subgraph STAGE3["Stage 3 — Enrich"]
        D["Attach Metadata:\nprogram / phase /\nworkshop binding;\nrole of chunk\n(charter section /\nbaseline value /\ngate criterion /\nfinding / decision /\naction item)"]
        D1{{"enrich status:\nok | partial | failed"}}
    end

    subgraph STAGE4["Stage 4 — Embed"]
        E["Generate Vector\nEmbeddings for Retrieval\n(tool — not\nsource of truth)"]
        E1{{"embed status:\nok | failed | skipped"}}
    end

    subgraph STAGE5["Stage 5 — Extract"]
        F["Deterministic Extractors\n(regex / structured parsers /\ntyped schema extractors)\nPopulate read-model fields:\nbaseline value / target /\nowner / gate criterion"]
        F1["NOT a model call.\nModels do not parse.\n(ARCH1 §3.2)"]
        F2{{"extract status:\nok | partial | failed |\nnot_applicable"}}
    end

    subgraph STAGE6["Stage 6 — Persist"]
        G["Write Atomically:\n• Relational store (rows)\n• Vector memory (embeddings)\n• Graph (typed edges)\n• Evidence ledger (projection)\nAll with provenance"]
        G1{{"persist status:\nok | failed | quarantined"}}
    end

    subgraph STAGE7["Stage 7 — Validate"]
        H["Run Integration Tests:\n• Typed shape\n• Citation chain\n• Tenant isolation\n• No-fabrication invariants"]
        H1{{"validate status:\nok | failed"}}
    end

    I["Evidence Ledger\n(E-### Citations)\nUsable by Context\nBuilder / Agents /\nDeliverables"]

    J["Trust Scoring\n(EVID3 Claim Support):\nfully_supported /\npartially_supported /\nunsupported / stale /\nblocked"]

    K["Context Injection\n(S1 Context Bundle)\nEvidence → ContextBundle\n→ GatewayPrompt\n→ Model Output"]

    L["Surface Output\nwith E-### Citations\n+ Provenance Ribbon"]

    A --> STAGE1
    B --> B1
    B1 -->|"ok"| STAGE2
    B1 -->|"failed"| ERR1["Upload marked partial\nMissing-input chip\nnames parse failure\nDoes NOT propagate"]

    C --> C1
    C1 -->|"ok"| STAGE3
    C1 -->|"empty"| ERR2["Chunk dropped\nParent object logged\nas zero-chunk"]

    D --> D1
    D1 -->|"ok / partial"| STAGE4
    D1 -->|"failed"| ERR3["Enrich failure:\nchunk unbound to\nwork object;\nstill passes if\npartially enriched\nbut chips displayed"]

    E --> E1
    E1 -->|"ok / skipped"| STAGE5
    E1 -->|"failed"| ERR4["Embed failure:\nretrieval degraded;\nchunk proceeds\nwithout embedding"]

    F --> F1
    F1 --> F2
    F2 -->|"ok / partial / not_applicable"| STAGE6
    F2 -->|"failed"| ERR5["Extract failure:\nchunk marked unextracted;\nhonest fallback chip;\ndoes NOT fall through\nto model"]

    G --> G1
    G1 -->|"ok"| STAGE7
    G1 -->|"failed / quarantined"| ERR6["Persist failure:\nchunk quarantined;\nnot available in\nevidence ledger"]

    H --> H1
    H1 -->|"ok"| I
    H1 -->|"failed"| ERR7["Validate failure:\nchunk blocked from\nevidence ledger;\nmanual review required"]

    I --> J
    J --> K
    K --> L
```

---

## 3. Evidence ledger projection

Once a chunk passes all seven stages and is written to the evidence
ledger, it is projected as a typed `EvidenceCitation`:

| Field | Description |
|---|---|
| `citationId` | E-### — unique, tenant-scoped, stable across re-extractions |
| `chunkId` | Link back to the relational chunk row |
| `tenantKey` | Tenant isolation — cross-tenant ledger queries are forbidden |
| `sourceObjectId` | Link back to the raw uploaded object |
| `sourceLocator` | Page / row / paragraph / slide — exact location in the source |
| `extractedFields` | Typed extracted values (baseline value, owner, criterion, etc.) |
| `citationTier` | `primary` / `corroborating` / `unverified` |
| `confidenceCap` | Maximum confidence any surface may claim for this citation |
| `evidenceUsability` | `usable` / `partial` / `unusable` |
| `createdFrom` | `human_authored` (all ingested chunks) |
| `extractorVersion` | `v1` — enables re-extraction without losing provenance |

---

## 4. Trust scoring (EVID3)

After a chunk enters the evidence ledger, the EVID3 Claim-Support
Evaluator assigns a trust status over any claim that references the
chunk:

| Status | Meaning |
|---|---|
| `fully_supported` | The chunk directly evidences the claim; citationTier primary |
| `partially_supported` | The chunk is corroborating; citationTier corroborating |
| `unsupported` | No matching chunk in the ledger |
| `stale` | The chunk's source object is older than the claim's reference date |
| `blocked` | The chunk is quarantined or validate-failed |
| `pending_extraction` | The chunk is in the pipeline but not yet validate-ok |
| `not_applicable` | The claim type does not require evidence (e.g., process definition) |

EVID3 is deterministic over the current ledger state. It does not call
a model. It does not fabricate support status.

---

## 5. Context injection

The Context Builder (S1) calls the evidence ledger tool to resolve
citations bound to the current work object. The ledger tool:

1. Calls vector search internally to find candidate chunk ids.
2. Resolves each hit against the relational ledger row.
3. Filters to chunks with `evidenceUsability: usable | partial`.
4. Projects the `EvidenceCitationSet` (typed array of citations).

The `EvidenceCitationSet` flows into the `ContextBundle`. The Model
Gateway attaches the citations as a structured `evidence_block` in the
`GatewayPrompt`. The model may only cite E-### ids that appear in the
`evidence_block`. Any E-### in the response that does not resolve
through the ledger is stripped with a warning (ARCH1 §12.7).

---

## 6. Output layer

Every surface that names a claim attaches its resolved E-### citations
as citation chips. Every gap (unusable evidence, partial evidence, stale
citation) surfaces as a missing-input chip naming the remedy.

Fabricated dollar amounts are forbidden (ARCH1 §12.6). Fabricated
E-### citations are forbidden (ARCH1 §12.7). A surface that displays a
value figure with no E-### citation is in violation.

---

## 7. What is live today vs. production target

| Stage | Today | Production target |
|---|---|---|
| Parse | Contract defined; no live binary parser | Live PDF / DOCX / XLSX / CSV parsers |
| Chunk | Contract defined; seed chunks only | Live chunker respecting document structure |
| Enrich | Contract defined; seed metadata only | Live enricher with program / phase binding |
| Embed | Contract defined; DATA6 vector provider contract | Live pgvector / Azure AI Search adapter |
| Extract | Extractor library contract defined | Live typed extractors per document kind |
| Persist | Seed rows in relational store | Live atomic write (relational + vector + graph + ledger) |
| Validate | Seed validation in integration tests | Live validate-pass gate before ledger projection |
| Evidence Ledger | EVID2 seed entries; EVID3 evaluator wired | Live tenant-bound ingest |
| Context Injection | CTX2 evidence section honestly-empty pending live ingest | Live EVID2 → CTX2 binding (CTX3 bridge in place) |

---

## End of ABARVA_DATA_EVIDENCE_FLOW

Read ABARVA_AZURE_REFERENCE_TARGET next for the Azure deployment
topology and VNet layout.
