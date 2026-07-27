# Source Data Model Assessment

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Executive Read

Source should retain sourcing-event workflow state locally, promote selected suppliers, accepted proposal facts, contracts, commercial commitments, and decision evidence, and project event comparisons/value proof as shared consumption outputs.

## Static Findings

Objects reviewed: 50.

Disposition mix: retain_operational: 30; promote_link_canonical_knowledge: 19; archive: 1.

## Representative Objects
### retain_operational
- `public.ai_control_sources` — Risk/control governance or monitoring substrate.
- `public.data_inventory_records` — Persisted module object requiring owner review.
- `public.data_sources` — Persisted module object requiring owner review.
- `public.enterprise_context_chunks` — Persisted module object requiring owner review.
- `public.enterprise_context_source_files` — Persisted module object requiring owner review.
- `public.enterprise_context_sources` — Persisted module object requiring owner review.
- `public.external_sources` — Persisted module object requiring owner review.
- `public.knowledge_sources` — Persisted module object requiring owner review.

### promote_link_canonical_knowledge
- `public.evidence` — Persisted module object requiring owner review.
- `public.home_knowledge_evidence_sources` — Persisted module object requiring owner review.
- `public.source_artifact_chunks` — Generated or reviewed deliverable/artifact persistence.
- `public.source_artifact_facts` — Generated or reviewed deliverable/artifact persistence.
- `public.source_contract_evidence_manifests` — Vendor, contract, or commercial-evidence substrate.
- `public.source_contract_evidence_metrics` — Metric, KPI, value, or outcome measurement substrate.
- `public.source_contract_evidence_rows` — Vendor, contract, or commercial-evidence substrate.
- `public.source_contract_optimization_findings` — Vendor, contract, or commercial-evidence substrate.

### archive
- `public.source_artifact_generation_jobs` — Generated or reviewed deliverable/artifact persistence.

## Required Next Proof

- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.
- Build identity-map candidates before any promotion.
- Shadow-read any consumption projection before dashboard or aVa cutover.
- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.
