# RLS Operations Runbook · Phase 5

**For:** Engineers operating the platform post-pilot  
**Covers:** Adding tables, debugging denials, escalating access, auditing violations  
**Last updated:** 2026-05-07

---

## 1 · How to add a new table with the right policies

Every new tenant-scoped table needs three things:

### Step A · Enable RLS and add service_role bypass
```sql
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_my_new_table" ON my_new_table
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### Step B · Add read policy for authenticated users

**If the table has a text tenant key (`tenant_key TEXT` or `client_key TEXT`):**
```sql
DROP POLICY IF EXISTS "authenticated_read_my_new_table" ON my_new_table;
CREATE POLICY "authenticated_read_my_new_table" ON my_new_table
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT ON my_new_table TO authenticated;
```

**If the table has a UUID FK to clients (`client_id UUID`):**
```sql
DROP POLICY IF EXISTS "authenticated_read_my_new_table" ON my_new_table;
CREATE POLICY "authenticated_read_my_new_table" ON my_new_table
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON my_new_table TO authenticated;
```

**If the table has no tenant column (global/system table — rare):**
```sql
CREATE POLICY "authenticated_read_my_new_table" ON my_new_table
  FOR SELECT TO authenticated
  USING (true);  -- add role gate if needed: AND is_tenant_admin()
```

### Step C · Add write policy (if authenticated users should write)

For source/program data (initiator-level writes):
```sql
CREATE POLICY "authenticated_write_my_new_table" ON my_new_table
  FOR INSERT TO authenticated
  WITH CHECK (
    can_read_tenant_by_key(tenant_key)
    AND is_program_initiator()
  );
GRANT INSERT ON my_new_table TO authenticated;
```

For admin-only writes:
```sql
CREATE POLICY "tenant_admin_write_my_new_table" ON my_new_table
  FOR ALL TO authenticated
  USING ( can_read_tenant_by_id(client_id) AND is_tenant_admin() )
  WITH CHECK ( can_read_tenant_by_id(client_id) AND is_tenant_admin() );
GRANT INSERT, UPDATE, DELETE ON my_new_table TO authenticated;
```

For system-managed tables (block authenticated writes):
```sql
CREATE POLICY "block_authenticated_write_my_new_table" ON my_new_table
  FOR INSERT TO authenticated
  WITH CHECK (false);
```

---

## 2 · How to debug "RLS rejected my query" errors

### Symptom A: Query returns empty rows, no error
This is a silent RLS SELECT denial. RLS never throws for SELECT; it just
returns no rows. Diagnose by:
1. Check the table has `authenticated_read_*` policy applied
2. Verify the user's JWT includes `tenant_key` matching the column value:
   ```sql
   -- In Supabase SQL editor, impersonating the user's JWT:
   SELECT auth.jwt() ->> 'tenant_key';  -- should return 'apexretail' etc.
   SELECT auth.jwt() ->> 'role';         -- should return 'maestro', 'tenant_admin', etc.
   ```
3. Check `clients.tenant_key` is populated for the user's tenant:
   ```sql
   SELECT id, name, tenant_key FROM clients WHERE tenant_key = 'apexretail';
   ```

### Symptom B: Supabase error code 42501 (insufficient_privilege)
An authenticated user tried to INSERT/UPDATE/DELETE without permission.
1. Check which policy fired: look in `admin_audit_log` for recent `rls_violation` entries
2. Verify the user's `role` claim matches the write policy requirement:
   - Source events INSERT: needs `is_program_initiator()` — role must be one of `maestro, admin, tenant_admin, client_admin, program_initiator, program_member, source_member`
   - Admin table writes: needs `is_tenant_admin()` — role must be one of `maestro, admin, tenant_admin, client_admin`
3. If the role is correct, check the user's `clientId` claim matches the table's tenant column

### Symptom C: Application returns 403 but no DB error
The application-tier `assertTenantAlignmentWithJwt()` rejected the request
before it reached the DB. Check:
1. The requested tenant key matches the user's Clerk `publicMetadata.clientId`
2. The Clerk user has the right role in `publicMetadata.role`
3. See `admin_audit_log` for `rls_violation` entries with `action_type = 'rls_violation'`

### Query: list recent RLS violations
```sql
SELECT
  actor_user_id,
  actor_role,
  entity_type,
  entity_id,
  metadata->>'operation' as operation,
  metadata->>'attempted_tenant_key' as attempted_tenant,
  metadata->>'jwt_tenant_key' as jwt_tenant,
  metadata->>'error_code' as error_code,
  created_at
FROM admin_audit_log
WHERE action_type = 'rls_violation'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 3 · How to grant a maestro cross-tenant access for support purposes

Maestros (`publicMetadata.role = 'maestro'`) already have cross-tenant read
via `is_maestro()`. No special grants needed.

If a non-maestro engineer needs temporary cross-tenant read for support:
1. In Clerk dashboard, set `publicMetadata.role = 'maestro'` temporarily
2. After support session, revert to their original role
3. **Never** grant `maestro` role permanently to non-Abarva engineers
4. Log the grant in the manual operations log (not automated)

---

## 4 · How to revoke access cleanly

Revocation is always via Clerk `publicMetadata`:
1. In Clerk dashboard, find the user
2. Update `publicMetadata.clientId` to remove their tenant key
3. Update `publicMetadata.role` to `observer` (or remove entirely)
4. The next Supabase request with their JWT will hit `current_tenant_key() → NULL`
   and all tenant-scoped reads will silently return empty
5. No migration needed — RLS reads from the live JWT on every query

---

## 5 · Pilot onboarding checklist (before first real customer)

Run this checklist for each new tenant before onboarding:

- [ ] `clients.tenant_key` is populated for the new tenant
- [ ] Demo user accounts created in Clerk with correct `publicMetadata.clientId`
- [ ] At least one user has `tenant_admin` role
- [ ] Run negative test: log in as tenant A user, attempt to fetch tenant B source_events → empty result
- [ ] Run positive test: log in as tenant A user, fetch tenant A source_events → non-empty result
- [ ] Check `admin_audit_log` has no unexpected `rls_violation` entries after smoke
- [ ] Verify storage bucket: tenant A user cannot access `source-artifacts/{tenant_B}/...` path

---

## 6 · Known limitations and follow-up waves

| Limitation | Follow-up wave |
|---|---|
| SME/program_initiator segment-level write permissions (currently admin-gated) | Phase 5.1 |
| Time-bounded permission grants | Phase 5.2 |
| Cross-tenant maestro write flows with audit | Phase 5.3 |
| Permission management UI in `/admin/users-access` | Future |
| `program-attachments` bucket role gate (currently path-only) | Phase 5.1 |
| Private schemas (tenant_metric_observations) per-user access | Future |

---

## 7 · Helper function reference

| Function | Return | Usage |
|---|---|---|
| `current_tenant_key()` | TEXT | JWT `tenant_key` claim |
| `current_user_role()` | TEXT | JWT `role` claim (default: `observer`) |
| `current_user_id()` | TEXT | JWT `sub` claim |
| `is_maestro()` | BOOL | Role is `maestro`, `admin`, or `investor` |
| `is_tenant_admin()` | BOOL | Role is `maestro`, `admin`, `tenant_admin`, or `client_admin` |
| `is_program_initiator()` | BOOL | Role allows program/source data writes |
| `can_read_tenant_by_key(TEXT)` | BOOL | Tenant key matches JWT, or maestro |
| `can_read_tenant_by_id(UUID)` | BOOL | UUID→key lookup matches JWT, or maestro |
| `can_write_tenant_by_key(TEXT)` | BOOL | Tenant match AND admin role |
| `can_write_tenant_by_id(UUID)` | BOOL | UUID→key match AND admin role |
