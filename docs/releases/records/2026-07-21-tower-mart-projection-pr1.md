# 2026-07-21-tower-mart-projection-pr1 — Unified facts → cio*tower.mart*\* projection (Tower CXO story)

## Release ID

`2026-07-21-tower-mart-projection-pr1`

## Status

`candidate`

## Plain-English Summary

Tower has three data layers that were disconnected: (1) real, tested ingest connectors (Copilot, Cursor, Claude, GitHub DORA, Azure cost, Jira, ServiceNow ITSM) that write `tower_*` operational tables; (2) curated V3 template CSVs carrying budget, program funding, and promised value; and (3) the `cio_tower.mart_*` command-center tables the CXO Tower page reads. Nothing bridged (1)+(2) into (3), so the mart could hold zero real rows and the page had no true CXO story to tell.

This release builds the missing bridge as a single, unified projection path: **both** `tower_*` operational data **and** the V3 budget/program data land in one `cio_tower.facts` layer, and all 7 `cio_tower.mart_*` tables are assembled from that unified facts layer. The result is the defensible CXO story — "here is your budget, here is AI-tagged spend, here is what is actually used, here is what value is only promised, here is what finance partially validated, here is fund/fix/freeze/stop, and here is the evidence behind each number."

Discipline baked in and proven with tests: realized value is never auto-claimed (hard-gated to $0 unless finance validation is explicitly loaded); real tenant-file telemetry wins over synthetic estimates only for the SAME canonical metric/period (complementary metrics like license-spend vs usage never collapse); a new tenant-scoped `cio_tower.tool_identity_aliases` table links tool telemetry to the funded program it is evidence for (so real Copilot usage attaches to "Developer Productivity AI / SDLC Automation" instead of orphaning); and missing budget/program/value fields emit `mart_required_field_gaps` rows (never fabricated zeros), each naming the specific missing extract.

Run end-to-end against the real Meridian V3 CSVs (no live DB needed for the V3 half): reproduces the exact $650M budget / 75% run envelope, all 12 funded programs correctly laned, $3.8M partial-validated, realized $0, 15 honest gaps.

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/mart-projection/*` — new, reusable projection library (facts contract, tower\_\*→facts, V3→facts, precedence merge, tool→program crosswalk, facts→mart assembler). Pure functions, no runtime behavior change until the CLI is run.
- `internal-admin`: `src/scripts/tower/project-tower-mart.ts` + `project-tower-mart-write.ts` — the operator CLI (dry-run + governed ACA write path with `ai_control_refresh_runs` job tracking).
- `client-data-lane`: `supabase/migrations/20260721160000_cio_tower_tool_identity_aliases_v1.sql` — new tenant-scoped alias table (schema only; no rows seeded in this PR).

## Client Applicability

- All clients: the projection library and CLI are tenant-generic (any tenant with V3 CSVs + ingested `tower_*` data + curated aliases can be projected).
- Specific clients: Meridian is the first proof target; no mart rows are written by this PR.
- Internal only: the CLI is operator tooling.
- Public/demo only: no.
- Feature flag: none. No product surface is wired to the new mart data in this PR (per the ACA data-build job rule: no surface wiring until a real write + quality gate + human review pass).

## Changes Included

- `src/lib/cio-tower/mart-projection/facts-schema.ts` — `cio_tower.facts` row contract, canonical identity spine (canonical_tool_key/program_key, metric_key, metric_unit, source_priority), `canonicalMergeKey`, value-invariant guard.
- `facts-from-tower.ts` — all 6 `tower_*` tables → facts, real metric units (hours/minutes/ratio), value_source=tenant_file.
- `facts-from-v3.ts` — budget 08 / programs 09 / benefits SA08 → facts, value_source=synthetic, deterministic `program::<code>` keys.
- `merge-facts.ts` — precedence merge (tenant_file > v3_template > synthetic) by canonical identity; complementary metrics preserved; suppressed rows reported.
- `mart-metric-keys.ts` — shared metric vocabulary.
- `assemble-mart.ts` — facts → all 7 mart tables; ported decision-lane/value-claim semantics; realized-value gate; gaps not zeros; evidence lineage per visible value.
- `tool-identity-crosswalk.ts` — tool→program resolver from the alias table.
- `supabase/migrations/20260721160000_cio_tower_tool_identity_aliases_v1.sql` — the alias table.
- `src/scripts/tower/project-tower-mart.ts` + `project-tower-mart-write.ts` — CLI + transactional write with `ai_control_refresh_runs` tracking.
- `package.json` — `project:tower-mart` (dry-run) and `project:tower-mart:write-job` scripts.
- 45 unit tests under `src/lib/cio-tower/mart-projection/__tests__/`.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/mart-projection/__tests__/ --runInBand` — 45/45 (facts-from-tower, facts-from-v3, merge-facts, tool-identity-crosswalk, assemble-mart).
- Pass: `tsc --noEmit` — zero errors in all new files.
- Pass: end-to-end local dry-run `npx tsx src/scripts/tower/project-tower-mart.ts --tenant meridian-health --v3-dir datasets/tenant-inputs/meridian-health/standard-2026-07-v3 --dry-run --no-db` — reproduces $650M/75%-run envelope, 12 laned programs, realized $0, 15 gaps. Output reviewed by hand (not just exit code).
- Not run: live `--write` against Azure Postgres. The local/dev shell cannot reach the private VNet; the only approved write path is the governed ACA data-build job. No mart rows written by this PR.

## Rollout Plan

Merge via squash to `main`. The migration applies via the normal migration path. No product surface consumes the new mart data yet.

To actually populate the mart for a tenant (separate, gated operator step, per `docs/ops/aca-data-build-job-rule.md`):

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<approved-digest> \
  --script project:tower-mart:write-job -- \
  --tenant meridian-health \
  --v3-dir datasets/tenant-inputs/meridian-health/standard-2026-07-v3
```

The write is idempotent (full per-tenant refresh keyed by fact_key), wrapped in one transaction, and tracked by an `ai_control_refresh_runs` row (run id, tenant scope, idempotency key, row counts, status committed/failed). No surface is wired until that run's output + quality gate + human review pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified) for the code/migration; `submit-aca-operator-job.mjs` for the data build.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned at deploy; the data-build job requires a digest-pinned image.
- ACA runtime invariant: unaffected (no web runtime change).
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not yet — no surface consumes this data. Required before any Tower UI is pointed at the new mart.

## Rollback Plan

Revert the PR. The library and CLI are additive and unreferenced by any product surface; the migration adds one empty table (safe to drop). No mart rows are written by this PR, so there is no data to unwind.

## Audit Evidence

- Test run: `src/lib/cio-tower/mart-projection/__tests__/` (45/45).
- Dry-run proof artifact: `reports/tower-mart-projection-meridian-health/projection-summary.json` + `mart.json` (generated by the CLI).
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- **AI-tagged spend from V3 estimate**: in a V3-only run, AI-tagged spend shows $0 because it currently comes only from real `tower_*` telemetry (Copilot/cloud). The V3 `08.ai_tagged_budget_usd` (~$53.7M for Meridian) is not yet emitted as a labeled estimate; a follow-up can add it as a `v3_template`-priority fact that real telemetry overrides.
- **Source augmentation for agent deflection**: `tower_itsm_records` lacks eligible/ai-touched/auto-resolved volumes, so ServiceNow AI _deflection_ value can't be computed yet — the assembler emits this as a gap. Needs an agent-outcome extract added to ITSM ingest (or `ai_control_agent_outcomes` populated).
- **Alias table not seeded**: the crosswalk is empty until `cio_tower.tool_identity_aliases` is curated per tenant (e.g. `tool::github-copilot` → `program::prog-dev-productivity`). Without it, real tool telemetry stays as standalone portfolio rows rather than attaching to funded programs.
- **Fallback-visibility badge**: the Tower page's silent `towerV3RuntimeView` file-based fallback (when mart data is incomplete) still needs a visible "reading from reference pack, not governed mart" indicator — deferred to a follow-up UI change.
- **The `tool_identity_key` dedup fix** in `TowerIndexPage.tsx:6776-6797` (display-name merge of two mart tables) is now moot at the facts layer once the mart is populated from this projection, but the existing UI-layer dedup should be retargeted to the canonical key in a follow-up.
