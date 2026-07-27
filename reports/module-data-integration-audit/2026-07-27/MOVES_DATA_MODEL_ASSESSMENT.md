# Moves Data Model Assessment

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Executive Read

Moves should retain workflow drafting/execution state locally, promote approved programs, decisions, risks, actions, outcomes, and KPIs through canonical identity mapping, and publish stable portfolio/readiness summaries only after parity proof.

## Static Findings

Objects reviewed: 27.

Disposition mix: retain_operational: 20; promote_link_canonical_knowledge: 6; archive: 1.

## Representative Objects
### retain_operational
- `public.Active` — Persisted module object requiring owner review.
- `public.Claude` — Persisted module object requiring owner review.
- `public.every` — Persisted module object requiring owner review.
- `public.execution` — Persisted module object requiring owner review.
- `public.its` — Persisted module object requiring owner review.
- `public.key` — Persisted module object requiring owner review.
- `public.measured` — Persisted module object requiring owner review.
- `public.Move` — Moves lifecycle, phase, charter, or execution planning state.

### promote_link_canonical_knowledge
- `public.approved` — Persisted module object requiring owner review.
- `public.move_artifact_review_decisions` — Generated or reviewed deliverable/artifact persistence.
- `public.move_artifacts` — Generated or reviewed deliverable/artifact persistence.
- `public.move_template_artifacts` — Generated or reviewed deliverable/artifact persistence.
- `public.move_template_gates` — Moves lifecycle, phase, charter, or execution planning state.
- `public.program_evidence_reviews` — Persisted module object requiring owner review.

### archive
- `public.move_template_audit_log` — Moves lifecycle, phase, charter, or execution planning state.

## Required Next Proof

- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.
- Build identity-map candidates before any promotion.
- Shadow-read any consumption projection before dashboard or aVa cutover.
- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.
