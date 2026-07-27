# Moves Data Model Assessment

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Executive Read

Moves should retain workflow drafting/execution state locally, promote approved programs, decisions, risks, actions, outcomes, and KPIs through canonical identity mapping, and publish stable portfolio/readiness summaries only after parity proof.

## Static Findings

Objects reviewed: 11.

Disposition mix: retain_operational: 10; archive: 1.

## Representative Objects
### retain_operational
- `public.move_artifact_review_decisions` — Generated or reviewed deliverable/artifact persistence.
- `public.move_artifacts` — Generated or reviewed deliverable/artifact persistence.
- `public.move_dependencies` — Moves lifecycle, phase, charter, or execution planning state.
- `public.move_instances` — Moves lifecycle, phase, charter, or execution planning state.
- `public.move_template_artifacts` — Generated or reviewed deliverable/artifact persistence.
- `public.move_template_gates` — Moves lifecycle, phase, charter, or execution planning state.
- `public.move_template_review_state` — Moves lifecycle, phase, charter, or execution planning state.
- `public.move_template_versions` — Moves lifecycle, phase, charter, or execution planning state.

### archive
- `public.move_template_audit_log` — Moves lifecycle, phase, charter, or execution planning state.

## Required Next Proof

- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.
- Build identity-map candidates before any promotion.
- Shadow-read any consumption projection before dashboard or aVa cutover.
- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.
