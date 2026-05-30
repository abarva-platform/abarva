# Tower · Claude Code Developer Usage Ingest

Per-developer Claude Code (Anthropic) usage and cost feed. Lands one row per
developer × monthly period into the dedicated `tower_claude_code_usage` table.

## Grain note (read this first)

Sister slices Copilot (S2) and Cursor (S4) feed into a separate
`tower_ai_tool_usage` table on a **team-aggregate** grain (seats / active users /
completions / monthly cost). Claude Code's Anthropic Console surface gives us a
fundamentally different fact — **per-developer** telemetry (sessions, prompt /
output tokens, primary use case) — so S3 lands in its own table. Different
fact, different grain, different table. Tower lenses union or query both for
cross-tool rollups; forcing both grains into one shape would make half the
columns nullable on every row.

## What this closes

Tower audit `docs/build/TOWER_AUDIT_2026-05-06.md` flagged zero live source
integrations on the Tower surface. This is slice **S3** of the three-tool
foundation (S2 = Copilot, S3 = Claude Code, S4 = Cursor) that closes that gap
for AI coding assistants.

## Where the data comes from (real world)

1. **Anthropic Console → Usage** (org admin view).
2. Pivot by API key. Each key in your Anthropic org should be tagged with the
   developer it belongs to and the team they roll up to. If you don't yet
   tag per-key, do that first — it's the only way to attribute usage to a
   developer.
3. Export monthly. One row per `(developer, month)`.
4. Map team membership from your IAM system (Okta, Entra, etc.) onto the
   `team` column.

## Schema (Data sheet)

| Column | Required | Type | Notes |
|---|---|---|---|
| `team` | yes | string | Squad / product team identifier. |
| `developer_id` | yes | string | Stable Anthropic Console key or user ID. |
| `period_start` | yes | YYYY-MM-DD | First day of billing month. |
| `period_end` | yes | YYYY-MM-DD | Last day of billing month. |
| `sessions` | no | integer | Claude Code sessions in period. |
| `prompt_tokens` | no | integer | Total input tokens. |
| `output_tokens` | no | integer | Total output tokens. |
| `monthly_cost_usd` | no | numeric(12,2) | Attributed monthly USD spend. |
| `primary_use_case` | no | string | Dominant category (e.g. `feature_development`, `bug_fix`, `refactor`, `tests`, `code_review`, `documentation`, `data_pipeline`). |

Validation rules (mirrored in DB CHECK constraints):

- `period_end >= period_start`.
- All numeric columns non-negative.
- Natural key `(tenant_client_key, developer_id, period_start)` is unique.
  Re-running the same file is an idempotent no-op.

## Templates

- `public/templates/tower/claude-code/template.xlsx` — blank template with
  README, Data, and Schema sheets. Drop your rows into Data.
- `public/templates/tower/claude-code/sample-filled.xlsx` — Northwind Retail
  synthetic fill (28 developers × 12 months = 336 rows). The README sheet
  carries a `SYNTHETIC DATA — NOT FOR INVOICING` banner.

Regenerate with:

```
npx tsx src/scripts/tower/build-claude-code-templates.ts
```

## Ingest CLI

```
npx tsx src/scripts/tower/ingest-claude-code.ts \
  --file <path-to-xlsx-or-csv> \
  --tenant <client-key> \
  [--dry-run]
```

- `--tenant` is the tenant client key (e.g. `northwindretail`, `apexretail`).
- `--dry-run` parses + validates without writing. Safe to run anytime.
- Without `--dry-run` the CLI requires `DATABASE_URL` (or
  `ABARVA_AZURE_DATABASE_URL`).

Output is a one-line summary: `inserted=N updated=N unchanged=N failed=N`.
Rows whose values match the existing DB row are counted as `unchanged` — that
is the marker for true idempotency.

## Database

Migration `supabase/migrations/20260530220000_tower_claude_code_usage.sql`
creates the per-developer `tower_claude_code_usage` table. Run via
`npm run db:migrate`.

Sister slices land separately:

| Slice | Table | Grain | Owner |
|---|---|---|---|
| S2 | `tower_ai_tool_usage` | team-aggregate | GitHub Copilot |
| S3 | `tower_claude_code_usage` | per-developer | This slice |
| S4 | `tower_ai_tool_usage` | team-aggregate | Cursor |

## Registry

The ingest entry is registered at `src/lib/tower/ingest/registry.ts` as
`claudeCodeSource`. Sister slices append their own entries to the same array.

## Where it surfaces

Once rows land, Tower lenses that consume `tower_claude_code_usage` will pick
up the developer-level series automatically. Cross-tool rollups (e.g. total AI
coding spend across Copilot / Claude Code / Cursor) UNION the per-developer
view with team-aggregate `tower_ai_tool_usage`.
