# Tower · Cursor team usage + cost ingest (S4)

**Slice:** S4
**Source system:** Cursor (Admin Dashboard + Billing Portal)
**Target table:** `tower_ai_tool_usage` (shared with S2 Copilot, S3 Claude Code; `tool='cursor'`)
**Cadence:** monthly, within 7 days of the billing close
**Status:** pilot (real schema, real loader; no live API connector yet — humans export from the Cursor UI and upload the workbook)
**Owner artifacts:**
- Template: `public/templates/tower/cursor/template.xlsx`
- Sample: `public/templates/tower/cursor/sample-filled.xlsx` (synthetic — Northwind Retail)
- Parser: `src/lib/tower/ingest/cursor/parse.ts`
- Validator: `src/lib/tower/ingest/cursor/validate.ts`
- CLI: `src/scripts/tower/ingest-cursor.ts`
- Migration: `supabase/migrations/20260530120000_tower_ai_tool_usage.sql`
- Registry entry: `src/lib/tower/ingest/cursor/registry-entry.ts`

---

## What this loader actually does

It lands one row per **team × calendar month** in `tower_ai_tool_usage` with
`tool='cursor'`. That's it. The honest scope:

- It is **not** a live API connector. There is no Cursor Admin API token in
  the loop. A human exports CSVs from the Cursor UI, copies the relevant
  columns into the workbook, and runs the CLI (or, eventually, drops the file
  into the Tower upload zone).
- It does **not** infer cost from seats × rate card. Cost is read from the
  Cursor billing portal as authoritative truth. If your invoice carries a
  discount or proration, the loader records what you paid, not what list
  would have been.
- It does **not** join to GitHub PR data, branch counts, or downstream
  delivery metrics. That's a follow-on (Tower correlation pass), not S4.

It does provide:

- A typed schema with cross-field invariants enforced at the DB layer
  (`active_users ≤ seats_assigned`, `completions_accepted ≤ completions_shown`,
  `period_end ≥ period_start`).
- An idempotent upsert keyed on `(client_id, tool, team, period_start)`.
  Re-running the same file is a no-op.
- A registry entry surfaced via `listTowerIngestEntries()` so Tower
  onboarding can honestly show what's wired today.

---

## Real-world extract path

### Step 1 — Cursor Admin Dashboard (usage)

1. Sign in at <https://cursor.com> as a team admin.
2. **Settings → Teams** → for each team to report:
   - Open the **Usage** tab.
   - Date range = the calendar month you are reporting (Day 1 → last day of month).
   - Click **Export CSV**. The export carries `seats_assigned`, `active_users`,
     `completions_shown`, `completions_accepted` for the team for that month.
3. Concatenate the per-team CSVs into one workbook. Keep team names exactly
   as they appear in Cursor — the loader uses the team string as part of the
   natural key.

### Step 2 — Cursor Billing Portal (cost)

1. **Settings → Billing → Invoices**.
2. Open the invoice for the same month.
3. Read the **per-team line item** in USD. That is `monthly_cost_usd`.
   - If your contract has a global discount, the per-team allocation is whatever
     your finance team treats as the team's chargeback amount.
   - If the invoice combines teams under a single line, split it pro-rata by
     `seats_assigned` and note the allocation in your monthly close memo.

### Step 3 — Paste into the workbook

1. Open `public/templates/tower/cursor/template.xlsx`.
2. Fill the **Data** sheet. One row per team × month. Dates must be `YYYY-MM-DD`.
3. Save. Headers must remain unchanged — the parser is tolerant of column
   order but strict about column presence.

---

## How to run the loader

```bash
# Dry run (parse + validate only, no DB writes)
npx tsx src/scripts/tower/ingest-cursor.ts \
  --file path/to/your-cursor-export.xlsx \
  --tenant <tenant_key> \
  --dry-run

# Real run (idempotent upsert)
npx tsx src/scripts/tower/ingest-cursor.ts \
  --file path/to/your-cursor-export.xlsx \
  --tenant <tenant_key> \
  --source-file-id cursor_2026_04_v1
```

Output is JSON on stdout: parsed rows, error/warning counts, inserted vs
updated, and the resolved `client_id`. Non-zero exit code means at least one
error issue was found (the loader refuses to write partial data).

### Flags

| Flag | Effect |
|---|---|
| `--file <path>` | required — xlsx with a `Data` sheet matching the template |
| `--tenant <tenant_key>` | required — `clients.tenant_key` value |
| `--dry-run` | parse + validate only; no DB |
| `--source-file-id <id>` | trace label persisted on every row for audit |
| `--strict` | promote any warning to an error (block partial writes) |

---

## Idempotency contract

The unique key is `(client_id, tool, team, period_start)`. Re-running the
same file:

- inserts zero new rows
- updates `period_end`, the four numeric fields, `monthly_cost_usd`,
  `source_file_id`, and refreshes `ingested_at`

The loader prints `inserted` and `updated` counts separately so you can
verify this in CI.

If you need to back-fill a corrected number for a past month, just re-upload
the file with the corrected value — the upsert will overwrite. There is no
soft-delete / tombstone for replaced rows; the audit trail lives in
`source_file_id` and `ingested_at`.

---

## Validation rules (what will reject your file)

**Errors (block the run):**

- Missing required column (`team`, `period_start`, `period_end`, `seats_assigned`,
  `active_users`, `completions_shown`, `completions_accepted`, `monthly_cost_usd`)
- Non-`YYYY-MM-DD` date format
- Negative numbers or non-integers where the schema expects integers
- `active_users > seats_assigned`
- `completions_accepted > completions_shown`
- `period_end < period_start`
- Duplicate `(team, period_start)` within a single upload

**Warnings (visible; promoted to errors with `--strict`):**

- `period_start` not the first of a month
- `completions_shown` > 100M for a single team-month (verify export)
- `monthly_cost_usd` > $10M for a single team-month (verify billing)

---

## Sample data

`public/templates/tower/cursor/sample-filled.xlsx` carries **120 rows**
(10 teams × 12 monthly periods, May 2025 → April 2026) for the
**Northwind Retail** rehearsal tenant. It is loudly banner-tagged
"SYNTHETIC" so it cannot be confused with production telemetry. Numbers
are deterministically generated by `src/scripts/templates/tower/cursor/build-sample.ts`
with plausible Cursor distributions:

- 75–95% activation past month 2 (rollout curve)
- 22–34% completion acceptance rate (varies by team type)
- ~6k–14k completions shown per active user per month (Cursor median band)
- $40/seat/month (Cursor Business list)

---

## What this loader will **not** do

To set expectations honestly for an enterprise pilot:

- It will not catch a team rename in Cursor. If the admin renames a team,
  the loader will treat it as a new natural key and the historical rows
  will sit under the old name. Operationally: file a rename ticket and
  back-fill via SQL.
- It will not deduplicate across the three tools (Copilot/Claude Code/Cursor)
  for a developer who uses all three. The grain is the tool, not the user.
- It will not enforce that a user appears in only one Cursor team. The
  Cursor product allows multi-team membership; the loader trusts what
  Cursor exports.

These gaps are documented; they are not bugs.

---

## Future work

- **Live connector.** Cursor exposes admin-tier endpoints behind a paid
  enterprise plan. When that is available, replace the manual export with
  a polling adapter that hits the Cursor API and lands the same rows.
- **Per-user grain.** A second table (`tower_ai_tool_usage_user`) for
  individual-user adoption would enable adoption-curve / drop-off cohorts.
  Out of scope for S4.
- **Correlation pass.** Once S2/S3/S4 are all landing, a Tower view that
  blends Copilot + Claude Code + Cursor at the engineer-team grain.
