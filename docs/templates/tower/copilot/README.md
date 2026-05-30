# Tower Ingest Runbook — GitHub Copilot Usage + Cost

**Owner:** IT FinOps + Developer Experience
**Refresh cadence:** Monthly (within the first 5 business days of the new month)
**SLA — freshness:** Tower flags any team whose most recent `period_end` is more than **45 days** old.
**SLA — completeness:** ≥ 95% of teams with an active Copilot seat assignment must appear in each upload.
**Target table:** `tower_ai_tool_usage` (`tool = 'github_copilot'`)
**Template:** `public/templates/tower/copilot/template.xlsx`
**Sample:** `public/templates/tower/copilot/sample-filled.xlsx` (synthetic, Northwind Retail)

---

## 1. What this ingest powers

The Control Tower **AI Coding Tools** lens shows, per engineering team and per month:

- Active users and seat utilization (`seats_used / seats_assigned`)
- Suggestion volume and acceptance rate (`accepted / total`)
- Dollar cost (monthly invoice + per-seat unit economics)
- Cost per accepted suggestion (derived)

The lens compares Copilot side-by-side with Claude Code (S3) and Cursor (S4)
because all three land into the same `tower_ai_tool_usage` table, discriminated
by the `tool` column.

## 2. Real-world extract path

There is no single GitHub API that returns all of `active_users`,
`total_suggestions`, `accepted_suggestions`, and `monthly_cost_usd` together. You
will assemble the row from three sources.

### 2.1 Usage metrics (active users + suggestions + acceptance)

**Web UI**
1. Sign in to GitHub as an organization owner or a member with the
   **Copilot Admin** role.
2. Navigate: **GitHub Org → Settings → Copilot → Usage Metrics**.
3. Pick the monthly period (calendar month) and the **Team** slicer.
4. Click **Export CSV**. The export contains, per team, per day:
   - `total_suggestions_count`
   - `total_acceptances_count`
   - `total_active_users`

Roll the daily rows up to the month: sum `total_suggestions_count` →
`Total Suggestions`, sum `total_acceptances_count` → `Accepted Suggestions`,
take the **monthly distinct** `total_active_users` (not the simple sum — daily
distinct users overlap) → `Active Users`.

**API alternative** — for automation, use the [Copilot Metrics API](https://docs.github.com/en/rest/copilot/copilot-metrics):

```
GET /orgs/{org}/team/{team_slug}/copilot/metrics
GET /orgs/{org}/copilot/metrics
```

Both return daily aggregates with the same field names as the CSV export.

### 2.2 Seat assignment (seats_assigned + seats_used)

**Web UI**
1. Navigate: **GitHub Org → Settings → Copilot → Access**.
2. Filter by team. The count under **Assigned seats** for that team is
   `Seats Assigned`.
3. **Seats Used** is the count of those seats with `last_activity_at` falling
   inside the period — sort the same view by **Last activity** and count rows
   whose date falls in the month.

**API alternative**:

```
GET /orgs/{org}/copilot/billing/seats
```

Returns `assignee.login`, `assigning_team`, and `last_activity_at` for every
seat. Group by `assigning_team.slug`, filter by month, count distinct
`assignee.login` values to get `Seats Used`.

### 2.3 Cost (monthly_cost_usd)

GitHub bills Copilot at the organization level — there is no per-team line
item on the invoice. Allocate cost by seats.

**Preferred — Billing API**:

```
GET /orgs/{org}/settings/billing/usage
```

Returns the Copilot line for the month. Divide by total org seats to get the
**effective seat unit price** (which may differ from list price after
enterprise discounts), then per team:

```
team_monthly_cost = effective_seat_unit_price × team_seats_assigned
```

**Fallback — list price** (when the billing API isn't accessible):
- Copilot Business: **$19 / seat / month** (public list as of 2026-05).
- Copilot Enterprise: **$39 / seat / month** (public list as of 2026-05).

Use the list price and document the deviation in your ingest log — Tower
will treat list-price rows as "estimated cost" in the explainability surface.

## 3. Filling the template

1. Open `public/templates/tower/copilot/template.xlsx`.
2. Read the **How to fill** tab once.
3. Enter one row per `(team, calendar month)` on the **Data** tab.
   - Dates must be ISO `YYYY-MM-DD`.
   - The Excel data validators reject invalid types at entry time.
   - `Acceptance Rate %` is optional — leave it blank and the pipeline derives
     it from `Accepted / Total × 100`. If you supply it and the math disagrees
     by more than 1 percentage point, a warning is logged (not an error).
4. **Do not** include individual GitHub handles, seat IDs, or per-user
   suggestion counts. This template captures team aggregates only. Per-user
   metrics belong in a separate identity export with stricter access controls.
5. Save the file.

## 4. Running the ingest

### Dry run — recommended first pass

No database credentials required. Parses + validates only.

```bash
npx tsx src/scripts/tower/ingest-copilot.ts \
  --file=public/templates/tower/copilot/sample-filled.xlsx \
  --dry-run
```

Output is a JSON summary with `rowsParsed`, `rowsValid`, `rowsInvalid`,
`warnings`, and any parse errors written to stderr.

### Live ingest

```bash
npx tsx src/scripts/tower/ingest-copilot.ts \
  --file=/path/to/your-copilot-2026-04.xlsx \
  --client=apex-retail \
  --source-file-id=copilot-2026-04
```

Requires `ABARVA_AZURE_DATABASE_URL` or `DATABASE_URL` in your environment.
The CLI upserts on `(client_id, tool, team, period_start, period_end)` — safe
to re-run.

### Validating the sample workbook

```bash
# Regenerate the canonical sample and template:
npx tsx src/scripts/tower/build-copilot-templates.ts

# Validate it round-trips through the parser cleanly:
npx tsx src/scripts/tower/ingest-copilot.ts \
  --file=public/templates/tower/copilot/sample-filled.xlsx \
  --dry-run
```

Expected dry-run output for the committed sample: 120 rows parsed, 120 valid,
0 invalid, 0 parse errors.

## 5. Idempotency

The shared migration `tower_ai_tool_usage` declares a unique index on
`(client_id, tool, team, period_start, period_end)`. The CLI upserts against
that key. Re-running the same workbook updates rows in place rather than
duplicating them. This means:

- You can re-upload after fixing typos without cleanup.
- You can re-run after a partial failure without filtering out the rows that
  already landed.
- The `updated_at` column always reflects the most recent ingest.

## 6. Common parse + validation errors

| Error | Cause | Fix |
| --- | --- | --- |
| `Required column missing` | Header row was renamed or deleted | Restore the original header label from `template.xlsx` |
| `Period End must be on or after Period Start` | Swapped or typo'd date | Re-check the calendar month |
| `Accepted Suggestions cannot exceed Total Suggestions` | Off-by-one in the rollup | Re-aggregate the daily CSV |
| `Seats Used cannot exceed Seats Assigned` | Stale seats-assigned snapshot | Re-export assigned seats at period end, not at upload time |
| `Acceptance Rate % disagrees with Accepted/Total by more than 1pp` | (warning, not error) — manual override of derived rate | Either remove the override or fix the underlying counts |

## 7. Schema reference

See the **Schema** tab inside `template.xlsx`, or the source of truth at
`src/lib/tower/ingest/copilot/schema.ts`.

## 8. Sibling ingests

This ingest is one of three slices landing into the shared
`tower_ai_tool_usage` table:

- **S2 — GitHub Copilot** (this slice)
- **S3 — Claude Code** — see `docs/templates/tower/claude-code/README.md`
- **S4 — Cursor** — see `docs/templates/tower/cursor/README.md`

Each slice owns its own template directory, parser, validator, runbook, and
CLI. All three append a single entry to
`src/lib/tower/ingest/registry.ts`.
