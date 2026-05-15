# Tenant-Key Canonicalization Audit

**Date:** 2026-05-15
**Migration:** `supabase/migrations/20260515120000_tenant_key_canonicalization.sql`
**Verification:** `npm run db:verify:tenant-keys`
**Helper:** `src/lib/tenant-keys.ts`

## Why this matters

The Azure AI Search adapter ([AZLAB25](./AZLAB25-ai-search-tenant-context-backfill.md))
reads tenant-scoped substrate rows and indexes them under a tenant_key
filter. If two tenant rows share semantic identity but disagree on the
string key (e.g. `meridian` vs `meridian-health`), retrieval queries split
between the two and return empty bundles. That's the parallel-run blocker
this PR closes.

## Canonical map (the only one)

| Canonical         | Historical aliases | Origin                                         |
| ----------------- | ------------------ | ---------------------------------------------- |
| `apex-retail`     | `apexretail`       | Earlier seeds dropped the hyphen.              |
| `meridian-health` | `meridian`         | "Meridian Health" was originally just "meridian". |
| `first-capital`   | `arcturus`         | Brindlemark Financial → renamed to First Capital. |

Source of truth (TypeScript): `src/lib/tenant-keys.ts`
Source of truth (SQL): the migration's `tenant_key_alias_map` temp table.
The two are kept in lockstep by `src/__tests__/unit/tenant-keys.test.ts`,
which pins the map shape.

## Audit findings

Discovered automatically via `information_schema.columns` filter on
`column_name IN ('tenant_key','client_key','tenant_client_key')`. Live DB
read 2026-05-15.

### Tables with non-canonical aliases (24 tables, ~50K rows)

| Table                                                | Column      | Total rows | Aliases found (counts)                              |
| ---------------------------------------------------- | ----------- | ---------: | --------------------------------------------------- |
| `public.clients`                                     | tenant_key  |          6 | apexretail=1, meridian=1, arcturus=1                |
| `public.enterprise_context_chunk_queue`              | tenant_key  |      3,088 | apexretail=1029, meridian=1030, arcturus=1029       |
| `public.enterprise_context_chunks`                   | tenant_key  |      6,567 | apexretail=1029, meridian=1030, arcturus=1029       |
| `public.enterprise_context_evidence`                 | tenant_key  |      3,088 | apexretail=1029, meridian=1030, arcturus=1029       |
| `public.enterprise_context_facts`                    | tenant_key  |     34,248 | apexretail=11410, meridian=11428, arcturus=11410    |
| `public.enterprise_context_quality_issues`           | tenant_key  |        450 | apexretail=146, meridian=157, arcturus=147          |
| `public.enterprise_context_records`                  | tenant_key  |      3,088 | apexretail=1029, meridian=1030, arcturus=1029       |
| `public.enterprise_context_relationships`            | tenant_key  |        660 | apexretail=220, meridian=220, arcturus=220          |
| `public.enterprise_context_snapshots`                | tenant_key  |          3 | meridian=3                                          |
| `public.enterprise_context_source_files`             | tenant_key  |         45 | apexretail=15, meridian=15, arcturus=15             |
| `public.enterprise_context_sources`                  | tenant_key  |         33 | apexretail=11, meridian=11, arcturus=11             |
| `public.enterprise_context_stewardship_tasks`        | tenant_key  |        450 | apexretail=146, meridian=157, arcturus=147          |
| `public.enterprise_context_template_runs`            | tenant_key  |          3 | apexretail=1, meridian=1, arcturus=1                |
| `public.foundational_pattern_variants`               | tenant_key  |          4 | meridian=1 *(only this alias mapped; see notes)*    |
| `public.program_approval_requests`                   | tenant_key  |         12 | apexretail=5, meridian=5, arcturus=2                |
| `public.program_attachments`                         | tenant_key  |         18 | meridian=5, arcturus=5                              |
| `public.program_audit_log`                           | tenant_key  |        644 | apexretail=8, meridian=13, arcturus=60              |
| `public.program_evidence_items`                      | tenant_key  |         16 | meridian=5, arcturus=5                              |
| `public.source_artifacts`                            | tenant_key  |         25 | meridian=1                                          |
| `public.source_event_artifact_states`                | tenant_key  |        759 | apexretail=264, meridian=429, arcturus=66           |
| `public.source_event_evidence_states`                | tenant_key  |        483 | apexretail=168, meridian=273, arcturus=42           |
| `public.source_event_gate_criterion_states`          | tenant_key  |        897 | apexretail=312, meridian=507, arcturus=78           |
| `public.source_event_participants`                   | client_key  |         24 | apexretail=4, meridian=18, arcturus=2               |
| `public.source_events`                               | client_key  |         23 | apexretail=8, meridian=13, arcturus=2               |

### Tables verified clean (already canonical)

- `public.enterprise_graph_nodes` (1,313 rows)
- `public.enterprise_graph_edges` (1,568 rows)
- `public.data_segment_graph_relationships` (202 rows)
- All 24 `public.data_segment_*` substrate tables
- All `client_<tenant>_private.*` schema-qualified tables (each schema's
  rows are always uniformly canonical)
- `public.data_ingestion_runs`, `public.data_inventory_*` (public-schema mirrors)
- `public.canonical_industry_ai_patterns`
- `public.intelligence_session_log` (0 rows; schema-only)
- `public.source_graph_edges`, `public.source_*` artifact and pricing tables
  scoped to apex-retail seed

### Tables flagged but out of scope (NOT touched by this migration)

- **`public.foundational_pattern_variants`** — has values `apex`,
  `first_capital`, `meridian`, `keystone`. The first three are an
  underscore-cased *taxonomy* used by this table, NOT historical client
  aliases. Only the literal `meridian` value was canonicalized; `apex`
  and `first_capital` were left alone. If the founder wants the taxonomy
  re-keyed to hyphenated client keys, that's a separate decision.
- **`keystone-energy-holdings` / `keystone`** — appears in `clients`,
  `program_audit_log`, and `foundational_pattern_variants`, but the
  brief authorized only three tenant mappings. The Keystone seed has
  mixed values (`keystone` in `clients.tenant_key`,
  `keystone-energy-holdings` in `program_audit_log`). Filed as
  follow-up.

## Migration shape

- Wrapped in `BEGIN; ... COMMIT;` so the entire rewrite is atomic.
- Defines `tenant_key_alias_map` as a `TEMP TABLE ... ON COMMIT DROP`,
  joined into every `UPDATE` via `FROM tenant_key_alias_map m WHERE
  tenant_key = m.alias`. Idempotent — re-runs match zero rows.
- Pre-flight checks confirmed there are **no unique-index collisions** on
  any of the 14 tables that carry `(tenant_key, *)` UNIQUE constraints
  (most of `enterprise_context_*`). Alias and canonical rows have disjoint
  key columns, so the UPDATE never collides.
- Also rewrites `current_tenant_key()` to canonicalize the JWT-claim
  on read. The Clerk-metadata seeder (`api/admin/seed-clerk-metadata`)
  still writes old aliases into `publicMetadata.clientId`; rather than
  re-seed every user we normalize on the read path so RLS keeps comparing
  apples-to-apples after the data is canonical.
- Ends with a `DO $$ ... RAISE EXCEPTION ... $$` verification that aborts
  the transaction if any alias survived.

### Why no CHECK constraint?

Several writers still hard-code old aliases. Adding a CHECK would break
them. Specifically:

- `src/app/api/admin/seed-clerk-metadata/route.ts` — seeds
  `publicMetadata.clientId` and `defaultClientId` to `'apexretail'`,
  `'meridian'`, `'arcturus'`. The migration's `current_tenant_key()`
  rewrite bridges this on the RLS side; the writer itself should
  canonicalize next.
- `src/app/(maestro)/tower/page.tsx` — `TOWER_PILOT_CLIENT_KEYS` const
  carries the old aliases.
- `src/app/(maestro)/platform/admin/quality/page.tsx` — `TenantKey` union
  literally types `'meridian' | 'firstcapital' | 'apexretail'`.
- `src/app/api/v1/source/[eventId]/artifacts/{generate,upload}/route.ts`
  — `if (clientKey === 'apexretail')` branches.
- `src/scripts/audit/audit-*.ts` — three audit scripts hard-code both
  `brokerKey` and `clientKey` per tenant.
- `supabase/migrations/20260507100000_rls_role_helpers.sql:48-58` —
  seeds `clients.tenant_key` to the old aliases for any null rows.
  Idempotent (`WHERE tenant_key IS NULL`), so safe alongside our
  canonicalization, but future bootstrap of a clean DB would re-introduce
  the aliases until the migration is updated.

These are listed as follow-ups; this PR ships only the data rewrite +
read-side normalization.

## Follow-ups

1. **Canonicalize the Clerk-metadata seeder** so newly-seeded demo users
   get canonical `clientId` and `defaultClientId`. After that lands,
   simplify `current_tenant_key()` back to a plain `auth.jwt() ->>
   'tenant_key'` extraction.
2. **Canonicalize `TOWER_PILOT_CLIENT_KEYS`** and the `TenantKey` union
   in `platform/admin/quality/page.tsx`.
3. **Canonicalize the `audit-*.ts` scripts** so the `brokerKey` /
   `clientKey` split disappears — there's only one canonical key per
   tenant now.
4. **Retire the `WHERE tenant_key IS NULL` seed in
   `20260507100000_rls_role_helpers.sql`** or update it to seed the
   canonical forms, so bootstrapping a clean DB doesn't re-introduce
   the aliases.
5. **Decide on `keystone` → `keystone-energy-holdings`** mapping and
   either ship as a follow-up data migration or document the chosen
   canonical form.
6. **Decide on `foundational_pattern_variants` taxonomy** — keep the
   underscore-cased local taxonomy, or align it to hyphenated client
   keys.
7. **Add a CI step** that runs `npm run db:verify:tenant-keys` on
   protected branches once writers are canonicalized.
