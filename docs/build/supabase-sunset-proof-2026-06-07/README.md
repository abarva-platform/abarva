# Supabase Sunset Proof — 2026-06-07

Evidence for the Supabase → Azure cutover (b1 plus production follow-up).
**NOT sunset-ready** — Supabase is live and unfrozen; this records the
data/index parity, final backup, Azure DNS cutover, and production browser QA
gates that have passed, plus the gates still pending.

> Guardrails held throughout: no Supabase pause/delete/freeze and no
> sunset-ready claim. DNS is now cut over to Azure, but Supabase remains active
> until explicit sunset approval.

## Image under test

`acrabarvalab001.azurecr.io/abarva/web@sha256:9c5bf5dbe1ece82285cde254de636251ac31068b4aacab5c8c3305af90f3b547`
(tag `cutover-main-20260607-43839a41c`), built from merged `main` @ `43839a41c`
(includes the gate fixes #3242 and the `.dockerignore` build-fix #3244). Pinned by
digest onto all 4 cutover jobs.

## Gate results (2026-06-07 ~03:50Z, via Azure Container Apps operator jobs)

| Gate                                   | Status      | Evidence                                                                 |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| Private DB connectivity                | ✅          | operator proof `10.43.1.4` / `abarva_control`                            |
| **Data drain parity** (Supabase→Azure) | ✅          | drain-apply `ok:true`; all tables `skipped-parity-or-ahead`              |
| **Search index parity**                | ✅          | search-verify `azure_search_backfill_verified`, all tenants match        |
| **Supabase final backup**              | ✅          | all tables → blob `supabase-final-backups/supabase-final-20260607-001/`  |
| Supabase freeze (read-only)            | ⏸️ DEFERRED | guardrail: a pause-equivalent; not run until explicit sunset approval    |
| Azure DNS cutover                      | ✅          | `app.abarva.ai` serves Azure Container Apps with managed certificate     |
| Signed-in production route QA          | ✅          | Home, Intelligence, Moves, Source, Tower, and Admin render for Lakeshore |
| Signed-in Claude QA (provider path)    | ⛔ PENDING  | needs provider-migration proof; `ai_egress_audit.provider=anthropic`     |

## Parity snapshot (Azure `abarva_control`, drain-confirmed)

| table                            |  Azure | Supabase (source) | parity     |
| -------------------------------- | -----: | ----------------: | ---------- |
| enterprise_context_facts         | 38,640 |            38,640 | ✅         |
| enterprise_context_records       |  3,503 |             3,503 | ✅         |
| enterprise_context_relationships |    820 |               820 | ✅         |
| enterprise_context_chunks        | 21,967 |            15,847 | ✅ (ahead) |

## Azure AI Search verified doc counts (= DB chunk counts)

apex-retail 6,497 · first-capital 400 · lakeshore-holdings 6,576 ·
meridian-health **4,376** · northstar-clinical 878 · skyharbor-air 3,240.

## Runtime Supabase-removal proof (2026-06-07, final cutover prep)

The live Azure Container App `ca-abarva-web-lab-eastus` (active revision
`--0000051`, 100% traffic, image
`acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933`)
has **no Supabase in its runtime path**, verified directly against Azure:

| Check                                           | Result                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `grep -i supabase` over container env var names | **NONE**                                                             |
| `supabase*` secret on the container app         | **NONE**                                                             |
| `DATABASE_URL` binding                          | secret ref `azure-postgres-control-database-url` (Azure Postgres)    |
| `ABARVA_DATA_PLANE`                             | `azure-postgres`                                                     |
| `/api/health` (Azure FQDN)                      | `postgres: true`, `direct_postgres: true`, `azure_graph: "postgres"` |

Supabase is **not** in any runtime env/secret/host reference and `DATABASE_URL`
is **not** pointed at Supabase. Legacy `neo4j-*` / `pinecone-api-key` secret
names remain as compatibility-era residue and are not injected as runtime env.

## What remains before sunset-ready

1. ✅ Anthropic provider configured on the active Azure revision (env +
   `anthropic-api-key` secret + image tag `…provider-anthropic…`).
   Row-level `ai_egress_audit.provider=anthropic` proof still needs a signed-in
   session (see QA doc).
2. ✅ **DNS cutover of `app.abarva.ai` → Azure** — DONE (verified ~06:19Z).
   CNAME points to Azure, custom domain bound `SniEnabled`, managed cert
   `Succeeded`, `/api/health` 200 Azure-backed, no Vercel headers. Evidence in
   `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`.
3. ✅ Signed-in production QA on `app.abarva.ai` — PASSED (operator browser test
   ~06:42Z+): `/home`, `/intelligence`, `/strategic-moves`, `/source/queue`,
   `/tower`, `/admin` render signed-in; Responsible AI acknowledgment records to
   Azure Postgres; fresh post-fix Azure logs show **0 Supabase refs, 0
   missing-column errors, 0 HTTP 500**. Evidence in
   `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`.
   Caveat: Lakeshore content is **not rich-demo-ready** (corpus/moves/substrate
   not seeded; Admin `0 records`) — a data-seeding gap, not a runtime/safety
   failure, tracked separately.
4. ⛔ Remove Vercel production (alias/domain, auto-deploys, env, project) — gate
   now reduced to: no Vercel credentials are present in this environment to
   perform it. Runbook in `FINAL_DNS_CUTOVER.md`.
5. Only after all of the above: run the Supabase freeze, then sunset.

Supabase has NOT been paused, frozen, or deleted. **No sunset-ready claim is
made.**

## Cross-reference

- Full step-by-step log: `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`.
- Final DNS cutover records + Azure target proof:
  `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`.
- Final signed-in prod QA script + Azure-backed runtime proof:
  `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`.
- Release record:
  `docs/releases/records/2026-06-07-final-azure-cutover-vercel-shutdown.md`.
