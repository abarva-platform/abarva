# 2026-07-23-ai-spend-tracking — AI spend attribution and daily digest

## Release ID

`2026-07-23-ai-spend-tracking`

## Status

`candidate`

## Plain-English Summary

We could not answer "what are we spending on AI and why" without reading an
invoice after the fact. This adds daily measurement of both AI meters and emails
a digest each morning.

The central finding this work surfaced is that AbarVa runs **two separate AI
meters**, not one:

- The metered `ANTHROPIC_API_KEY` that carries Nexus product inference
  (Sentinel, Source, Tower, Home pack generation). This is the real invoice.
- The OAuth seat that carries Claude Code agent development. These tokens are
  **not billed per token** and do not appear on the API invoice.

Verified against the Anthropic console on 2026-07-22: API spend month-to-date
is **$3,227.89** (all token cost; web search, code execution and session runtime
all $0.00), billed across Opus 4.8, Sonnet 4.6, Opus 4.7 and Haiku 4.5. The
local collector measures Claude Code at **$6,071 notional** over 30 days across
34,233 unique calls, with a model mix of Opus 4.8 62% / **Sonnet 5 35%** /
Sonnet 4.6 3%.

Sonnet 5 is a third of Claude Code usage and appears nowhere in the billed model
breakdown; Opus 4.7 and Haiku 4.5 are billed but barely appear in Claude Code.
The daily shapes diverge too. That model-mix mismatch — not the cost magnitude —
is the evidence the meters are distinct. Any optimization aimed at the wrong
meter cannot move the invoice, so the digest reports the two side by side and
never sums them.

No product surface, tenant data path, or runtime behavior changes.

## Layer Impact

- `internal-admin`: new operator tooling (three scripts, one scheduled
  workflow, one operator-only table). Not tenant-facing.
- No change to `global-control-lane`, `client-data-lane`, `public-demo`, or
  `experimental`. No app route, component, agent prompt, or retrieval path is
  touched.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — operator/finance visibility only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ai-cost/claude-code-usage.mjs` — parses `~/.claude/projects/*.jsonl`
  into a daily cost ledger by model, effort, lane, branch and session.
- `scripts/ai-cost/anthropic-cost-report.mjs` — Anthropic Admin API collector
  (`/v1/organizations/cost_report` + `/v1/organizations/usage_report/messages`),
  full pagination, defensive field reads, `--raw` shape dump.
- `scripts/ai-cost/render-digest.mjs` — HTML digest with tables and an inline
  SVG chart; sends via the Resend HTTP API.
- `scripts/ai-cost/collect-local.sh` — workstation collector wrapper.
- `scripts/ai-cost/README.md` — process, setup, and how to read the numbers.
- `.github/workflows/ai-cost-daily.yml` — 11:00 UTC daily collect → commit →
  email.
- `supabase/migrations/20260723090000_ai_cost_daily.sql` — `ai_cost_daily`
  table, `ai_cost_daily_summary` view, service-role-only RLS.

## QA / Validation

- `node scripts/ai-cost/claude-code-usage.mjs --days 30` — ran against 1,966
  real session files (0.90 GB) in ~3s. Baseline: $6,071.54 notional, 34,233
  unique calls, 11.59B cache reads, 276.4M cache writes (100% 1-hour TTL),
  25.9M output.
- **Deduplication defect found and fixed during review.** The first
  implementation counted every transcript record, but Claude Code copies
  history into the new file on session resume/fork: 53.8% of records were
  duplicates, individual messages repeated up to 14 times. That overstated the
  total by 2.4× ($14,606 vs $6,071). Verified independently with a separate
  Python pass over the corpus (74,076 records → 34,225 unique message ids)
  before fixing the collector to dedupe on `message.id`. The collector now
  prints the dropped-duplicate count on every run so the defect cannot recur
  silently.
- **Reconciled against the live console** (platform.claude.com → Cost, month to
  date): $3,227.89 billed, confirming the two-meter conclusion via model mix.
- `--json` mode → `render-digest.mjs` end-to-end: 14.8 KB HTML, 27 chart bars,
  14 table rows, trend math verified (▲212% vs 7-day average on 2026-07-21).
- Missing-input path verified: with no Anthropic snapshot the digest renders the
  Claude Code half and states the other half is unmeasured, rather than
  implying a total it cannot compute. Exits non-zero only when _both_ inputs
  are absent.
- `ANTHROPIC_ADMIN_KEY=` → exits 2 with remediation text naming the console
  path. No partial or misleading output.
- `npx eslint scripts/ai-cost/` — exit 0.
- `node --check` on all three `.mjs` files — clean. `bash -n` on the shell
  wrapper — clean.
- Migration structure verified: balanced `BEGIN;`/`COMMIT;`, both `DO $$` blocks
  closed, all DDL idempotent (`CREATE TYPE` guarded by `EXCEPTION WHEN
duplicate_object`, `CREATE TABLE/INDEX IF NOT EXISTS`, `CREATE OR REPLACE
VIEW`, `DROP POLICY IF EXISTS` then `CREATE POLICY`).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.

**Not yet validated:** the Admin API collector has not executed against the live
endpoints — no Admin API key exists yet. Response field names are read
defensively and `--raw` exists to reconcile the shape on first run, but the
first live run must be treated as unverified until its output is inspected.

## Rollout Plan

Merge to main. No ACA image build, no runtime deploy, no traffic shift. The
workflow begins at the next 11:00 UTC tick once its four secrets are set; it
no-ops with a clear error until then. The migration is **not** required for the
digest to work — snapshots land in `reports/ai-cost/daily/` because the
control-plane Postgres is on a private VNet a GitHub-hosted runner cannot reach.
Apply the migration when the collector moves to an ACA job inside the VNet.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime deploy.
- Shared runtime mutators: none. This release runs no `az` command and does not
  touch Container App templates, revisions, traffic, images, or env vars.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none. New GitHub Actions secrets only
  (`ANTHROPIC_ADMIN_KEY`, `RESEND_API_KEY`, `AI_COST_DIGEST_TO`,
  `AI_COST_DIGEST_FROM`).
- Live signed-in proof required: no — no client-visible surface changes.

## Rollback Plan

Disable the workflow in the Actions tab, or revert the commit. Nothing to undo
at runtime. If the migration has been applied, `DROP VIEW
public.ai_cost_daily_summary; DROP TABLE public.ai_cost_daily;` is safe — the
table is operator-only, has no foreign keys pointing at it, and no product code
reads it.

## Known Gaps

- **The Admin API collector has never run against the live endpoints.** No
  Admin API key exists yet, so the product-spend half — the actual invoice — is
  still unmeasured. Field names are read defensively and `--raw` dumps the real
  shape, but the first live run must be inspected before its output is trusted.
- **Product spend cannot be split by workload yet.** All Nexus inference shares
  one `ANTHROPIC_API_KEY`, so `output_tokens_by_api_key` will show a single
  bucket. Splitting into per-lane keys (`intelligence-runtime`,
  `tower-runtime`, `home-pack-generation`, `source-artifact-generation`,
  `live-qa-pressure-tests`) is a prerequisite for the `workload` column in
  `ai_cost_daily` to carry real signal. Not done here.
- **Snapshots persist to the repo, not Postgres.** `ai_cost_daily` ships but is
  unwritten: a GitHub-hosted runner cannot reach the private-VNet control
  Postgres. Moving the collector to an ACA job inside the VNet is follow-on
  work.
- **Claude Code costs are notional, not billed.** They are a volume and
  runaway-session signal only. Treating them as invoice dollars would be wrong.
- **The pricing table is hand-maintained.** `PRICING` in
  `claude-code-usage.mjs` must be updated when list prices change. Sonnet 5
  introductory pricing ends 2026-08-31 and will step the notional series up
  ~50% for that model for reasons unrelated to usage.
- **No alerting.** The digest reports; it does not page. A spend spike is seen
  the next morning, not in the moment. A threshold alert is deliberately
  deferred until a few weeks of baseline exist to set it against.
- **No `cost_per_accepted_output` metric.** That requires joining spend to
  validation outcomes in `ai_egress_audit`, which this release does not do.

## Audit Evidence

- Baseline run output and the 30-day series in
  `reports/ai-cost/daily/2026-07-22-claude-code.json`.
- Console reconciliation 2026-07-22: Cost page month-to-date $3,227.89 with the
  billed model breakdown that establishes the two-meter separation.
- Rendered digest sample committed alongside the snapshot.
- `scripts/ai-cost/README.md` documents the two-meter distinction, the notional
  vs billed basis, and the Sonnet 5 introductory-pricing step-up on 2026-08-31
  that will move the notional series for non-usage reasons.
- Migration comments record why a daily rollup was chosen over a second
  per-call ledger (`ai_egress_audit` already carries per-call detail).
