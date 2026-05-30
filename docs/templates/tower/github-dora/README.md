# Tower runbook · GitHub → DORA metrics ingest (S1)

| Field              | Value                                                       |
| ------------------ | ----------------------------------------------------------- |
| Source system      | GitHub (organization + per-repository)                      |
| Refresh cadence    | Weekly (every Monday 12:00 UTC)                             |
| Period granularity | One row per `(repo, monthly period)`                        |
| Owner              | AI Control Tower — Platform Squad                           |
| On-call            | `#tower-platform` (Slack)                                   |
| SLA                | Workbook landed by 12:00 UTC Mon, ingest run by 14:00 UTC   |
| Backfill window    | 18 months                                                   |
| Target table       | `public.tower_dora_metrics`                                 |
| Migration          | `supabase/migrations/20260530133918_tower_dora_metrics.sql` |
| Template           | `public/templates/tower/github-dora/template.xlsx`          |
| Sample             | `public/templates/tower/github-dora/sample-filled.xlsx`     |

## What this ingest is for

The AI Control Tower needs the four canonical DORA metrics — deployment
frequency, lead time for changes, change failure rate, mean time to
recovery — at a per-repository, per-monthly-period grain. They drive
the **AI Productivity / DORA** lens in the Atlas executive brief and
the **Productivity gaps** pressure card.

This runbook documents the path from a GitHub organization to a row in
`tower_dora_metrics`. The path goes through a workbook on purpose so
that a CIO can inspect the actual numbers about to land in the Tower,
and so a tenant that does not yet have direct GitHub connectivity can
still bootstrap the metric with a one-off extract.

## Real-world extract path

```
GitHub org
├── Actions deployments API   ───┐
├── Pull-Request merge events  ──┼─► weekly reducer ──► template.xlsx ──► CLI ──► tower_dora_metrics
└── Issues labelled `incident:*` ─┘
```

### Per-metric extract recipe

| Metric                          | Source endpoint / object                                    | Reducer                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `deployment_frequency_per_day`  | `GET /repos/{owner}/{repo}/deployments` + statuses          | Count `deployment_status.state == "success"` with `environment == "production"`, divide by calendar days in window            |
| `lead_time_for_changes_hours`   | PRs merged in window + `Get a commit` for first-commit time | Median of `(production_deploy_at - first_commit_at)` per merged PR shipped to production in window                            |
| `change_failure_rate_pct`       | Production deploy events ↔ issues labelled `incident:*`     | `100 × (deploys that triggered an incident:* issue within 24h ∪ deploys followed by hotfix/rollback) ÷ sample_size_deploys`   |
| `mttr_hours`                    | Issues with label `incident:*` linked to the repo           | Mean `(closed_at - created_at)` for incidents in window; **0 if no incidents**                                                |
| `sample_size_deploys`           | Same as deployment frequency                                | Total count of successful production deployments in the window (denominator for `change_failure_rate_pct`)                    |

### Window convention

- One row per `(repo, period_start, period_end)`.
- `period_start` is the first day of the month, UTC.
- `period_end` is the last day of the month, UTC.
- `period_end >= period_start` (enforced by both the workbook validator and the DB CHECK constraint).

### Why a workbook hop

A workbook hop keeps the path auditable: the CIO can open the file
their team is about to upload, see the SYNTHETIC DATA banner if it is
a demo, and confirm the numbers before they land. The same hop also
covers tenants that have not yet authorized GitHub App access — they
can hand-export from their own DORA tooling (Sleuth, LinearB, Pelorus,
internal dashboards) and reuse the same template.

## Field mapping

| Workbook column                  | DB column                          | Type                | Required | Unit          | Notes                                                                                  |
| -------------------------------- | ---------------------------------- | ------------------- | -------- | ------------- | -------------------------------------------------------------------------------------- |
| `repo`                           | `repo`                             | text                | yes      | —             | `owner/name`, lowercase, GitHub naming rules                                           |
| `team`                           | `team`                             | text                | yes      | —             | Slug; should match `org_topology.team_id` if the tenant has it loaded                  |
| `period_start`                   | `period_start`                     | date                | yes      | YYYY-MM-DD    | First day of month, UTC                                                                |
| `period_end`                     | `period_end`                       | date                | yes      | YYYY-MM-DD    | Last day of month, UTC. `>= period_start`                                              |
| `deployment_frequency_per_day`   | `deployment_frequency_per_day`     | numeric(10,4)       | yes      | deploys / day | `>= 0`                                                                                 |
| `lead_time_for_changes_hours`    | `lead_time_for_changes_hours`      | numeric(12,2)       | yes      | hours         | `>= 0`. Median of per-PR lead time                                                     |
| `change_failure_rate_pct`        | `change_failure_rate_pct`          | numeric(5,2)        | yes      | percent       | `0..100`                                                                               |
| `mttr_hours`                     | `mttr_hours`                       | numeric(12,2)       | yes      | hours         | `0` if no incidents in window                                                          |
| `sample_size_deploys`            | `sample_size_deploys`              | integer             | yes      | count         | `>= 0`. Denominator for `change_failure_rate_pct`                                      |

## Running the ingest

### Local / pilot environment

```bash
# 1. Make sure migrations are applied.
npm run db:migrate

# 2. Dry-run to inspect the plan.
npx tsx src/scripts/tower/ingest-github-dora.ts \
  --file public/templates/tower/github-dora/sample-filled.xlsx \
  --tenant northwind-retail \
  --dry-run

# 3. Apply.
npx tsx src/scripts/tower/ingest-github-dora.ts \
  --file public/templates/tower/github-dora/sample-filled.xlsx \
  --tenant northwind-retail \
  --actor cio@northwind-retail.com
```

### CLI flags

| Flag                | Required | Description                                                                                  |
| ------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `--file`            | yes      | Path to the .xlsx workbook (template or sample-filled, or a real extract).                   |
| `--tenant`          | yes      | `clients.tenant_key`. The CLI resolves it to `client_id`.                                    |
| `--dry-run`         | no       | Print the insert/update/no-op plan and exit. No writes, no transaction begun.                 |
| `--source-file-id`  | no       | Optional opaque id (e.g. evidence-ledger upload id) recorded in `source_file_id`.            |
| `--actor`           | no       | String written to `created_by`/`updated_by`. Defaults to `tower-ingest-cli`.                  |

### Idempotency

The DB unique key is `(client_id, repo, period_start, period_end)`.
Re-running on the same workbook produces a sequence of `ON CONFLICT DO
UPDATE` statements where every column is unchanged — net effect is a
no-op as far as `tower_dora_metrics` consumers are concerned. The CLI
reports the per-row classification in its summary.

## Validation rules

These rules are enforced in three places (template → parser → DB) so
errors surface at the earliest possible step:

1. **Workbook cell validation** (in `template.xlsx`):
   - Date columns: must be a real Excel date `>= 2000-01-01`.
   - Numeric columns: `>= 0`.
   - Percent columns: `0 .. 100`.
   - Required text columns: non-empty.
2. **Parser + validator** (`src/lib/tower/ingest/github-dora/`):
   - `repo` matches `^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$`.
   - `team` matches `^[a-z0-9][a-z0-9_-]*$`.
   - Dates are ISO-8601 `YYYY-MM-DD`.
   - `period_end >= period_start`.
   - All numerics are finite, non-negative; percent in `[0, 100]`.
   - `sample_size_deploys` is a non-negative integer.
3. **Database** (`supabase/migrations/20260530133918_tower_dora_metrics.sql`):
   - `CHECK (period_end >= period_start)`.
   - `CHECK (deployment_frequency_per_day >= 0)` etc.
   - `UNIQUE (client_id, repo, period_start, period_end)`.

## Example queries

### How many repos have we ingested for a tenant, this month?

```sql
SELECT count(DISTINCT repo) AS repos_covered
  FROM public.tower_dora_metrics
 WHERE client_id = $1
   AND period_start = date_trunc('month', current_date - interval '1 month')::date
   AND deleted_at IS NULL;
```

### Latest DORA snapshot per team

```sql
SELECT DISTINCT ON (team) team, repo, period_start, period_end,
       deployment_frequency_per_day, lead_time_for_changes_hours,
       change_failure_rate_pct, mttr_hours, sample_size_deploys
  FROM public.tower_dora_metrics
 WHERE client_id = $1
   AND deleted_at IS NULL
 ORDER BY team, period_end DESC;
```

### Repos in the bottom DORA quartile by change failure rate

```sql
WITH ranked AS (
  SELECT repo, change_failure_rate_pct,
         percent_rank() OVER (ORDER BY change_failure_rate_pct DESC) AS pr
    FROM public.tower_dora_metrics
   WHERE client_id = $1
     AND deleted_at IS NULL
     AND period_end >= current_date - interval '90 days'
)
SELECT repo, change_failure_rate_pct
  FROM ranked
 WHERE pr <= 0.25
 ORDER BY change_failure_rate_pct DESC;
```

## Honesty bar

- The sample-filled workbook carries a `SYNTHETIC DATA — for demo only`
  banner in row 2 of the Data sheet. The parser explicitly skips that
  row.
- Northwind Retail is a fictional tenant. No row in the sample workbook
  claims to come from a real customer engagement.
- `tower_dora_metrics` does NOT replace `dora_baselines`. The two
  tables coexist; the Tower read model
  (`src/lib/tower/ai-productivity-dora.ts`) is the only consumer that
  can mix the two grain levels.

## Change log

| Date       | PR  | Change                                                              |
| ---------- | --- | ------------------------------------------------------------------- |
| 2026-05-30 | S1  | Initial slice: template + sample + parser + validator + CLI + table |
