# Tower · ServiceNow CMDB ingest

Enterprise runbook for ingesting a ServiceNow CMDB Configuration Item inventory and CI dependency graph into Tower.

This is the first live integration Tower watches. The 2026-05-06 Tower audit (`docs/build/TOWER_AUDIT_2026-05-06.md`) found zero live integrations; this slice closes that gap for the CMDB surface, which is the substrate every other Tower lens (Portfolio, Pressure, Value-at-Risk, Dependencies) reads from.

---

## What lands in Tower

| Tower lens | Reads from |
|---|---|
| Dependencies matrix | `tower_cmdb_dependencies` joined with `tower_cmdb_cis` for both endpoints |
| Portfolio (apps, dbs, queues, lbs) | `tower_cmdb_cis WHERE ci_type IN ('application', 'database', 'queue', 'load_balancer', 'server')` |
| Pressure (criticality + lifecycle) | `tower_cmdb_cis.criticality`, `tower_cmdb_cis.lifecycle_state` |
| Atlas synthesis | The same two tables, scoped to the active `client_id` |

The schema migration is at `supabase/migrations/20260530120000_tower_cmdb.sql`.

---

## Real-world extract path (ServiceNow)

The customer-facing flow we recommend, in order of pilot maturity:

1. **One-shot extract — pilot week 1.** Run the following Table API calls against the customer's ServiceNow instance, page through the results, and save as CSV / XLSX. The columns required by the workbook are flagged.
   * `GET /api/now/table/cmdb_ci?sysparm_fields=sys_id,name,sys_class_name,install_status,operational_status,u_owner_group,business_service,u_criticality,u_environment` — paginate via `sysparm_offset` + `sysparm_limit=1000`.
   * `GET /api/now/table/cmdb_rel_ci?sysparm_fields=parent.sys_id,child.sys_id,type` — also paginated.
2. **Scheduled export — pilot weeks 2–4.** Configure a ServiceNow Scheduled Data Export job that drops the same two extracts to an S3 / Azure Blob landing zone Tower watches. The ingest CLI is wired to be idempotent (`--client-id` + workbook is the unit of replay).
3. **Production — pilot graduation.** Replace the workbook upload with the live MID Server / Now Platform Integration Hub pipe and have it post the same parsed payload to the Tower ingest API. The parser, validator, and upsert layer in this repo are the same code path; only the transport changes.

The mapping from ServiceNow fields to workbook columns:

| ServiceNow field | Workbook column |
|---|---|
| `sys_id` | `ci_sys_id` |
| `name` | `ci_name` |
| The CI's class label (e.g. "Application", "DB Instance", "Linux Server") | `ci_type` |
| `sys_class_name` (table name, e.g. `cmdb_ci_appl`) | `ci_class` |
| `install_status` mapped — `1` → `production`, `2` → `retired`, `4` → `pre_production`, `7` → `planned`, `100` → `dev` | `lifecycle_state` |
| `u_owner_group.name` (or `sys_owner_group.name` if you don't use a custom field) | `owner_team` |
| `business_service.name` | `business_service` |
| `u_criticality` mapped — `1` → `tier_1`, `2` → `tier_2`, `3` → `tier_3`, `4` → `tier_4` | `criticality` |
| `u_environment` or the closest custom field — `prod`, `stage`, `dev`, `dr` | `environment` |

For dependencies:

| ServiceNow field | Workbook column |
|---|---|
| `parent.sys_id` (from cmdb_rel_ci) | `source_ci_sys_id` |
| `child.sys_id` (from cmdb_rel_ci) | `target_ci_sys_id` |
| `type.name` mapped — "Depends on::Used by" → `depends_on`, "Runs on::Runs" → `runs_on`, "Connects to::Connected by" → `connects_to` | `dependency_type` |

If the customer uses non-standard relationship types, fold each into the closest of the three canonical values before upload. The validator rejects any other string.

---

## How to fill the workbook

Both the blank `template.xlsx` and the sample-filled `sample.xlsx` live in `public/templates/tower/servicenow-cmdb/`. The sample uses synthetic Northwind Retail data — it is clearly marked as such on every data sheet's banner — and is provided so the customer can validate the upload pipeline against known-good rows before swapping in real data.

1. Download `template.xlsx`.
2. Paste the rows from the ServiceNow CSV exports into the `Configuration Items` and `Dependencies` sheets, matching the headers in row 2 (row 1 is the banner — leave it alone).
3. Confirm every `source_ci_sys_id` and `target_ci_sys_id` in the Dependencies sheet appears as a `ci_sys_id` in the Configuration Items sheet. The validator rejects orphan edges before any write.
4. Save the workbook.
5. Upload via Tower → Connectors → ServiceNow CMDB (UI path planned for the next slice), or use the CLI below.

The `How to fill` and `Schema` sheets inside the workbook duplicate the column reference for reviewers who don't have access to this doc.

---

## CLI

Dry-run (parse + validate, no writes):

```
npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts \
  --file public/templates/tower/servicenow-cmdb/sample.xlsx \
  --client-id apexretail \
  --dry-run
```

Full ingest (transactional, idempotent):

```
DATABASE_URL=postgres://... \
npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts \
  --file ./northwind-cmdb-2026-05-30.xlsx \
  --client-id apexretail
```

Exit codes:

* `0` — all rows parsed, validated, and (unless `--dry-run`) written.
* `1` — parse issue, validation failure (orphan edge, duplicate sys_id, duplicate edge), or DB error. Nothing was written if the failure happened mid-transaction — the upsert layer rolls back.

Re-running with the same workbook is safe. The upsert layer is keyed by `(client_id, ci_sys_id)` for CIs and `(client_id, source_ci_sys_id, target_ci_sys_id, dependency_type)` for edges; a re-run touches `ingested_at` and `ingest_run_id` but does not duplicate rows.

---

## Validation rules

The validator (`src/lib/tower/ingest/servicenow-cmdb/validate.ts`) enforces:

| Rule | Severity |
|---|---|
| `ci_sys_id` unique within the workbook | blocking |
| Every dependency edge's `source_ci_sys_id` and `target_ci_sys_id` reference a CI in the same workbook | blocking |
| `(source, target, type)` triples unique within the workbook | blocking |
| Edges that touch a CI whose `lifecycle_state = retired` | warning |

The parser additionally enforces:

| Rule | Severity |
|---|---|
| All required columns present on both sheets | blocking |
| `lifecycle_state` in the allowed enum | blocking (row dropped) |
| `criticality` in the allowed enum | blocking (row dropped) |
| `dependency_type` in the allowed enum | blocking (row dropped) |
| Self-referential dependency (source == target) | blocking (row dropped) |

---

## Rollback

Because the upsert layer keys on stable identifiers and the migration tables have no FKs into existing Tower tables, rollback for a botched ingest is:

```
-- Roll back one ingest run only:
DELETE FROM public.tower_cmdb_dependencies
  WHERE client_id = $1 AND ingest_run_id = $2;
DELETE FROM public.tower_cmdb_cis
  WHERE client_id = $1 AND ingest_run_id = $2;

-- OR wipe a tenant's CMDB entirely before a re-import:
DELETE FROM public.tower_cmdb_dependencies WHERE client_id = $1;
DELETE FROM public.tower_cmdb_cis WHERE client_id = $1;
```

The platform retains the audit ledger entry independently — clearing these tables does not clear the audit row.
