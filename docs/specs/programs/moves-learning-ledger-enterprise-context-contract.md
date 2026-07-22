# Moves Learning Ledger to Enterprise Context Contract

## Status

Design contract for runtime hardening. This document describes the required Moves data-layer behavior; it does not by itself promote any Move output into active enterprise context.

## Purpose

Moves should learn over time, but only from governed, reviewable records. The product contract is:

```text
Move evidence + phase decisions + client-approved deliverables + gate outcomes
→ Azure-persisted Moves learning ledger
→ governed enterprise-context candidates
→ human review / promotion
→ active agent-ready enterprise context
```

AI-generated drafts, suggested context, rejected uploads, gaps, and unreviewed evidence must not become enterprise truth.

## Azure Persistence Boundary

Moves runtime state is persisted in Azure/Postgres and Blob through the existing governed tables and artifact stores:

| Runtime object | Current durable home | Learning eligibility |
| --- | --- | --- |
| Uploaded files | `move_artifacts`, Blob | Eligible only after review/approval and tenant/source lineage checks. |
| Parsed evidence | `program_evidence_items`, `program_evidence_reviews` | Eligible when approved, source-backed, non-restricted, and tied to a Move/phase. |
| Phase context extract | File Cabinet artifact + evidence ledger links | Eligible as lineage and gap metadata, not as standalone truth. |
| AI-generated deliverable draft | `generated_artifacts`, Blob | Not eligible until human reviewed and client-approved. |
| Client-approved deliverable | `deliverables_v2` + artifact/version lineage | Eligible as a derived enterprise-context candidate. |
| Gate approval / blocker | phase gate state and approval artifacts | Eligible as governance history and readiness signal. |
| Tower handoff | value measurement / handoff artifacts | Eligible as measurement contract candidates, not realized value. |

## Learning Object Model

Every promoted candidate derived from a Move must carry:

| Field | Requirement |
| --- | --- |
| `tenant_id` / `tenant_key` | Exact tenant scope; no cross-tenant reuse. |
| `move_id` | Source Move identifier. |
| `phase` | Phase that produced or approved the fact. |
| `source_artifact_id` | Uploaded evidence, generated artifact, or approved deliverable id. |
| `source_artifact_version` | Version used when the candidate was derived. |
| `source_basis` | `client_approved_deliverable`, `approved_evidence`, or `gate_decision`. |
| `confidence_level` | Derived from evidence strength, reviewer role, and artifact quality. |
| `classification` | Public/internal/restricted policy classification. |
| `claim_type` | Capability, system, process, KPI, risk, control, dependency, operating model, value hypothesis, or decision. |
| `evidence_refs` | Citation refs back to source rows/files. |
| `readiness_state` | Starts as `not_reviewed` or `promotion_candidate`; never `agent_ready` by default. |
| `applicable_agents` | Usually `Moves`, optionally `Intelligence`, `Source`, or `Tower` after review. |

## Promotion Rules

1. **No automatic active context promotion.** Moves may create candidates, but active enterprise context requires the existing context/corpus policy gates.
2. **Only approved source material can teach the system.** Approved evidence, accepted client deliverables, and explicit gate decisions can become candidates.
3. **AI drafts are excluded by default.** Drafts may provide candidate extraction only after human approval removes the AI-draft boundary.
4. **Suggested context remains advisory.** Suggested/excluded/gap context is useful for next-phase guidance, but must not be written to `program_evidence_items` or active context as evidence.
5. **Every learned fact must be reconstructable.** An auditor must be able to navigate from enterprise-context candidate to tenant, Move, phase, artifact, version, reviewer decision, and source citation.
6. **Tower receives commitments, not realized value.** A Move can create value hypotheses and measurement contracts; realized value remains Tower-governed and evidence-backed.

## Minimum Runtime Loop

```text
1. User uploads evidence.
2. Evidence is parsed and reviewed.
3. Approved evidence refreshes the Move Context Extract.
4. Approve & Build generates AI-draft deliverables from approved evidence only.
5. Human downloads/edits/reuploads/approves the deliverable.
6. Approved deliverable becomes authoritative for the next phase.
7. Candidate learning facts are extracted from approved evidence, approved deliverables, and gate decisions.
8. Candidates enter context review with full lineage.
9. Only policy-passing, cite-render-verified objects become active enterprise context.
```

## Open Implementation Backlog

| Backlog item | Description |
| --- | --- |
| `MOVES-DATA-001` | Create a Moves learning ledger view or table over approved evidence, approved deliverables, gate outcomes, and context extracts. |
| `MOVES-DATA-002` | Add candidate extraction from client-approved deliverables with source artifact/version lineage. |
| `MOVES-DATA-003` | Add an admin/context review queue for Move-derived candidates before enterprise-context promotion. |
| `MOVES-DATA-004` | Add retrieval proof that Move-derived candidates can be cited in Intelligence/Moves after promotion. |
| `MOVES-DATA-005` | Add tests that AI drafts, suggested context, excluded context, and gaps never auto-promote. |

## Acceptance Criteria

- A completed Move produces a durable, tenant-scoped learning ledger in Azure/Postgres.
- Every candidate has artifact/version/source lineage.
- No unreviewed evidence, AI draft, suggested context, excluded context, or gap becomes active enterprise context.
- Reviewable candidates can be promoted through the existing context/corpus policy.
- Promoted candidates are retrievable and cite-render-verified before use by aVa, Moves, Intelligence, Source, or Tower.
