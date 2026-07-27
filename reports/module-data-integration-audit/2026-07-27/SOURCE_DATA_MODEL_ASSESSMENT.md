# Source Data Model Assessment

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Executive Read

Source should retain sourcing-event workflow state locally, promote selected suppliers, accepted proposal facts, contracts, commercial commitments, and decision evidence, and project event comparisons/value proof as shared consumption outputs.

## Static Findings

Objects reviewed: 460.

Disposition mix: retain_operational: 419; promote_link_canonical_knowledge: 37; archive: 3; replace: 1.

## Representative Objects
### retain_operational
- `citation.doc` — Persisted module object requiring owner review.
- `constants.ts` — Persisted module object requiring owner review.
- `e.g` — Persisted module object requiring owner review.
- `information_schema.tables` — Persisted module object requiring owner review.
- `public.a` — Persisted module object requiring owner review.
- `public.AbarVa` — Persisted module object requiring owner review.
- `public.acceptance` — Persisted module object requiring owner review.
- `public.accepting` — Persisted module object requiring owner review.

### promote_link_canonical_knowledge
- `public.artifact` — Generated or reviewed deliverable/artifact persistence.
- `public.contract` — Vendor, contract, or commercial-evidence substrate.
- `public.CONTRACT_TERMS_V1` — Vendor, contract, or commercial-evidence substrate.
- `public.contracting` — Vendor, contract, or commercial-evidence substrate.
- `public.contractor` — Vendor, contract, or commercial-evidence substrate.
- `public.contractual` — Vendor, contract, or commercial-evidence substrate.
- `public.enterprise_context_source_files` — Persisted module object requiring owner review.
- `public.enterprise_context_sources` — Persisted module object requiring owner review.

### archive
- `public.catalog` — Persisted module object requiring owner review.
- `public.methodology` — Persisted module object requiring owner review.
- `public.source_artifact_generation_jobs` — Generated or reviewed deliverable/artifact persistence.

### replace
- `public.legacy` — Persisted module object requiring owner review.

## Required Next Proof

- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.
- Build identity-map candidates before any promotion.
- Shadow-read any consumption projection before dashboard or aVa cutover.
- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.
