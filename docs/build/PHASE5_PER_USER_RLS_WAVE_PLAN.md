# Phase 5 · Per-user RLS rollout · Wave plan

| | |
|---|---|
| **Doc ID** | `PHASE5_PER_USER_RLS_WAVE_PLAN_2026-05-06` |
| **Status** | Ready to dispatch · **P0 pilot-blocking** |
| **Scope** | Replace service-role-only RLS with per-user, role-aware policies across the entire substrate |
| **Estimated effort** | 2 weeks (50–80 hours) of focused work |
| **Prerequisites** | Functional Clerk auth · existing service-role RLS as baseline · `person_client_memberships` table for role data |
| **Successor / parallel** | Independent of Phase 3; can run in parallel with Phase 3 if dispatched as separate sessions |
| **Reference audit** | [docs/build/audit-out/SETUP_AUDIT.md](docs/build/audit-out/SETUP_AUDIT.md) F-SU-106 · spine doc §E.3 |

---

## 1 · The problem this wave solves

Every admin, Source, Tower, and Intelligence substrate table currently uses **service-role-only RLS**:

```sql
CREATE POLICY "service_role_full_access"
  USING (true) WITH CHECK (true);
```

Every read goes through the service role. Tenant isolation is enforced at the application layer via the broker contract — the database does not know who's reading what. This is **acceptable for pilot demos but blocks first real customer**:

1. Any application-tier bug that omits a tenant filter exposes cross-tenant data
2. Direct database access (e.g., for support, debugging, or migrations) lacks tenant isolation
3. Compliance audits (SOC2 Type II, HITRUST) require database-level access controls
4. The spine doc §E.3 explicitly calls this out as pilot-required: "Negative tests required at pilot"

The wave's job is to push tenant isolation **into Postgres itself**, with role-aware policies that enforce who can read and write what within and across tenants.

---

## 2 · Scope

### In scope

- Define the canonical role/permission model (actors, roles, capability matrix)
- Wire Clerk JWT claims into Postgres (`tenant_key`, `user_role_type`, `sub` already partly exist)
- Migrate every Source, Admin/Setup, Tower, Intelligence table to per-user RLS
- Storage object RLS for the `source-artifacts` bucket
- Negative tests at the database level (cross-tenant attempts → blocked)
- Negative tests at the API level (omitted filters → blocked by RLS)
- Cross-tenant attempt logging (audit trail when something gets denied)
- Pilot-readiness checklist for the first real customer onboarding

### Out of scope

- Org-level / cross-tenant maestro flows (these stay service-role for now; the maestro role will gain cross-tenant policies in a follow-up wave)
- Per-segment write permissions for SME / program_initiator (Phase 5.1 follow-up; this wave gets read-side and admin-write-side correct)
- Time-bounded permissions (e.g., access expires after 30 days) — out of scope
- Re-keying or rotating Clerk JWT secrets — operational concern, not this wave
- Audit log retention policy — operational concern

### Explicit non-goals

- Do not rewrite the broker contract. The application-tier broker boundary stays (memory: `feedback_broker_boundary.md`). RLS is a defense-in-depth layer below it, not a replacement for it.
- Do not change the JWT shape Clerk emits. We work with what Clerk already sends.
- Do not introduce custom postgres extensions; use stock Supabase RLS + JWT helpers.

---

## 3 · Prerequisites — confirm before starting

| Check | How to verify | Expected |
|---|---|---|
| Clerk auth shipping JWT to Supabase | Inspect `auth.jwt()` shape in a live request | Returns `{tenant_key, sub, ...}` |
| `person_client_memberships` table populated | `SELECT count(*) FROM person_client_memberships` | > 0 rows for current demo tenants |
| `user_role_type` enum exists | `\dT user_role_type` in psql | Lists `maestro, client_viewer, observer` (verify list) |
| Existing service-role policies cataloged | Run policy inventory query (§5 step 1.5) | Captures every `service_role_full_access` policy |
| Test tenant isolation today | App-level — confirm Apex user can't see Meridian data via UI | App enforces; DB doesn't (yet) |
| Worktree clean | `git status` | No uncommitted changes |
| Tests baseline recorded | `npm test -- --silent 2>&1 \| tail -5` | Note pass/fail counts as the regression gate |

---

## 4 · The role / permission model

Before writing migrations, fix the canonical roles. Today the substrate has `user_role_type` enum: `maestro, client_viewer, observer`. The wave expands this if needed, in coordination with Clerk publicMetadata.

### 4.1 · Roles

| Role | Tenant scope | Read | Write | Approve | Cross-tenant |
|---|---|---|---|---|---|
| **service_role** | All | All | All | All | Yes (system-bypass) |
| **maestro** | All tenants | All within accessible tenants | All within accessible tenants | Yes | Yes (read; write requires explicit tenant context) |
| **tenant_admin** | One tenant | All in tenant | All in tenant | Yes within tenant | No |
| **program_initiator** | One tenant | Programs they own + read-shared | Programs they own; can submit for approval | No (approval requires admin) | No |
| **sme** / **observer** | One tenant | Programs they're assigned to | Comments only | No | No |
| **client_viewer** | One tenant | Read-only across tenant | None | No | No |

**Role source of truth:** Clerk JWT `publicMetadata.role` + `publicMetadata.tenant_key`. The substrate trusts what Clerk emits; the broker validates.

### 4.2 · The capability matrix (per data class)

Per substrate concern, who can do what:

| Data class | Tables | Service | Maestro | Tenant admin | Program initiator | SME | Viewer |
|---|---|---|---|---|---|---|---|
| **Source events** | `source_events`, `source_event_approvals` | RW | R | RW | R (own) | R (assigned) | R |
| **Source artifacts** | `source_artifacts`, `source_artifact_chunks`, `source_artifact_facts` | RW | R | RW | RW (own) | R | R |
| **Source pricing/commercial** | `source_pricing_components`, `source_commercial_exceptions`, `source_vendor_commitments`, `source_requirements`, `source_meeting_outcomes`, `source_graph_edges`, `source_context_receipts` | RW | R | RW | R | R | R |
| **Admin / setup** | `admin_connectors`, `admin_datasets`, `admin_dataset_approvals`, `admin_dataset_quality`, `admin_blockers`, `admin_audit_log`, `admin_setup_progress` | RW | R | RW | None | None | None |
| **Tower** | `atlas_threads`, `atlas_observations`, `agent_threads`, `agent_observations`, `signal_firings`, `use_cases` | RW | R | R | R | R | R |
| **Intelligence** | `kpis`, `pattern_packs`, `external_sources`, `external_events`, `evidence`, `benchmark_cohorts`, `telemetry_sources` | RW | R | R | R | R | R |
| **Tenant private** | `client_<tenant>_private.tenant_metric_observations` | RW | R (own tenant only) | RW | R | R | R |
| **Storage** | `source-artifacts` bucket | RW | R | RW | RW (own) | R | R |

R = read; W = write; RW = read+write; "own" = restricted to rows the user owns.

**Note on "Read" for cross-tenant data (Tower / Intelligence):** these tables hold cross-tenant pattern packs and benchmarks; everyone reads. Tenant data within them (e.g., a benchmark referencing tenant data) is masked at the broker layer.

### 4.3 · How RLS reads role + tenant from JWT

```sql
-- Helper function (already exists in some migrations)
CREATE OR REPLACE FUNCTION current_tenant_key() RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'tenant_key'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', 'observer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_maestro() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'maestro'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_tenant_admin() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'tenant_admin'
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

Build these as a shared migration (Step 1) so every per-table policy can reference them.

---

## 5 · Phased steps

### Step 1 · Role helper functions migration (2-3 hours)

Create [supabase/migrations/20260507100000_rls_role_helpers.sql](supabase/migrations/20260507100000_rls_role_helpers.sql):

- Define `current_tenant_key()`, `current_user_role()`, `current_user_id()`, `is_maestro()`, `is_tenant_admin()`, `is_program_initiator()`, `can_read_tenant(text)`, `can_write_tenant(text)` helpers
- All `STABLE SECURITY DEFINER` so RLS can call them without recursion
- Document each helper inline

**Diff target:** 1 migration file ~80 lines.

### Step 1.5 · Inventory existing RLS policies (1 hour)

Run a discovery query and save output:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE policyname LIKE 'service_role%' OR roles && ARRAY['service_role']::name[]
ORDER BY schemaname, tablename;
```

Save to `docs/build/audit-out/RLS_POLICY_INVENTORY_PRE_PHASE5.md`. This is the baseline; every policy in this list either gets replaced (per-user) or explicitly retained (system-internal tables).

**Output:** ~50-100 row inventory.

### Step 2 · Source table migration · read policies (4-6 hours)

Create [supabase/migrations/20260507110000_source_per_user_rls_read.sql](supabase/migrations/20260507110000_source_per_user_rls_read.sql):

For each Source table — `source_events`, `source_event_approvals`, `source_artifacts`, `source_artifact_chunks`, `source_artifact_facts`, `source_pricing_components`, `source_commercial_exceptions`, `source_vendor_commitments`, `source_requirements`, `source_meeting_outcomes`, `source_graph_edges`, `source_context_receipts` — add:

```sql
DROP POLICY IF EXISTS "service_role_full_access" ON source_events;

-- Service role still bypasses everything
CREATE POLICY "service_role_all_source_events" ON source_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users read within their tenant
CREATE POLICY "authenticated_read_source_events_by_tenant" ON source_events
  FOR SELECT TO authenticated
  USING (
    client_key = current_tenant_key()
    OR is_maestro()
  );
```

Apply same pattern to every Source table, using the right tenant column name (`tenant_key`, `client_key`, etc. — already differs per migration; preserve existing names).

**Diff target:** 1 migration ~250-400 lines.

### Step 3 · Admin / Setup table migration · read policies (3-4 hours)

Create [supabase/migrations/20260507120000_admin_per_user_rls_read.sql](supabase/migrations/20260507120000_admin_per_user_rls_read.sql):

For each admin table — `admin_connectors`, `admin_datasets`, `admin_dataset_approvals`, `admin_dataset_quality`, `admin_blockers`, `admin_audit_log`, `admin_setup_progress` — add:

```sql
CREATE POLICY "authenticated_read_admin_X_by_tenant" ON admin_X
  FOR SELECT TO authenticated
  USING (
    tenant_key = current_tenant_key()
    AND (is_tenant_admin() OR is_maestro())
  );
```

Note the role gate: only tenant_admin and maestro can read admin tables (program_initiator and SME do not see admin data).

**Diff target:** 1 migration ~200 lines.

### Step 4 · Tower / Intelligence migration · read policies (3-4 hours)

Tower (`atlas_threads`, `atlas_observations`, `agent_threads`, `agent_observations`, `signal_firings`, `use_cases`, `use_case_*`) and Intelligence (`kpis`, `pattern_packs`, `external_sources`, `external_events`, `evidence`, `benchmark_cohorts`, `telemetry_sources`) tables get tenant-scoped reads with broader access (everyone in tenant reads).

```sql
CREATE POLICY "authenticated_read_atlas_threads_by_tenant" ON atlas_threads
  FOR SELECT TO authenticated
  USING (
    can_read_tenant(client_id::text)   -- atlas_threads uses client_id (UUID), not client_key
  );
```

Different tables use `client_id` UUID (Tower) vs `client_key` text (Source). Helper `can_read_tenant()` should accept both — overload or version it.

**Diff target:** 1 migration ~250 lines.

### Step 5 · Write policies migration (5-7 hours)

Separate migration for write paths (INSERT, UPDATE, DELETE). Rule of thumb: writes are stricter than reads.

- `source_events`, `source_artifacts`, `source_event_approvals`: only tenant_admin or program_initiator (within tenant) can write
- `admin_*` tables: only tenant_admin or maestro
- `atlas_*` / `agent_*` tables: only service_role writes (these are system-managed)
- Tenant private schemas: only service_role writes (loader-only)

[supabase/migrations/20260507130000_per_user_rls_write.sql](supabase/migrations/20260507130000_per_user_rls_write.sql) ~300 lines.

### Step 6 · Storage object RLS (1-2 hours)

Update `source-artifacts` bucket storage policies (already partially in [20260430220000_source_artifact_registry.sql](supabase/migrations/20260430220000_source_artifact_registry.sql)):

```sql
-- Tenant prefix isolation already exists; add role gate
DROP POLICY IF EXISTS "source_artifacts_select_tenant_path" ON storage.objects;
CREATE POLICY "source_artifacts_select_tenant_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = current_tenant_key()
    -- Add: only tenant_admin or program_initiator can list artifacts
    AND (is_tenant_admin() OR current_user_role() = 'program_initiator' OR is_maestro())
  );
```

**Diff target:** 1 migration ~50 lines.

### Step 7 · Negative tests at the database level (4-6 hours)

Create test infrastructure that runs RLS against impersonated JWTs. Two patterns:

1. **PG-level integration tests** — use [supertest with a real Supabase client at different roles](https://supabase.com/docs/guides/auth/row-level-security#testing-rls):
   - Set up test tenants A and B with seeded data
   - Authenticate as user-in-tenant-A
   - Attempt cross-tenant SELECT, INSERT, UPDATE, DELETE on every table
   - Assert each is blocked
   - Test for each role (tenant_admin, program_initiator, sme, viewer, maestro)

2. **API-level negative tests** — at `src/__tests__/integration/security/per-user-rls.test.ts`:
   - Mock authenticated context with cross-tenant claims
   - Attempt API calls that should be blocked
   - Assert HTTP 403 or empty result set, never tenant B data

Test matrix size: 5 roles × ~30 tables × 4 actions (SELECT/INSERT/UPDATE/DELETE) = ~600 negative test cases. Most can be parameterized.

**Diff target:** 2-3 new test files ~600 lines total.

### Step 8 · Audit logging for cross-tenant attempts (2-3 hours)

When RLS denies a query, log it. Postgres doesn't naturally log RLS denials, so do this at the application layer:

- In the Supabase client wrapper, catch `rls_violation` errors
- Write to `admin_audit_log` with category `rls_violation`, actor_id from JWT, attempted_tenant_key, attempted_table
- Surface the log to an alert pipeline (out of scope for this wave; just persist)

**Diff target:** 1-2 lib files modified ~100 lines.

### Step 9 · App-tier broker integration (2-3 hours)

The broker contract (memory: `feedback_broker_boundary.md`) must continue to enforce tenant isolation as defense-in-depth. With RLS now enforcing at DB-level:

- Brokers stay as before — they validate, route, scope
- Add: brokers verify their authenticated user's tenant matches the requested tenant; reject mismatches before reaching the DB
- This way, RLS is the safety net but brokers are the primary enforcement

Update [src/lib/agent/context-builder.ts](src/lib/agent/context-builder.ts) and [src/lib/intelligence/sentinel-broker-adapter.ts](src/lib/intelligence/sentinel-broker-adapter.ts) to assert tenant alignment.

**Diff target:** 2-3 broker files modified ~80 lines.

### Step 10 · Migration apply + smoke (1-2 hours)

Apply migrations to dev, then staging:

```bash
npm run db:migrate
```

Run the seed scripts to confirm data still loads:

```bash
npm run db:seed
```

Hit every product surface in the deployed UI as a known tenant user. Confirm:
- Apex Retail user sees Apex data
- Meridian user sees Meridian data
- No surface broken with empty results (would indicate RLS too strict)
- No surface returning cross-tenant data (would indicate RLS too loose)

### Step 11 · Pilot-readiness verification (3-4 hours)

This is the gate. The wave ships when these are all true:

1. Run the full negative test suite — every cross-tenant attempt blocked
2. Run a manual penetration test:
   - Hand a tester (or yourself) the authenticated context for tenant A
   - Try every documented attack vector: SQL injection in tenant_key, JWT manipulation, omitted filters, race conditions
   - Document what worked and what didn't
3. Update [docs/build/audit-out/SETUP_AUDIT.md](docs/build/audit-out/SETUP_AUDIT.md) F-SU-106 from "P0" to "Resolved" with link to this wave
4. Update [docs/build/audit-out/SOURCE_AUDIT_EXECUTIVE_SUMMARY.md](docs/build/audit-out/SOURCE_AUDIT_EXECUTIVE_SUMMARY.md) — mark Phase 5 complete
5. Memory: add `project_per_user_rls_pilot_ready.md` documenting the ship + the date pilot can begin

### Step 12 · Operational runbook (1-2 hours)

Create [docs/build/RLS_OPERATIONS_RUNBOOK.md](docs/build/RLS_OPERATIONS_RUNBOOK.md):

- How to add a new table with the right policies (template)
- How to debug "RLS rejected my query" errors
- How to grant a maestro cross-tenant access for support purposes (requires explicit override)
- How to revoke access cleanly
- The audit log query for tracking RLS violations

This is for the team that operates the platform post-pilot.

---

## 6 · Risk + mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| RLS policy bug exposes cross-tenant data | High impact, low likelihood | Negative test suite catches; pen-test step verifies; gradual rollout (dev → staging → prod) |
| RLS policy too strict; legitimate use case broken | High likelihood, high impact | Manual smoke at every surface; rollback plan = revert migration |
| JWT claims missing or malformed | Medium | Helpers default to safe values (observer role, null tenant_key); test for missing claim explicitly |
| Service role accidentally used in user-facing path | Medium | Audit existing code paths; assert no service role in `/api/v1/**` user routes |
| Performance regression from RLS overhead | Low | RLS adds milliseconds per query; index on tenant columns mitigates |
| Maestro role can read everything across tenants | By design — high impact if maestro JWT leaks | Maestro role granted only to internal users; rotate keys regularly |
| Existing seed data uses inconsistent tenant identifiers | Medium | Inventory step 1.5 catches; seeds may need updates to use canonical tenant keys |
| Tenant private schemas conflict with main RLS approach | Low | Private schemas already isolated; document the boundary |
| Cron jobs and scheduled tasks lose access | Medium | Cron jobs use service_role JWTs; explicitly carve them out |
| Storage bucket RLS edge case (signed URLs) | Medium | Test signed URL flows; ensure they remain tenant-scoped |

---

## 7 · Acceptance criteria

The wave ships when ALL of the following are true:

1. ✅ Every Source, Admin, Tower, Intelligence table has per-user RLS replacing service-role-only
2. ✅ Storage bucket RLS includes role gate
3. ✅ Cross-tenant negative tests at PG level all pass (every attempt blocked)
4. ✅ Cross-tenant negative tests at API level all pass
5. ✅ App-tier broker contracts validated as defense-in-depth
6. ✅ Manual penetration test produces zero successful cross-tenant reads or writes
7. ✅ Apex / Meridian / Arcturus tenant smokes — each user sees only their tenant's data
8. ✅ No regression on the test baseline established in §3
9. ✅ Operations runbook published
10. ✅ Audit findings F-SU-106 closed
11. ✅ Memory entry added documenting pilot readiness

---

## 8 · Effort breakdown

| Step | Hours |
|---|---|
| 1 · Role helper functions | 2-3 |
| 1.5 · Policy inventory | 1 |
| 2 · Source read policies | 4-6 |
| 3 · Admin read policies | 3-4 |
| 4 · Tower / Intelligence read policies | 3-4 |
| 5 · Write policies | 5-7 |
| 6 · Storage RLS | 1-2 |
| 7 · Negative test suite | 4-6 |
| 8 · Audit logging | 2-3 |
| 9 · Broker integration | 2-3 |
| 10 · Migration apply + smoke | 1-2 |
| 11 · Pilot-readiness verification + pen-test | 3-4 |
| 12 · Operations runbook | 1-2 |
| **Total** | **~32-47 focused hours** |

Calendar: 1.5–2 weeks with focused single-session-per-day; can compress to 1 week with parallelism (Steps 2-4 are independent and parallelizable).

---

## 9 · Rollout plan

Three-stage deploy:

1. **Dev** — apply migrations, run negative tests, smoke surfaces. ~half day.
2. **Staging** — apply migrations against staging DB, run automated tests against staging URL, manual smoke as Apex user. ~1 day.
3. **Production** — apply during low-traffic window with rollback script ready. Monitor admin_audit_log for unexpected RLS violations. ~half day, plus 24h watchdog.

If any stage flags issues, roll back the migration via the down-migration. Down-migrations restore service-role-only as the safe state.

---

## 10 · Dispatcher's note · how to start the next session

When starting Phase 5:

1. **Read this plan top to bottom** (~20 min)
2. **Run prerequisite checklist (§3)** — including baseline test run. Stop if anything fails.
3. **Run policy inventory (Step 1.5)** before writing any new policies — saves work and avoids missing tables
4. **Work in dependency order** — Step 1 helpers must land before Steps 2-4 can use them
5. **Steps 2-4 can parallelize** if dispatched as separate agent tasks
6. **Step 7 is the critical gate** — negative tests are the proof RLS is correct; do not skip
7. **Step 11 pen-test is non-negotiable** — find someone outside the implementation flow to do it; self-pen-testing has blind spots
8. **Save progress per step** — each migration is a separate commit; rollback is per-migration

The wave is large but largely mechanical (policy migrations are templated). The hard parts are:
- Defining the role/permission model precisely (§4)
- Negative test coverage (Step 7)
- Pen-testing (Step 11)

Spend disproportionate time on §4, Step 7, and Step 11.

---

## 11 · What this wave does NOT do

- **Doesn't implement maestro cross-tenant write flows.** Maestro can read across tenants; cross-tenant writes are a follow-up wave with extra audit and approval flows
- **Doesn't introduce time-bounded permissions.** All grants are persistent; revocation is manual via Clerk publicMetadata change
- **Doesn't change the JWT shape Clerk sends.** Works with existing claims
- **Doesn't add UI for permission management.** Out of scope; users are added/removed via Clerk admin
- **Doesn't address sub-segment write permissions for SME.** All in-tenant writes are tenant_admin-gated; SME write flows are Phase 5.1 follow-up

---

## 12 · Coordination with Phase 3

Phase 5 and Phase 3 (Source Sentinel-front refactor) are independent waves. They can run in parallel as separate sessions because:

- Phase 3 changes application code (orchestrator, types, components, tests) — no DB schema
- Phase 5 changes substrate (RLS policies, migrations) — no application code routing changes (only broker validation upgrades)

Merge conflict surface is small. If both run in parallel:
- Phase 3 first to merge: Phase 5 doesn't need to update anything
- Phase 5 first to merge: Phase 3 picks up the new RLS policies; broker contracts updated for defense-in-depth become relevant in Phase 3's UI changes (no new work)

Neither wave's acceptance criteria depend on the other.

---

## 13 · Optional follow-ups · post-Phase 5

- Phase 5.1 · Per-segment write permissions for SME / program_initiator (e.g., SME can write to deliverables for assigned programs only)
- Time-bounded permission grants (auto-expire after X days)
- Cross-tenant maestro write flows (with extra audit + approval)
- RLS performance optimization (denormalize tenant_key into hot tables to avoid JOIN cost)
- Permission management UI in `/admin/users-access`
- Session-bounded elevated access ("break glass" for support engineers with auto-revert)

Each is its own wave. Ship Phase 5 first.

---

End of wave plan.
