# Tower · Jira Issues Ingest

**Source:** Jira (Cloud or Data Center).
**Target table:** `tower_jira_issues` (migration `20260530120000_tower_jira_issues.sql`).
**CLI:** `src/scripts/tower/ingest-jira.ts`.
**Template:** [`public/templates/tower/jira/template.xlsx`](../../../../public/templates/tower/jira/template.xlsx) — sample-filled with **synthetic Northwind Retail** data (~800 issues × 10 teams × past 90 days).

This is one of the first real source ingestions for Tower. It feeds the engineering dimension (velocity, cycle time, work-in-flight) called out as **absent** in the Tower module audit (`docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §4).

---

## What gets ingested

| Column            | Required | Type      | Notes                                                                 |
| ----------------- | -------- | --------- | --------------------------------------------------------------------- |
| `issue_key`       | yes      | string    | Jira key, e.g. `NW-42`. Format: `^[A-Z][A-Z0-9]+-\d+$`.                |
| `issue_type`      | yes      | enum      | `Epic` \| `Story` \| `Bug` \| `Task`.                                  |
| `epic_key`        | conditional | string | **Required when `issue_type=Story`**. Must reference an Epic in the same batch. |
| `team`            | yes      | string    | Squad / team name.                                                    |
| `status`          | yes      | enum      | `Backlog` \| `To Do` \| `In Progress` \| `In Review` \| `Blocked` \| `Done` \| `Cancelled`. |
| `story_points`    | no       | integer   | `>= 0`.                                                                |
| `created_at`      | yes      | ISO-8601  | `YYYY-MM-DD` or full timestamp.                                       |
| `started_at`      | no       | ISO-8601  | When the issue first moved to `In Progress`.                           |
| `completed_at`    | no       | ISO-8601  | When the issue moved to `Done`.                                       |
| `cycle_time_hours`| no       | number    | `>= 0`. Numeric hours from `started_at` to `completed_at`.             |

Validation runs in `src/lib/tower/ingest/jira/parse.ts`. Per-row errors are reported with the row index and the reason; cross-row referential checks (every Story has a matching Epic in the batch) are reported separately with `row_index=-1`.

---

## How to extract from real Jira

### Option A — Issues filter export (fastest, manual)

1. Jira → **Issues** → filter (e.g. `project = NW AND created >= -90d`).
2. Click **Export → Excel CSV (current fields)**.
3. Rename headers to match the canonical column set above (Jira's defaults will be e.g. `Issue key`, `Issue Type`, `Custom field (Epic Link)`, `Sprint`, `Created`). Use the workbook in `public/templates/tower/jira/template.xlsx` as the canonical layout.
4. Compute `cycle_time_hours` either in a spreadsheet or let the parser leave it null (Tower views downstream can recompute from `started_at` / `completed_at`).

### Option B — REST API (recommended for recurring ingest)

```
GET /rest/api/3/search?jql=project=NW AND created >= -90d
  &fields=summary,status,issuetype,customfield_10014,customfield_10010,created,resolutiondate
  &expand=changelog
  &maxResults=100
  &startAt=…
```

Notes:

- `customfield_10014` is the default Epic Link in Jira Cloud; verify against your instance with `/rest/api/3/field`.
- `customfield_10010` is the default Sprint field.
- Walk `changelog.histories[].items[]` for `field=status` transitions to populate `started_at` (first move out of `Backlog`/`To Do`) and `completed_at` (move to `Done`).
- For history-based `cycle_time_hours`, take the difference between `started_at` and `completed_at`.

Idempotency: the upsert key is `(client_id, issue_key)`. Re-running with a newer extract overwrites the prior snapshot for those keys. Rows present in the DB but absent from the extract are left untouched — deletes are an explicit follow-up, not implied by the ingest.

---

## How to run the CLI

```
# 1. Dry-run against the sample-filled template (no DB writes).
npx tsx src/scripts/tower/ingest-jira.ts \
  --client 00000000-0000-0000-0000-000000000000 \
  --file public/templates/tower/jira/template.xlsx \
  --dry-run

# 2. Real ingest. Requires NEXT_PUBLIC_SUPABASE_URL +
#    SUPABASE_SERVICE_ROLE_KEY in .env.local.
npx tsx src/scripts/tower/ingest-jira.ts \
  --client <client_uuid> \
  --file ./my-jira-export.xlsx
```

Flags:

- `--dry-run` — parse, validate, summarize. Exits non-zero if any row failed validation.
- `--csv` — force CSV parsing regardless of extension.
- `--source-tag <s>` — override the `source_file` label stored on each row (defaults to the file basename).

The summary printed at the end:

```
source_file:           template.xlsx
rows_total:            800
rows_valid:            800
rows_invalid:          0
by_type:               Epic=20, Story=468, Bug=156, Task=156
teams:                 10
avg_cycle_time_hours:  19.4 (n=384)
```

---

## Synthetic banner

The published template ships sample-filled. Row 1 of the **Issues** sheet shows:

> **SYNTHETIC SAMPLE DATA — Northwind Retail (fictional). Replace before uploading your own Jira extract.**

The CSV mirror (`template.csv`) carries the same warning in its banner comments. Tests in `src/lib/tower/ingest/jira/__tests__/parse.test.ts` regenerate the Northwind sample and assert the parser accepts every row, so any drift between sample generator and validator is caught before merge.

---

## Failure modes

| Failure                                        | Where reported                | How to recover                                              |
| ---------------------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| Missing `issue_key`                            | `errors[].reason`             | Filter the offending rows out of the export.                |
| `issue_type` typo (e.g. `story` lowercase)     | `errors[].reason`             | Parser normalizes to title-case; truly unknown values fail. |
| Story missing `epic_key`                       | `errors[].reason` (row_index=-1) | Add the parent Epic row to the same batch.                 |
| `created_at` not ISO-8601                      | `errors[].reason`             | Reformat to `YYYY-MM-DD` or full ISO timestamp.             |
| Duplicate `issue_key` for the same `client_id` | DB constraint                 | Upsert handles silently — last write wins.                  |
| Missing env vars                               | CLI exit code 1               | Set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` or use `--dry-run`. |

---

## Registry

This source is registered in [`src/lib/tower/ingest/registry.ts`](../../../../src/lib/tower/ingest/registry.ts) as the single `jira` entry. The registry is the source of truth for `/tower/onboard`, the upload classifier, and the CLI runner. Adding a sibling source (GitHub, ServiceNow, Workday, …) means appending exactly one entry, keyed by `source`. Duplicate keys fail at module load.
