# 2026-07-22-home-knowledge-pack-v4-brief-model — Home Knowledge Pack v4 brief model + generation

## Release ID

`2026-07-22-home-knowledge-pack-v4-brief-model`

## Status

`candidate`

## Plain-English Summary

The redesigned Enterprise Brief template ("Home Enterprise Brief (offline)") binds to ~9 authored content structures that neither the v2 base schema nor the v3 enrichment produced. This adds typed storage for them, wires the offline generator to author them, and pins a field contract so the design's view-model and the pack's columns stop being a moving target.

New v4 tables: `home_knowledge_executive_read` (archetype, one-sentence, tension headline, proven strengths, structural constraints, industry-force ↔ tenant-reality paired lists, leadership-sequence horizons, context-confidence, data-foundation summary), `home_knowledge_pack_tier` (thin/partial/rich load tier + activation conditions, so one template serves a rich tenant and a thin tenant honestly), `home_knowledge_ai_readiness` (per-dimension readiness scores, each requiring a stated basis), and `home_knowledge_dimension_module_implications` (per-dimension Intelligence/Moves/Source/Tower implications — v3's equivalent was pack-level only).

The generator (`build-home-knowledge-pack-v2.mjs --use-claude`) now authors all four via an extended tool schema, and two grounding rules are enforced in code, not just prose: an AI-readiness score with no `basis` is dropped; a strength must carry evidence refs. Proven cold-start against SkyHarbor/Airline (a tenant with no pre-authored narrative): archetype, one-sentence grounded in its real 613 systems / 2,278 relationships, honest 42% confidence, evidence-backed strengths, forces↔reality paired 6-and-6, tier "partial", 5 grounded readiness scores, 8 per-dimension implications.

## Layer Impact

- `client-data-lane`: 4 additive `public.home_knowledge_*` tables, all cascade-deleted from `home_knowledge_packs`, tenant-scoped.
- `global-control-lane`: extends the offline generator's tool schema, prompt, and DB write path. No runtime/live-request-path change. Also adds a design field-contract doc.

## Client Applicability

- All clients: schema is tenant-scoped and additive; every tenant's pack can use the new tables once (re)generated with `--use-claude`.
- Internal only: generator + prompt are offline operator tooling.
- Feature flag: None. Runtime Home rendering is unaffected until a future PR reads these tables into the redesigned surface.

## Changes Included

- `supabase/migrations/20260722140000_home_knowledge_pack_v4_brief_model.sql` (new — 4 tables)
- `scripts/knowledge/build-home-knowledge-pack-v2.mjs` (extended tool schema + system prompt for executive_read/tier/ai_readiness/dimension_module_implications; brief-model merge + normalization + DB write path; in-code grounding filters; use-case name/positional matching hardening; default `max_tokens` 8000→12000; **overclaim ban added to the prompt** — forbids "proven"/"value is real"/"fully loaded"/"realized savings"/"achieved ROI"/"production-ready" as assertions and requires synthetic-scenario qualifiers, per the 2026-07-22 design review; the dead default model was already fixed in the prior PR)
- `docs/design/home-enterprise-brief-field-contract.md` (new — binding→column map, generation-proof, visual/chart recommendations, and the **exhibit data contract** mapping each of the 2026-07-22 review's six signature exhibits to EXISTS/PARTIAL/GAP data status, so Design doesn't build exhibits ahead of their data)

## QA / Validation

- `pass` — `node --check` + `npx eslint` on the modified script (clean).
- `pass` — v4 migration applied + idempotent re-run verified against a real local Postgres already carrying v2+v3 (all 4 tables, correct constraints; 8 `already exists, skipping` on re-run, zero errors).
- `pass` — Deterministic regression (no `--use-claude`, real DB write): Meridian wrote identically to before (19/3627/5/12/51/37, `pass`); the 4 new v4 tables correctly stayed **empty** (no fabricated executive content on the non-Claude path).
- `pass` — Live cold-start generation against SkyHarbor/Airline (real Anthropic call, `claude-opus-4-8`, DB write): `executive_read` populated (archetype, one-sentence citing real 613/2278 counts, tension, 42% confidence, evidence-backed strengths, forces↔reality paired 6-and-6); `pack_tier` = partial/"Broad inventory, thin proof"; `ai_readiness` = 5 rows each with a basis; `dimension_module_implications` = 8 rows. This is the honest cold-start test the earlier Meridian run couldn't be (Meridian had pre-authored narrative to echo).
- `warn` (honest, expected) — SkyHarbor use-case *enrichment* reports `0/8`: its source pack labels all 8 use cases identically "AI opportunity", and Claude authored 7 real distinct ones, so no truthful name/positional mapping exists. Confirmed via instrumented run (`claudeUCs=7 srcUCs=8`). This is an upstream source-data fix (real use-case names), not a generator defect; the warning correctly refuses to fabricate a mapping. The v4 brief-model content is unaffected.
- `blocked` — `npm run db:migrate:dry`: Azure Postgres target is private-VNet-only, unreachable from this sandbox; the `migration-drift-pr.yml` CI check is authoritative for the migration against the real target.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge and deploy through the normal ACA lane; the migration applies through the governed `db-migration-lab.yml` lane (mode=status → mode=apply + confirm=APPLY), same path as v3. This PR ships schema + generation capability; it does not (re)populate any tenant. Populating the v4 tables for real tenants (starting with a clean cold-start tenant — Airline or Lakeshore — not Meridian) is the next material step, run offline through the operator job, written as `candidate` for review before approval.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: None — additive schema, no runtime behavior change.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Migration application: through `db-migration-lab.yml` (separately dispatched, `mode=apply` + `confirm=APPLY`), not auto-run on deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No — no runtime-visible change in this PR. The PR that reads these tables into the redesigned Home surface will need one.

## Rollback Plan

Runtime rollback: revert to the previous ACA revision (no runtime behavior change here). Schema rollback: additive only (4 new tables) — a revert loses no v2/v3 data. The generation additions are inert unless `--use-claude` is passed; deterministic-only invocations are unaffected and leave the v4 tables empty.

## Audit Evidence

- Local Postgres migration verification against `nexus-home-pack-v2-pg` (v2+v3 already applied), idempotent re-run confirmed.
- Live cold-start generation output inspected directly in the local DB (executive_read / pack_tier / ai_readiness / dimension_module_implications for SkyHarbor).
- Field contract + visual recommendations: `docs/design/home-enterprise-brief-field-contract.md`.

## Known Gaps

- v4 tables not yet populated for any tenant; nothing in the runtime read path consumes them yet — schema + generation-capability only.
- SkyHarbor source pack has placeholder use-case names ("AI opportunity" ×8) — a source-data correction, tracked separately; blocks only use-case enrichment for that one tenant, not the v4 brief model.
- Two design bindings remain unmodeled by choice pending a decision (see the field-contract doc §4): `constraints[].blocks` (which use-case each enterprise constraint blocks) and curated section-level stat cards. Recommend modeling `blocks`, deriving raw stats client-side.
