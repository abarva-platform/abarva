# Tower Data Model Assessment

> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.

## Executive Read

Tower should retain monitoring/control workflow state locally, promote governed metric definitions and material risks, and publish metric observations, value realization, vendor performance, and command-center marts as controlled consumption projections.

## Static Findings

Objects reviewed: 192.

Disposition mix: archive: 4; retain_operational: 152; promote_link_canonical_knowledge: 25; project_shared_consumption: 11.

## Representative Objects
### retain_operational
- `cio_tower.entities` — Persisted module object requiring owner review.
- `cio_tower.measure_results` — Persisted module object requiring owner review.
- `cio_tower.measures` — Persisted module object requiring owner review.
- `cio_tower.prompt_packages` — AI generation trace, prompt package, or audit record.
- `cio_tower.relationships` — Persisted module object requiring owner review.
- `cio_tower.source_registry` — Persisted module object requiring owner review.
- `cio_tower.validation_results` — Persisted module object requiring owner review.
- `cio_tower.validation_runs` — Persisted module object requiring owner review.

### promote_link_canonical_knowledge
- `cio_tower.facts` — Persisted module object requiring owner review.
- `cio_tower.question_contracts` — Vendor, contract, or commercial-evidence substrate.
- `cio_tower.tool_identity_aliases` — Persisted module object requiring owner review.
- `intelligence_v7.active_tenant_contract_versions` — Vendor, contract, or commercial-evidence substrate.
- `public.Accepted` — Persisted module object requiring owner review.
- `public.ai_control_actions` — Risk/control governance or monitoring substrate.
- `public.ai_control_agent_outcomes` — Metric, KPI, value, or outcome measurement substrate.
- `public.ai_control_atlas_context_packs` — Risk/control governance or monitoring substrate.

### project_shared_consumption
- `cio_tower.mart_ai_portfolio` — Derived read model or reporting projection.
- `cio_tower.mart_command_center` — Derived read model or reporting projection.
- `cio_tower.mart_cxo_actions` — Derived read model or reporting projection.
- `cio_tower.mart_evidence_lineage` — Derived read model or reporting projection.
- `cio_tower.mart_program_decision_lanes` — Derived read model or reporting projection.
- `cio_tower.mart_required_field_gaps` — Derived read model or reporting projection.
- `cio_tower.mart_value_funnel` — Derived read model or reporting projection.
- `public.ai_control_tower_lens_mv` — Risk/control governance or monitoring substrate.

### archive
- `cio_tower.answer_traces` — AI generation trace, prompt package, or audit record.
- `public.program_audit_log` — Persisted module object requiring owner review.
- `public.technology` — Persisted module object requiring owner review.
- `public.tower_answer_trace` — AI generation trace, prompt package, or audit record.

## Required Next Proof

- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.
- Build identity-map candidates before any promotion.
- Shadow-read any consumption projection before dashboard or aVa cutover.
- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.
