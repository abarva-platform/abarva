# RLS Policy Inventory · Pre-Phase 5 Baseline

**Generated:** 2026-05-07  
**Purpose:** Baseline snapshot of all RLS-enabled tables before Phase 5 per-user policies are applied.  
**Method:** Static analysis of all migration files in `supabase/migrations/`.  
**Note:** A runtime query can confirm live state:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE policyname LIKE 'service_role%' OR roles && ARRAY['service_role']::name[]
ORDER BY schemaname, tablename;
```

---

## Summary

| Category | Tables | Phase 5 disposition |
|---|---|---|
| Source | 13 | Replace with per-user (Steps 2+5) |
| Admin / Setup | 7 | Replace with per-user (Steps 3+5) |
| Tower | 8 | Replace with per-user (Steps 4+5) |
| Intelligence | 9 | Replace with per-user (Steps 4+5) |
| Programs (already migrated) | 7 | Already have per-user RLS — skip |
| System / infra (deferred) | 20+ | Keep service-role-only for now |

---

## Category A · SOURCE TABLES · service-role-only → Phase 5 Step 2+5

| Table | Tenant column | Existing policy | Disposition |
|---|---|---|---|
| `source_events` | `client_key TEXT` | `service_role_full_access` | Replace |
| `source_event_approvals` | `client_key TEXT` | `service_role_full_access` | Replace |
| `source_event_participants` | `client_key TEXT` | `service_role_full_access` | Replace |
| `source_artifacts` | `tenant_key TEXT` | `service_role_all_source_artifacts` | Replace |
| `source_artifact_chunks` | `tenant_key TEXT` | `service_role_all_source_artifact_chunks` (dynamic) | Replace |
| `source_artifact_facts` | `tenant_key TEXT` | `service_role_all_source_artifact_facts` (dynamic) | Replace |
| `source_pricing_components` | `tenant_key TEXT` | `service_role_all_source_pricing_components` (dynamic) | Replace |
| `source_commercial_exceptions` | `tenant_key TEXT` | `service_role_all_source_commercial_exceptions` (dynamic) | Replace |
| `source_vendor_commitments` | `tenant_key TEXT` | `service_role_all_source_vendor_commitments` (dynamic) | Replace |
| `source_requirements` | `tenant_key TEXT` | `service_role_all_source_requirements` (dynamic) | Replace |
| `source_meeting_outcomes` | `tenant_key TEXT` | `service_role_all_source_meeting_outcomes` (dynamic) | Replace |
| `source_graph_edges` | `tenant_key TEXT` | `service_role_all_source_graph_edges` (dynamic) | Replace |
| `source_context_receipts` | `tenant_key TEXT` | `service_role_all_source_context_receipts` (dynamic) | Replace |

**Note on dynamic policies:** Migration 20260430220000 uses a `FOR` loop to create `service_role_all_*` policies on all source artifact family tables. Step 2 migration must drop and replace each by name.

---

## Category B · ADMIN / SETUP TABLES · service-role-only → Phase 5 Step 3+5

| Table | Tenant column | Existing policy | Disposition |
|---|---|---|---|
| `admin_connectors` | `client_id UUID` | `service_role_all_admin_connectors` | Replace |
| `admin_datasets` | `client_id UUID` | `service_role_all_admin_datasets` | Replace |
| `admin_dataset_approvals` | `client_id UUID` | `service_role_all_admin_dataset_approvals` | Replace |
| `admin_dataset_quality` | `client_id UUID` | `service_role_all_admin_dataset_quality` | Replace |
| `admin_blockers` | `client_id UUID` | `service_role_all_admin_blockers` | Replace |
| `admin_audit_log` | `client_id UUID` | `service_role_all_admin_audit_log` | Replace |
| `admin_setup_progress` | `client_id UUID` | `service_role_all_admin_setup_progress` | Replace |

**All admin tables use `client_id UUID`** — RLS policies must use `can_read_tenant_by_id()` helper (requires `clients.tenant_key` column added in Step 1).

---

## Category C · TOWER TABLES · service-role-only → Phase 5 Step 4+5

| Table | Tenant column | Existing policy | Disposition |
|---|---|---|---|
| `atlas_threads` | `client_id UUID` | `service_role_all_atlas_threads` | Replace |
| `atlas_observations` | `client_id UUID` | `service_role_all_atlas_observations` | Replace |
| `signal_firings` | `client_id UUID` | `service_role_all_signal_firings` | Replace |
| `use_cases` | `client_id UUID` | `service_role_all_use_cases` (dynamic) | Replace |
| `use_case_usage_metrics` | (via use_case FK) | `service_role_all_use_case_usage_metrics` (dynamic) | Replace |
| `use_case_value_metrics` | (via use_case FK) | `service_role_all_use_case_value_metrics` (dynamic) | Replace |
| `use_case_risk` | (via use_case FK) | `service_role_all_use_case_risk` (dynamic) | Replace |
| `use_case_cost_metrics` | (via use_case FK) | `service_role_all_use_case_cost_metrics` (dynamic) | Replace |

**`agent_threads` / `agent_observations`** are views over `atlas_threads` / `atlas_observations` (added in migration 20260506100000). They inherit the base table RLS — no separate policies needed.

---

## Category D · INTELLIGENCE TABLES · service-role-only → Phase 5 Step 4+5

| Table | Tenant column | Existing policy | Disposition |
|---|---|---|---|
| `kpis` | `client_id UUID` | `service_role_all_kpis` | Replace |
| `pattern_packs` | `client_id UUID` | `service_role_all_pattern_packs` | Replace |
| `benchmark_cohorts` | `client_id UUID` | `service_role_all_benchmark_cohorts` | Replace |
| `external_sources` | `client_id UUID` | `service_role_all_external_sources` | Replace |
| `external_events` | `client_id UUID` | `service_role_all_external_events` | Replace |
| `evidence` | `client_id UUID` | `service_role_all_evidence` | Replace |
| `telemetry_sources` | `client_id UUID` | `service_role_all_telemetry_sources` | Replace |
| `intelligence_session_log` | `client_id UUID` | `service_role_all_intelligence_session_log` | Replace |
| `intelligence_mode_toggle_events` | (session FK) | `service_role_all_intelligence_mode_toggle_events` | Replace |

---

## Category E · PROGRAMS TABLES · already have per-user RLS · SKIP

These tables have per-user policies from earlier migrations — no Phase 5 work needed:

| Table | Migration | Per-user policies |
|---|---|---|
| `persons` | 019_per_user_rls | `service_role_all_persons` + `authenticated_read_persons` |
| `engagements` | 019_per_user_rls | `service_role_all_engagements` + `authenticated_read_engagements` |
| `turns` | 019_per_user_rls | `service_role_all_turns` + `authenticated_read_turns` |
| `relationship_notes` | 019_per_user_rls | `service_role_all_notes` + `authenticated_read_own_notes` |
| `program_approval_requests` | 20260430120100 | Full per-user CRUD with role checks |
| `program_export_log` | 20260429200000 | Per-user read + tenant_admin gate |
| `program_evidence_items` | 20260501120000 | Per-user read + ownership checks |

---

## Category F · SYSTEM / INFRASTRUCTURE TABLES · DEFERRED

These tables are service-role-only and **stay that way in Phase 5**. They are either system-internal, cross-tenant by design, or managed outside the user data plane:

| Table | Reason for deferral |
|---|---|
| `person_client_memberships` | Auth system table — read by service_role during user resolution |
| `clients` | Platform table — maestro + service only |
| `audit_log` | Platform audit — service_role write; read via API |
| `knowledge_sources` | Cross-tenant shared patterns corpus |
| `knowledge_chunks` | Cross-tenant shared patterns corpus |
| `data_inventory_segments` | Tenant setup data — service_role only via Steward |
| `enterprise_graph_nodes` | Tenant context — service_role + broker |
| `enterprise_graph_edges` | Tenant context — service_role + broker |
| `enterprise_context_chunks` | Tenant context — service_role + broker |
| `data_ingestion_runs` | Internal pipeline |
| `data_inventory_audit_log` | Internal pipeline audit |
| Private schemas (tenant_metric_observations, setup_ai_initiatives) | Schema-isolated by design; tenant_key is schema name |
| `foundational_pattern_packs` | Cross-tenant intelligence corpus |
| `contradictions` | Tower system table — service_role writes |
| `access_scopes` | Declarative scope config — read-only via service_role |

---

## Storage buckets

| Bucket | Existing policies | Phase 5 disposition |
|---|---|---|
| `source-artifacts` | `source_artifacts_select_tenant_path` (path prefix match) | Add role gate (Step 6) |
| `program-attachments` | `program_attachments_select_tenant_path` (path prefix match) | Already has JWT tenant_key check — verify sufficiency |

---

## Key design decisions captured here

1. **Source tables use `client_key TEXT`; admin/tower use `client_id UUID`.** Steps 2 and 3/4 use different helper variants (`can_read_tenant_by_key` vs `can_read_tenant_by_id`).

2. **`use_case_*` sub-tables lack direct `client_id`.** Policies join through `use_cases` parent. Step 4 migration must use an EXISTS subquery.

3. **Dynamic policy creation in 20260430220000 creates 12 `service_role_all_*` policies for source artifact family tables.** Step 2 migration must name-drop each individually before replacing.

4. **`agent_threads` / `agent_observations` are views, not tables.** They inherit RLS from `atlas_threads` / `atlas_observations`. No direct policy needed.

5. **`clients.tenant_key` column is NEW (added in Step 1 migration).** Steps 3 and 4 migrations depend on it; they must be applied AFTER Step 1.
