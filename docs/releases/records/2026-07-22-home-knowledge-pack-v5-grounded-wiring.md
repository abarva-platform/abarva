# 2026-07-22-home-knowledge-pack-v5-grounded-wiring — wire next-evidence + collection routes, honest groundability audit

## Release ID

`2026-07-22-home-knowledge-pack-v5-grounded-wiring`

## Status

`candidate`

## Plain-English Summary

A groundability investigation of the source packs (ahead of a larger "v5 data gap" build) found two things that reshape the work:

1. **All eight v3 tables are orphaned** — the v3 migration (20260722020000) created schema that the generator never populates. Same for its added columns. So the "v5 gaps" are mostly *wiring existing schema*, not new tables.
2. **Half the design's requested exhibits have no source data and would fabricate if built**: front/middle/back-office segmentation (`"front office"` = 0 matches in every pack), divisions, the value-stream Sankey (Meridian's `rel` isn't an edge list; SkyHarbor's strength is ordinal, not flow volume), and the interview-signal scale heatmap (free-text quotes only, no scores). The evidence loaded→parsed→indexed→cited→agent-ready pipeline is real but owned by `src/lib/governance/context-corpus-policy.ts`, not the offline generator.

Given that, this PR ships the one fully-grounded, deterministic win and documents the rest honestly rather than building fabricated schema:

- **Wires `home_knowledge_next_evidence_requests`** (the clearest orphaned v3 table) from the source pack's already-authored `NEXT_EVIDENCE` (enterprise-level) + per-dimension `DGAPS` — a 1:1 source→table map, no model authoring, no fabrication.
- **Adds a `collection_route` column** + a deterministic dimension→route map (capability→workshop, industry→governed corpus, decision-rights→DoA docs, process→workflow data, benefits→Tower metrics + finance attestation) so a dimension zero-state gives the right route instead of a generic "upload a client export" (2026-07-22 design review #12). Industry movements route to the governed corpus, not a tenant upload.
- **Corrects the design field-contract doc**: marks the four fabrication-risk exhibits NOT-GROUNDABLE with the source evidence, corrects the earlier over-stated "EXISTS" claims (v3 tables are empty), and re-points the change-thesis exhibit at `use_cases` (populated) instead of `strategic_narratives` (orphaned).

Proven: deterministic build (no `--use-claude`) wrote 102 next-evidence requests for Meridian (94 dimension-scoped), every one with a correctly-differentiated collection route.

## Layer Impact

- `client-data-lane`: one additive nullable column on an existing v3 table.
- `global-control-lane`: deterministic generator wiring (no LLM) + a design doc correction.

## Client Applicability

- All clients: next-evidence/collection-routes populate on the normal (deterministic) build path for every tenant; no `--use-claude` needed.
- Internal only: generator + doc are operator/design artifacts.
- Feature flag: None. No runtime read-path change.

## Changes Included

- `supabase/migrations/20260722210000_home_knowledge_next_evidence_collection_route.sql` (new — one column)
- `scripts/knowledge/build-home-knowledge-pack-v2.mjs` (deterministic `buildNextEvidenceRequests` from NEXT_EVIDENCE + DGAPS; `collectionRouteFor` dimension→route map; column-map + write-path registration for `home_knowledge_next_evidence_requests`)
- `docs/design/home-enterprise-brief-field-contract.md` (groundability audit §6 + corrections to the earlier EXISTS claims)

## QA / Validation

- `pass` — `node --check` + `npx eslint` clean.
- `pass` — v5 migration applied + idempotent re-run against a real local Postgres already carrying v2+v3+v4 (`ADD COLUMN IF NOT EXISTS`, zero errors).
- `pass` — Deterministic build (no `--use-claude`, real DB write) for Meridian: `home_knowledge_next_evidence_requests` = 102 rows (94 dimension-scoped), all 102 with a `collection_route`; per-dimension routes correctly differentiated (industry→governed corpus, metrics→Tower+finance, vendors→procurement, apps→system owner, functions→workshop, risks→control owner). No regression to existing tables; validation `pass`.
- `blocked` — `npm run db:migrate:dry`: Azure target is private-VNet-only; `migration-drift-pr.yml` CI is authoritative.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge + deploy through the normal ACA lane; the migration applies through the governed `db-migration-lab.yml` lane (status → apply + confirm=APPLY), same as v3/v4. Wiring runs on the deterministic build path, so it populates for every tenant on the next generation run without a Claude call.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: None — additive column, no runtime behavior change.
- Migration application: through `db-migration-lab.yml` (`mode=apply` + `confirm=APPLY`), separately dispatched.
- Feature/env flag update path: None.
- Live signed-in proof required: No — no runtime-visible change in this PR.

## Rollback Plan

Revert the PR. The migration adds one nullable column; a revert loses no data. The generator wiring is inert on tables that don't exist and additive on ones that do.

## Audit Evidence

- Groundability investigation (source packs + generator + governance policy), summarized in the field-contract §6.
- Local DB verification: 102 next-evidence rows with differentiated routes for Meridian.

## Known Gaps

- The other seven orphaned v3 tables (`enterprise_model_items`, `operating_model_items`, `strategic_narratives`, `dimension_visual_specs`, `relationship_explanations`, `module_implications`, `executive_takeaways`) remain unpopulated. `strategic_narratives`/`dimension_visual_specs`/`relationship_explanations` are groundable (Claude-authored, a follow-up like v4's brief-model generation); the office/division/Sankey/signal-scale ones are NOT groundable from the current source and must not be wired until the source data or governance ownership exists (see field-contract §6).
- The design mockup currently renders office segmentation, divisions, a Sankey, and a signal-scale heatmap that the pack cannot back — flagged for Claude Design to mark illustrative-only, replace with the honest alternative, or schedule as real source-data work.
