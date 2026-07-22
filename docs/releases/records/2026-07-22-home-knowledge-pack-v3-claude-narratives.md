# 2026-07-22-home-knowledge-pack-v3-claude-narratives — Home Knowledge Pack v3 schema + wired Claude narrative generation

## Release ID

`2026-07-22-home-knowledge-pack-v3-claude-narratives`

## Status

`candidate`

## Plain-English Summary

Two changes shipped together because the second exists to prove the first is real, not aspirational.

**1. Wires the `--use-claude` flag in `build-home-knowledge-pack-v2.mjs`, which has existed since PR #5250 but was a no-op** — it set metadata fields (`claude_model`, `use_claude_requested`) and never called the Anthropic API. This adds a real `client.messages.create()` call using forced tool-use (matching the existing pattern in `scripts/knowledge/generate-home-cxo-insight-pack.mjs`), producing the five narrative sections (`enterprise_brief`, `operating_model`, `relationship_map`, `use_cases`, `evidence_boundary`) and per-use-case strategy fields (`industry_pattern`, `client_context_signal`, `why_now`, `operating_model_change`, `change_strategy`, `readiness_barrier`, `evidence_gate`, `priority_rationale`, `module_next_step`) that `buildPromptPacket()` already specified as `required_output_contract` but nothing ever fulfilled. The default model (`claude-opus-4-20250514`) was also dead — it 404s as deprecated — fixed to `claude-opus-4-8`, matching the sibling script's default.

**2. Adds the `home_knowledge_pack_v3_enrichment` migration**, extending the v2 schema (`20260721183000_home_knowledge_pack_v2.sql`) with typed storage for the CXO-quality content a stricter tenant-pack generation prompt now requires: executive takeaways, next-evidence requests, enterprise-model items (office segmentation, divisions, capabilities, ownership), operating-model items (value streams, workforce roles, managed-service dependencies, bottlenecks), unified strategic narratives (industry movements, new ways of operating, change theses — one table, `narrative_type` distinguishes them since their shape overlaps ~80%), per-dimension visual specifications (primary/secondary), human-readable relationship-path explanations, and cross-module (Intelligence/Moves/Source/Tower) implications. Plus three columns on existing tables: `home_knowledge_dimensions.strategic_interpretation`/`evidence_gap_summary`, `home_knowledge_use_cases.category`/`office_segment`, `home_knowledge_packs.unresolved_questions`.

**Root cause this closes:** the v2 pack builder scaffolded a Claude integration contract (`buildPromptPacket`'s `required_output_contract`, the `narrative_sections` merge structure, the `useClaude`/`--model` args) but the actual API call was never written, so all five tenants' currently-populated narrative content is either hand-authored upstream (Meridian, via a separate one-off `generate-home-knowledge-design-contract-pack.mjs` pipeline) or deterministic template pass-through (the other four tenants). This PR makes `--use-claude` do what its name says, and gives the next generation pass (the stricter, schema-constrained per-tenant prompt) somewhere typed to land its output instead of overflowing into untyped JSONB catch-alls.

## Layer Impact

- `client-data-lane`: Adds 8 new `public.home_knowledge_*` tables and 3 columns to existing tables, all additive, cascade-deleted from `home_knowledge_packs`.
- `global-control-lane`: Wires a real (previously no-op) Anthropic API call into an offline operator script. No runtime/live-request-path change — `scripts/` is outside the `NO_DIRECT_MODEL_SDK_OUTSIDE_EGRESS` architecture rule's scope, confirmed against `scripts/audit/architecture-rules.mjs`'s `RUNTIME_RE`, and matches the existing pattern in three sibling `scripts/knowledge/*` scripts that already call `@anthropic-ai/sdk` directly.

## Client Applicability

- All clients: schema is tenant-scoped and additive; every tenant's Home Knowledge Pack can use the new tables once populated.
- Internal only: the builder script and its Claude call are operator tooling, run offline, not on any live request path.
- Feature flag: None. Runtime Home rendering is unaffected until a future PR wires the new tables into the read path.

## Changes Included

- `supabase/migrations/20260722020000_home_knowledge_pack_v3_enrichment.sql` (new)
- `scripts/knowledge/build-home-knowledge-pack-v2.mjs` (adds `callClaudeForPack`, `claudeSystemPrompt`, `claudeNarrativeTool`, `mergeClaudeNarrativesIntoPack`; makes `normalizePack` async; fixes the dead default model)

## QA / Validation

- `pass` — `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- `pass` — `npx eslint scripts/knowledge/build-home-knowledge-pack-v2.mjs` (clean)
- `pass` — Regression: `node scripts/knowledge/build-home-knowledge-pack-v2.mjs --tenant=meridian-health` (no `--use-claude`) produced identical output shape to pre-change baseline: `19 dimensions / 3627 rows / 5 use cases / 12 evidence sources / 51 nodes / 37 edges`, `validation_status='pass'`, no warnings — confirms zero behavior change on the existing (non-Claude) path.
- `pass` — Live integration test: `node scripts/knowledge/build-home-knowledge-pack-v2.mjs --tenant=meridian-health --use-claude` (real Anthropic API call, `claude-opus-4-8`) succeeded, all 5 use cases matched back to source records by name, `quality.claude_use_case_match: "5/5"`, no warnings.
  - **Caveat, verified directly**: the returned narrative text was byte-for-byte identical to Meridian's pre-existing `narrative_sections` in `design-contract-pack.json`. `buildPromptPacket()` feeds the existing narrative back into the model under the same field names the tool schema requests, so this test proves the wiring doesn't corrupt existing good content — it does not prove the pipeline generates good content from scratch. A clean test requires a tenant without pre-existing hand-authored narrative (Airline or Lakeshore), not yet run.
- `pass` — Schema migration verified against a real Postgres instance (`nexus-home-pack-v2-pg`, a pre-existing local container already carrying the applied v2 schema): all 8 new tables created, all 3 new columns added with correct types/constraints, re-run confirmed fully idempotent (`already exists, skipping` on every object, zero errors).
- `blocked` — `npm run db:migrate:dry`: `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com` — expected, the Azure Postgres target is private-VNet-only and unreachable from this sandbox; the `migration-drift-pr.yml` CI check is authoritative for this migration against the real target.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge and deploy through the normal ACA lane; the migration applies through the existing governed lab database migration workflow (same path PR #5250 used). This PR does not populate any new tables or run the enrichment generation for any tenant — it ships the capability. The actual multi-call, schema-constrained tenant-pack generation (executive brief, enterprise/operating model, industry/change/use-case, dimension/visual/relationship — one Claude call per scope, one tenant at a time, starting with Airline as the cleanest test case) is separate follow-on work against this schema, not part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy workflow after merge.
- Shared runtime mutators: None — additive schema only, no runtime behavior change.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Migration applies through the existing lab database migration workflow; no new worker image.
- Feature/env flag update path: None.
- Live signed-in proof required: No — no runtime-visible change in this PR. The next PR that reads these tables into Home rendering will need one.

## Rollback Plan

Runtime rollback: revert to the previous ACA revision (no runtime behavior changes in this PR to roll back). Schema rollback: the migration is purely additive (new tables, new nullable/defaulted columns) — no data loss risk to existing v2 tables from a revert. The Claude-call wiring is inert unless `--use-claude` is explicitly passed; existing deterministic-only invocations are unaffected.

## Audit Evidence

- Local Postgres migration verification: applied against `nexus-home-pack-v2-pg` (already running v2 schema), confirmed idempotent re-run.
- Live Claude integration test output: `reports/home-knowledge-pack-v2/meridian-health/home-knowledge-pack-v2.json` (generated during this PR's QA, not committed — contains the tool-use response confirmed identical to pre-existing narrative content, see caveat above).

## Known Gaps

- The new v3 tables are not yet populated for any tenant, and nothing in the runtime read path (`HomeKnowledgeDesignContractSurface.tsx`) consumes them yet — this PR is schema + generation-capability only.
- The `--use-claude` integration has not been proven to generate good content from a cold start (no pre-existing narrative to lean on). Next step: run the scoped Executive Brief + Enterprise/Operating Model call against Airline Demo specifically, since it has no prior hand-authored content and the richest source corpus, before running any tenant end-to-end.
- The stricter, schema-constrained per-scope generation prompt (executive takeaways, industry movements, change theses, dimension visual specs, relationship-path explanations, cross-module implications) is not yet implemented — only the original five-narrative + use-case-enrichment contract that already existed in `buildPromptPacket()` is wired. Populating the new v3 tables requires new prompt/tool-schema work per scope (A, B/C, E/F/G, I/J/K, M), one Claude call per scope per tenant, per the reviewed execution order (Airline → FS Demo → Retail → Lakeshore → Meridian regenerated last to unify onto one common generator).
