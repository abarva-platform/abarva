# RLS regression runbook (L4)

SQL-level RLS regression suite — the database-tier counterpart of the HTTP
cross-tenant probe suite at `tests/security/sec-p0-cross-tenant-probes.sh`.

- **What:** `tests/security/rls-regression.sql` — read-only SELECTs against
  every tenant-scoped public table under each canonical tenant's JWT claim.
- **Runner:** `scripts/run-rls-regression.ts` (via `npm run test:rls-regression`).
- **CI:** `.github/workflows/rls-regression.yml` — nightly + `workflow_dispatch`.
- **Layer:** L4 in
  [`docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`](../architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md).

## What it asserts

For each canonical tenant — `apex-retail`, `meridian-health`, `first-capital`
— the suite:

1. Sets `request.jwt.claims` to that tenant via `set_config(..., is_local=true)`
   and assumes the `authenticated` role (the same shape Supabase/PostgREST
   applies to a signed-in user request).
2. For every tenant-scoped table in `public.*` (discovered dynamically by
   scanning `information_schema.columns` for `tenant_key`, `client_key`, or
   `client_id`):
   - Counts the rows visible to this tenant (`SELECT count(*) FROM <t>`).
   - Counts how many of those rows belong to a **different** tenant key —
     this is the leak detector. Expected: `0`.
   - Runs an explicit cross-tenant probe (`WHERE tenant_key = '<other>'`)
     and confirms RLS filters it silently to zero rows (this is a feature,
     not a `42501 permission denied`).
3. Verifies the `service_role` bypass — a sanity check that backend code
   paths (which bypass RLS) still see all tenants.
4. Pretty-prints a per-(tenant × table) findings table via `RAISE NOTICE`,
   then `RAISE EXCEPTION` if any row was classified `leak` or `error:*`.

A finding of `empty` (zero visible rows, zero foreign rows, zero cross-tenant
leak) is informational only — a seed-light lab environment is allowed.

## When to run

| Cadence | Trigger | Environment | Owner |
|---|---|---|---|
| Nightly | `cron: '30 3 * * *'` | Lab Azure Postgres (default `lab-control`) | On-call |
| Pre-pilot cutover | `workflow_dispatch` → `production` | Production Postgres | Founder |
| Every preview deploy (manual) | `npm run test:rls-regression` against `DATABASE_URL` | Dev / preview | Author of the RLS change |
| Before merging an RLS-affecting migration | local + CI | Dev | PR author |

Production runs are read-only and side-effect-free: the script creates only
TEMP tables and runs SELECTs. It is safe to point at live customer data.

## How to add a new tenant-scoped table

No code change is required if the new table follows one of these shapes:

- `tenant_key TEXT` referencing the canonical key (`apex-retail`, …),
- `client_key TEXT` (legacy alias used by Source substrate),
- `client_id UUID` foreign-keying `public.clients(id)`.

The suite auto-discovers via `information_schema.columns`. After the migration
that adds the new table is applied, the next nightly run picks it up.

If your table needs to be **excluded** from the suite (e.g., it is a global
taxonomy or registry that intentionally crosses tenants), add it to the
exclusion list in `tests/security/rls-regression.sql`:

```sql
AND c.relname NOT IN (
  'clients',
  'schema_migrations',
  'foundational_pattern_variants',
  -- add your table here, with a one-line rationale comment
)
```

Document the rationale in the migration that introduced the table.

## What to do when a probe fails

The runner exits `1` and the SQL `RAISE EXCEPTION` text identifies how many
findings were `leak` vs `error:*`. The pretty-printed findings table appears
in the job log (and as a GitHub job summary in CI) above the failure line.

1. **Do not release.** Block any pilot deploy in progress; an RLS leak is a
   P0 incident.
2. **Page the founder.** Same call tree as SEC-P0 (HTTP probes).
3. **Reproduce locally** against the failing environment:
   ```sh
   DATABASE_URL='postgresql://…' npm run test:rls-regression
   ```
4. **Inspect the failing (tenant × table) pair.** A `leak` means either:
   - The table has no RLS policy enabled (`pg_class.relrowsecurity = false`),
     or
   - The policy is permissive in a way it should not be, or
   - A new column was added that bypasses the helper functions.
5. **Patch with a follow-up migration** that tightens the policy or enables
   RLS, then re-run the suite until green.

The `service_role` bypass check failing is a different class of bug — it
means backend code that bypasses RLS can no longer see all tenants, which
will silently break server-side aggregation.

## Coverage at time of authoring (2026-05-15)

The suite auto-discovers, so the exact list grows over time. The runner emits
`rls-regression: discovered N tenant-scoped tables` at the top of each run;
that is the authoritative count for any given snapshot of the schema.

Families enumerated by the discovery query at ship time (public.* with one
of `tenant_key | client_key | client_id`):

- `enterprise_context_*` (records, chunks, chunk_queue, evidence, facts,
  quality_issues, relationships, snapshots, source_files, sources,
  stewardship_tasks, template_runs)
- `program_*` (approval_requests, attachments, audit_log, evidence_items,
  export_log, notifications)
- `source_*` (events, event_participants, artifacts,
  event_artifact_states, event_evidence_states,
  event_gate_criterion_states, event_pricing_submissions, canvas substrate)
- `engagements`, `engagement_deliverables`, `invoices`
- `kpis`, `pattern_packs`, `atlas_threads`, `atlas_observations`
- `agent_threads`, `agent_attachments`, `turn_traces`
- `setup_*` and `ai_initiatives`
- `intelligence_threads`, `intelligence_thread_turns`,
  `intelligence_artifacts`, `portfolio_signals`, `emergent_patterns`
- Per-tenant private-schema canaries declared via CHECK constraints

Excluded (intentional cross-tenant taxonomies):

- `clients` — the tenant directory itself.
- `schema_migrations` — DBA ledger.
- `foundational_pattern_variants` — mixed-key taxonomy; flagged in the
  canonicalization audit.

## Relationship to other layers

| Layer | What it proves | Artifact |
|---|---|---|
| L4 / HTTP | API routes reject tenant-A → tenant-B requests with `403 forbidden_cross_tenant` | `tests/security/sec-p0-cross-tenant-probes.sh` |
| **L4 / SQL (this doc)** | **Postgres returns zero foreign rows for every (tenant × table) probe** | **`tests/security/rls-regression.sql`** |
| L4 / Broker | `/api/intelligence` response contains no foreign tenant IDs | tracked as follow-up in `AZURE-FULL-STACK-TEST-LAYERS.md` |
| L4 / UI | Every primary surface shows expected tenant copy only | `tests/e2e/primary-surfaces-smoke.spec.ts` |

The HTTP suite catches application-tier bugs (route handlers that fail to
scope the SQL they emit). The SQL suite catches database-tier bugs (missing
or permissive RLS policies, columns that bypass the helpers, accidental
GRANTs). Both must be green to pass L4.
