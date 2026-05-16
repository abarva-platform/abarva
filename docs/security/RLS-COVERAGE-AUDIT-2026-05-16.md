# RLS coverage audit — 2026-05-16

Pilot-readiness audit of Row Level Security coverage on tenant-scoped tables.
Companion to the SQL-level RLS regression suite
(`tests/security/rls-regression.sql`, PR #1977) and the per-user RLS rollout
(Phase 5, `supabase/migrations/20260507100000_rls_role_helpers.sql`).

- **Scope:** every `public.*` base table carrying a tenant-identity column
  (`tenant_key`, `client_key`, or `client_id`).
- **Method:** `scripts/audit/rls-coverage-audit.ts` — SELECT-only. Reuses the
  exact discovery query from `rls-regression.sql` (the `pg_class` +
  `information_schema.columns` LATERAL join), so this audit and the regression
  suite agree on what counts as "tenant-scoped".
- **A table is a gap** when it has a tenant column AND either (a) RLS is not
  enabled (`pg_class.relrowsecurity = false`), or (b) RLS is enabled but zero
  policies are attached (`pg_policies` count = 0).
- **Database:** production `DATABASE_URL` (read-only connection).

## Headline

| Metric | Value |
|---|---|
| Tenant-scoped tables scanned | 155 |
| Intentional exclusions (not gaps) | 2 (`clients`, `schema_migrations`) |
| **Tables with an RLS gap** | **24** |
| High-criticality (real tenant data) | **24** |
| Low-criticality (empty / staging) | 0 |

Every gap table currently has `relrowsecurity = true` but **zero policies**.
A table in that state is fail-*closed* for the `authenticated` role (no policy
⇒ no rows visible) — so this is not an active cross-tenant *leak*. But it is a
correctness and pilot-readiness gap: tenant users cannot read their own data
through an `authenticated` connection, and the moment a permissive policy is
added by mistake the table is wide open. Every tenant-scoped table must carry
an explicit, tenant-scoped policy. The `relrowsecurity = true / 0 policies`
state was almost certainly produced by the blanket
`20260513073000_public_rls_security_advisor_lockdown.sql` enabling RLS without
attaching per-table policies.

## Gap tables — all high-criticality

All 24 gap tables hold live data for **all three** canonical tenants
(`apex-retail`, `meridian-health`, `first-capital`). None is empty or staging.

| Table | Tenant column | RLS enabled | Policy count | Rows | Distinct tenants |
|---|---|---|---|---|---|
| `data_segment_ai_transformation` | `tenant_key` | yes | 0 | 30 | 3 |
| `data_segment_compliance` | `tenant_key` | yes | 0 | 71 | 3 |
| `data_segment_cross_program_signals` | `tenant_key` | yes | 0 | 49 | 3 |
| `data_segment_decision_traces` | `tenant_key` | yes | 0 | 39 | 3 |
| `data_segment_enterprise_profile` | `tenant_key` | yes | 0 | 3 | 3 |
| `data_segment_evidence_ledger` | `tenant_key` | yes | 0 | 92 | 3 |
| `data_segment_financial_model` | `tenant_key` | yes | 0 | 153 | 3 |
| `data_segment_graph_relationships` | `tenant_key` | yes | 0 | 202 | 3 |
| `data_segment_industry_context` | `tenant_key` | yes | 0 | 49 | 3 |
| `data_segment_it_financials` | `tenant_key` | yes | 0 | 356 | 3 |
| `data_segment_it_landscape` | `tenant_key` | yes | 0 | 373 | 3 |
| `data_segment_kpi_dictionary` | `tenant_key` | yes | 0 | 310 | 3 |
| `data_segment_kpi_history` | `tenant_key` | yes | 0 | 678 | 3 |
| `data_segment_operating_telemetry` | `tenant_key` | yes | 0 | 94 | 3 |
| `data_segment_org_structure` | `tenant_key` | yes | 0 | 391 | 3 |
| `data_segment_peer_benchmarks` | `tenant_key` | yes | 0 | 96 | 3 |
| `data_segment_program_deliverables` | `tenant_key` | yes | 0 | 24 | 3 |
| `data_segment_program_inventory` | `tenant_key` | yes | 0 | 18 | 3 |
| `data_segment_scenario_library` | `tenant_key` | yes | 0 | 6 | 3 |
| `data_segment_sourcing_artifacts` | `tenant_key` | yes | 0 | 95 | 3 |
| `data_segment_stakeholder_notes` | `tenant_key` | yes | 0 | 9 | 3 |
| `data_segment_vendor_contracts` | `tenant_key` | yes | 0 | 155 | 3 |
| `data_segment_vendor_intelligence` | `tenant_key` | yes | 0 | 6 | 3 |
| `session_messages` | `client_id` | yes | 0 | 2 | 1 |

These are the substrate tables loaded directly into Supabase in the
2026-04-30 / 05-01 tenant data drop (14+ segments per tenant; see the "Apex
tenant data drop" project note). They back the Enterprise Data Room broker.
They were never given RLS policies because they were bulk-loaded outside the
migration that introduced per-user RLS.

## Policy shapes — NOT uniform

Two distinct shapes are required:

### Shape A — `tenant_key TEXT` (23 of 24 tables)

All `data_segment_*` tables store the tenant as `tenant_key TEXT`. The proposed
policy is the same `auth_read` pattern used by
`20260515200000_sensitive_upload_audit.sql`:

```sql
CREATE POLICY auth_read ON data_segment_<name>
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_key));
```

`can_read_tenant_by_key(p_tenant_key TEXT)`
(`20260507100000_rls_role_helpers.sql`) returns true when the row's key equals
`current_tenant_key()` (the JWT `tenant_key` claim) or the caller `is_maestro()`.

> **Key-format dependency — flagged for review.** The `data_segment_*` tables
> store **hyphenated** broker keys (`apex-retail`, `meridian-health`,
> `first-capital`), whereas `clients.tenant_key` stores **non-hyphenated**
> slugs (`apexretail`, `meridian`). `can_read_tenant_by_key` does a *direct*
> string compare against `current_tenant_key()` and never touches `clients`,
> so the policy is correct **iff the Clerk `supabase` JWT template emits the
> hyphenated form**. The RLS regression suite (`rls-regression.sql`) seeds the
> hyphenated keys, so this migration is consistent with the regression suite.
> Confirm the live Clerk JWT template before pilot, or these reads will
> silently return zero rows. This is the same `apexretail` vs `apex-retail`
> split tracked in the "Apex tenant key split" project note.

### Shape B — `session_messages.client_id` (1 table)

`session_messages.client_id` is **`TEXT`, not a UUID FK to `clients`**, and it
stores the tenant *slug* (`"meridian"`), not a `clients.id` UUID. Despite the
column name, it is not a foreign key. The correct helper is the **TEXT
overload** `can_read_tenant_by_id(p_client_id TEXT)`, which resolves either
`clients.id::text` **or** `clients.tenant_key` — so it handles a column that
holds a slug:

```sql
CREATE POLICY auth_read ON session_messages
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_id(client_id));   -- TEXT overload
```

If `session_messages.client_id` is later migrated to a real UUID FK, the
policy needs no change — the same TEXT overload still resolves `id::text`. No
join to `clients` is hand-written here because the helper already encapsulates
it.

## Excluded tables (intentionally tenant-agnostic)

Consistent with the `rls-regression.sql` exclusion list:

- **`clients`** — the tenant directory itself; rows ARE tenants. Carries its
  own `public_rls_security_advisor_lockdown` policy.
- **`schema_migrations`** — DBA migration ledger; global by design.
- `foundational_pattern_variants` — cross-tenant taxonomy; excluded by
  `rls-regression.sql` but it was **not** flagged as a gap here (it already
  has a policy or no tenant column in this snapshot), so no action.

No table was force-fitted with a policy. Any `public.*` table with no tenant
column at all is out of scope by construction (the discovery query never
selects it).

## Remediation

`supabase/migrations/20260516090000_rls_coverage_gaps.sql` (this PR) adds
`ENABLE ROW LEVEL SECURITY` (idempotent — already enabled) + a tenant-scoped
`auth_read` policy + `GRANT SELECT TO authenticated` for all 24 tables, using
Shape A for the 23 `data_segment_*` tables and Shape B for `session_messages`.

**The migration is proposed, not applied.** It must be reviewed and then run
through the project migration runner (`npm run db:migrate`). After it is
applied, the next `npm run test:rls-regression` run should reclassify these
tables from `empty`/`error` to `pass`.

Writes are intentionally **not** granted: the substrate is loaded by
service-role tooling, which bypasses RLS. Add a `can_write_tenant_by_key`
write policy only if a tenant-user write path is introduced.
