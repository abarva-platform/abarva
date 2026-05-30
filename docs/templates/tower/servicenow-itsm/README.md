# Tower · ServiceNow ITSM bundle

This template is the entry point for getting **real ServiceNow incident,
problem, and change data** into the Control Tower. Atlas uses it to compute
MTTR, P1/P2 counts, and change-success rate per business service over the
trailing 90 days.

| Field | Value |
|---|---|
| Slice | S6 — ServiceNow ITSM ingest |
| Template path | `public/templates/tower/servicenow-itsm/template.xlsx` |
| Target table | `tower_itsm_records` |
| CLI | `src/scripts/tower/ingest-servicenow-itsm.ts` |
| Parser | `src/lib/tower/ingest/servicenow-itsm/parse.ts` |
| Validator | `src/lib/tower/ingest/servicenow-itsm/validate.ts` |

The template ships with **~500 synthetic Northwind Retail records** across
twelve business services and the past 90 days. The synthetic banner at the top
of the Data sheet makes the demo nature obvious. Delete every sample row before
uploading real data.

---

## 1. Where the data comes from in ServiceNow

ServiceNow exposes three tables that map onto our `record_type` enum:

| ServiceNow table | `record_type` value |
|---|---|
| `incident` | `incident` |
| `problem` | `problem` |
| `change_request` | `change` |

Three ways to get an extract, ordered by how painless they are:

1. **Scheduled CSV export.** In ServiceNow → System Definition → Scheduled
   Imports / Exports. Configure one job per table, deliver to S3 / SFTP /
   email. Easiest if your IT ops team already runs nightly extracts.
2. **Table API.** `GET /api/now/table/{table}` with a `sysparm_query` for the
   trailing 90 days plus a `sysparm_fields` allowlist to keep the payload
   small. Auth via basic creds or OAuth.
3. **Reports → Export → CSV.** Build a custom report per table for the last
   90 days. One-off but unblock-friendly if you can't get API creds yet.

Whichever you pick, concatenate the three table extracts into the **Data**
sheet of the template — one row per record.

---

## 2. Field mapping (ServiceNow → template column)

| ServiceNow field | Template column | Notes |
|---|---|---|
| `number` | `record_number` | `INC*`, `PRB*`, `CHG*`. Required, unique per record. |
| `sys_class_name` | `record_type` | `incident` / `problem` / `change_request` → `change`. |
| `priority` | `priority` | `1`-`4` or `P1`-`P4`. Required. |
| `business_service` (or `cmdb_ci`) | `service` | The business service the record is tagged against. Required. |
| `assignment_group` | `assignment_group` | Optional. |
| `sys_created_on` (or `opened_at`) | `opened_at` | ISO8601 UTC. Required. |
| `closed_at` (or `resolved_at`) | `closed_at` | ISO8601 UTC. Blank if still open. Must be ≥ `opened_at`. |
| `calendar_duration` | `mttr_minutes` | Optional. Parser computes from timestamps when blank. |
| `close_code` (changes only) | `change_success` | `true` / `false` / blank. Only set for change records. |

The parser tolerates header casing and whitespace, plus the legacy ServiceNow
date format `YYYY-MM-DD HH:MM:SS` (interpreted as UTC).

---

## 3. Validation invariants

These are enforced by `validateItsmRecords` and by table-level `CHECK`
constraints in the `tower_itsm_records` migration:

- `priority ∈ {P1, P2, P3, P4}`
- `record_type ∈ {incident, problem, change}`
- `opened_at` is a valid ISO8601 timestamp.
- `closed_at`, if present, is ≥ `opened_at`.
- `mttr_minutes` is non-negative; recomputed from timestamps when omitted or
  when the stored value disagrees with the timestamps.
- `change_success` is `null` for `incident` and `problem` rows.

---

## 4. Running the ingest

```bash
# Dry-run — parse + validate, no DB writes.
npx tsx src/scripts/tower/ingest-servicenow-itsm.ts \
  --tenant northwind-retail \
  --file ./extracts/servicenow-itsm-2026-05-28.csv \
  --dry-run

# Commit. Idempotent — re-running is safe (upsert on tenant_key + record_number).
npx tsx src/scripts/tower/ingest-servicenow-itsm.ts \
  --tenant northwind-retail \
  --file ./extracts/servicenow-itsm-2026-05-28.csv \
  --source-file-id sn-export-2026-05-28
```

The CLI accepts `.csv`, `.tsv`, or `.xlsx`. For workbooks it reads the
`Data` sheet (the same shape as the bundled template).

Add `--json` for a machine-readable summary suitable for CI.

---

## 5. What lands in the database

The migration `supabase/migrations/20260530120000_tower_itsm_records.sql`
creates `tower_itsm_records` with:

- Unique index on `(tenant_key, record_number)` — the idempotency anchor.
- Indexes on `(tenant_key, opened_at DESC)`, `(tenant_key, service, priority)`,
  and `(tenant_key, record_type)` to keep Atlas's read-model queries cheap.
- RLS enabled with a `service_role` policy. Tenant scoping is enforced via
  `tenant_key` at write time; per-user RLS layers on top per the standard
  Phase 5 model.

---

## 6. Rebuilding the bundled template

```bash
npx tsx src/scripts/tower/build-servicenow-itsm-template.ts
```

Writes `public/templates/tower/servicenow-itsm/template.xlsx`. Deterministic —
the Northwind sample is seeded so the workbook is byte-stable across runs
(modulo workbook metadata like `created`).
