# 2026-05-26-packet-24-substrate-loader — Packet 24 Multi-Tenant Substrate Loader

## Release ID

`2026-05-26-packet-24-substrate-loader`

## Status

`candidate`

## Plain-English Summary

Ships the loader that turns dataset files into Supabase rows. Run for Northstar (option (a) selected by user). Successfully loaded 720 of 720 corpus chunks into `enterprise_context_chunks` with real OpenAI embeddings (1536-dim), provenance written to `ai_egress_audit`. Closes the substrate gap that prevented Sentinel from grounding in Northstar facts. Phase 1 (source files) skipped due to UUID FK constraint on `source_id`. Phase 3 (applications) discovered an additional CHECK constraint on `deployment_model` — fix queued for follow-up. The demo-critical path is unblocked.

## Layer Impact

- `agent-reasoning-lane`: enterprise_context_chunks now has 720 Northstar-scoped rows with embeddings, so Sentinel `searchCorpus` can return tenant-specific patterns at retrieval time.
- `client-data-lane`: 720 new rows in enterprise_context_chunks scoped to client_id `2702b525-4c6a-4fbe-973d-99a8480d8318` (Northstar MedTech). Plus 720 audit rows in `ai_egress_audit` documenting each embedding call. No other tenants affected.
- `ops-release-lane`: adds `scripts/seed/load-tenant-substrate.ts`. Parameterized by `TENANT_KEY` env var. Self-contained embedding (OpenAI direct + Azure fallback + deterministic fallback). Idempotent via delete-then-insert per phase.

## Client Applicability

- All clients: no
- Specific clients: Northstar Clinical Tech (loaded this PR). Apex / Meridian / First Capital substrates remain at their prior state — loader will be re-run for them next.
- Internal only: no — passes through to production Supabase
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/seed/load-tenant-substrate.ts` — loader (TypeScript via tsx)
- `docs/build/PACKET_24_TENANT_SUBSTRATE_LOADER.md` — spec + run plan + Packet 25 forward-look
- PR: this PR

## QA / Validation

- Dry-run mode: **passed** — correctly identified 96 source files, 720 chunks, 240 apps in the Northstar dataset
- Live run against prod Supabase: **passed** — 720 chunks inserted + embedded
- Post-run audit (`node scripts/audit/db-substrate-audit.mjs`): **passed** — Northstar `enterprise_context_chunks` shows `720/720`
- Embedding provider verification: confirmed via `ai_egress_audit` rows with `provider='openai-embeddings-openai'` and `model='text-embedding-3-large'`
- Sentinel re-run verification: **in progress** — task bfypf4ewv kicked off to re-run STRESS_TENANT=northstar and confirm agent now produces substantive Northstar-grounded answers
- Lint / typecheck on loader source: **not run** — `.ts` script invoked via tsx, no compile output

## Rollout Plan

Merge to `main`. Production Vercel deploy fires (no app code changed so the deploy is a no-op for runtime behavior).

Next steps (sequenced, all auto-fix-eligible):
1. Fix Phase 3 applications `deployment_model` CHECK constraint — probe valid values, update mapper
2. Add Phases 4-5 (initiatives, vendor_contracts) once their CHECK/FK shapes are known
3. Loop loader for Meridian (320 chunks expected) and First Capital (400 chunks expected) — same script, different `TENANT_KEY`
4. Top up Apex with the 1,000+ rows still missing across applications + initiatives + contracts (`enterprise_context_chunks` already at 280)
5. Packet 25: rebind `/admin/context-layer` to live data instead of `northstar-read-model.ts` mock

## Rollback Plan

Revert this PR (removes the loader script + Packet 24 doc). The 720 loaded chunks remain in Supabase — they can be cleaned with: `DELETE FROM enterprise_context_chunks WHERE client_id = '2702b525-4c6a-4fbe-973d-99a8480d8318'`. The `ai_egress_audit` rows are append-only audit history and should be preserved per policy.

## Audit Evidence

- 720 chunk rows in `enterprise_context_chunks` with `embedding_status='embedded'` and `embedding_model='text-embedding-3-large'`
- 720 corresponding rows in `ai_egress_audit` with `workflow='substrate-loader-embed'` and `provider='openai-embeddings-openai'`
- Pre-load audit: `audit-artifacts/full-module-stress-northstar-2026-05-26T06-54/` showed canned errors
- Post-load audit: task `bfypf4ewv` will produce the comparison report

## Known Gaps

- **Phase 1 (enterprise_context_source_files) skipped** due to UUID FK constraint on `source_id`. Provenance preserved in chunks' `source_doc` / `source_record_id` / `source_path` columns. Source-file pages in `/admin/context-layer` will synthesize file rollups from distinct chunk `source_doc` values.
- **Phase 3 (applications) failed** — `deployment_model` has a CHECK constraint with stricter accepted values than the dataset uses. Loader logged the error and continued; 240 application rows still need loading via a follow-up patch that probes the CHECK enum.
- **Phases 4-5 (initiatives, vendor_contracts) not yet implemented** in the loader — placeholder phase stubs only. The pattern from Phase 3 generalizes once the CHECK constraints are mapped.
- **Packet 25 (real-data provenance UI binding)** is deferred. `/admin/context-layer/page.tsx` still reads from `northstar-read-model.ts` mock constants. The demo can either lean on the mock (it's polished) or push Packet 25 through next.
- Task #17 (third-generation tenant-bleed via `ai_egress_audit`) remains open.
