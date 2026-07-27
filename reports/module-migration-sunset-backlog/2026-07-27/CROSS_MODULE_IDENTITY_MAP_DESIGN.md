# Cross-Module Identity Map Design

> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.

## Purpose

Preserve module-local IDs while linking reviewed enterprise-significant objects to stable canonical references. The identity map is not a bulk copy of module workflow state.

## Required Fields

| Field | Requirement |
| --- | --- |
| tenant_key | Required tenant fence from session/runtime identity |
| module | Moves, Source, Tower, or future module |
| local_object_type | Domain object type such as vendor, contract, program, decision, risk, control, metric, outcome, evidence, application, sourcing_event |
| local_object_ref | Module-local primary identifier |
| canonical_object_type | Canonical Knowledge family |
| canonical_object_ref | Stable canonical ID after review |
| match_method | exact, deterministic, reviewed, manual, or rejected |
| match_confidence | Confidence tier and score where available |
| review_state | candidate, approved, rejected, superseded |
| valid_from / valid_to | Temporal boundary |
| evidence_refs | Source/evidence/provenance references supporting the link |
| created_by / reviewed_by | Accountability |

## Rules

- Identity is declared and reviewed, not inferred from filenames or display labels.
- Local IDs are retained for workflow rollback and audit history.
- No consumer may use canonical reads until the link is approved and parity-tested.
