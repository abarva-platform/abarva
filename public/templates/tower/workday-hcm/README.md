# Tower ingest — Workday HCM

Workforce snapshot pack used by Control Tower's workforce lens — headcount,
function mix, location, contractor ratio, and attrition signals.

Templates in this folder:

| File                  | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `template.xlsx`       | Empty template. 3 sheets: Instructions / How to fill / Data.             |
| `sample-filled.xlsx`  | Pre-filled with Northwind Retail synthetic data (~1080 rows, fictional). |
| `README.md`           | This runbook.                                                            |

The `Data` sheet column shape is the contract — the parser
(`src/lib/tower/ingest/workday-hcm/parse.ts`) is forgiving on header aliases
but strict on values.

---

## Enterprise runbook — Workday HCM extract

### 1. Build the RAAS report

Workday → **Report Writer** (RaaS) → new custom report.

Primary business object: **Worker**.

Required output fields:

| Output column      | Workday source field                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| `employee_id`      | Worker ID (Workday WID) — see redaction step before export.                       |
| `function`         | Job Family Group (top level)                                                      |
| `sub_function`     | Job Family                                                                        |
| `location`         | Work Location (use the coarsest label your policy allows)                         |
| `level`            | Career Level / Job Level / Grade                                                  |
| `contractor_flag`  | Worker Type (FTE → FALSE, Contingent / Contractor / Temp → TRUE)                   |
| `start_date`       | Hire Date                                                                          |
| `attrition_date`   | Termination Date (blank if active)                                                |
| `attrition_reason` | Termination Reason mapped to `voluntary / involuntary / end_of_contract / other`. |

Filter / scope:

- All active workers as of the report run date.
- Plus terminated workers with Termination Date in the trailing 24 months
  (so quarterly attrition signals show up).

Output: **CSV** or **XLSX**. RaaS will respect the column order above.

### 2. Layer-2 redaction — REQUIRED before this template leaves Workday

This pack carries data classified **RESTRICTED**. Before the CSV reaches
the AbarVa Tower upload zone you must:

1. Drop columns: Worker Name, Preferred Name, Email, Personal Email, Home
   Address, Phone, Date of Birth, National ID, Manager Name, anything else
   identifying.
2. Replace the raw Workday WID with either:
   - a deterministic hash (e.g., `SHA-256(tenant_secret + WID)`), prefixed
     with your tenant code; or
   - a serial generator ID like `EMP-{TENANT}-{NNNNN}` if the analysis
     does not need to re-join Workday later.
3. Confirm `function` values fall inside the allowed enum (see the
   "How to fill" sheet). Map free-text values to the closest enum match
   or `Other`.

The platform will reject the upload with a `pii_discipline` warning if
`employee_id` values do not look synthetic / hashed.

### 3. Upload to Tower

Two paths:

**A. CLI (operator-driven):**

```bash
npx tsx src/scripts/tower/ingest-workday-hcm.ts \
  --client-id <client-uuid> \
  --as-of 2026-05-30 \
  --file path/to/redacted-workday-hcm.csv \
  --dry-run
```

Drop `--dry-run` to commit. The script:

- Parses the CSV (aliases tolerated, values strict).
- Reports row-level errors (1-based row numbers matching the spreadsheet).
- Prints a function-mix + attrition summary.
- Upserts into `tower_workforce` on `(client_id, employee_id, as_of_date)`
  so re-runs are idempotent.

**B. Northwind synthetic (rehearsal / pilot dry-run):**

```bash
npx tsx src/scripts/tower/ingest-workday-hcm.ts \
  --client-id <northwind-client-uuid> \
  --as-of 2026-05-30 \
  --northwind-synthetic \
  --dry-run
```

Generates ~1000 FTE + ~80 contractors deterministically from a seed so
output is stable across runs.

---

## PII handling note

| Aspect             | Posture                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| Data class         | `restricted` (stored on every row in `tower_workforce.data_class`).            |
| Real-customer data | Layer-2 redaction is **REQUIRED** upstream. The platform does not redact.     |
| Synthetic data     | Generator IDs only (`EMP-NW-*`). No real names appear anywhere in this pack.  |
| Storage            | `tower_workforce` table, RLS-locked to `service_role`. No read path exposes raw rows to tenant users — only aggregates. |
| Audit              | Each row carries `ingested_at` + `source_file_id` so an audit can trace which extract a row came from. |

The Tower workforce aggregations (function mix, contractor ratio, attrition
rates) read from `tower_workforce`; the raw rows are never surfaced in the
product UI — only the aggregates.

---

## Template version history

| Version | Date       | Change                                          |
| ------- | ---------- | ----------------------------------------------- |
| 1.0     | 2026-05-30 | Initial pack. 9 columns. RESTRICTED data class. |
