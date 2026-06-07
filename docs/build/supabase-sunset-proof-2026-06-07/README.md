# Supabase Sunset Proof — 2026-06-07

Evidence for the Supabase -> Azure cutover (b1). **POST-DELETION UPDATE**: the
former Supabase project `abarva` / `xtbymdryojmvoulaotce` was deleted through the
Supabase dashboard on 2026-06-07. This proof pack now records both the gates that
passed before deletion and the gates that were still incomplete when deletion was
recorded.

> Guardrail deviation: earlier evidence was collected under a no-pause/no-delete
> rule. The dashboard deletion has now occurred, so rollback cannot depend on the
> former Supabase project remaining available.

## Image under test

`acrabarvalab001.azurecr.io/abarva/web@sha256:9c5bf5dbe1ece82285cde254de636251ac31068b4aacab5c8c3305af90f3b547`
(tag `cutover-main-20260607-43839a41c`), built from merged `main` @ `43839a41c`
(includes the gate fixes #3242 and the `.dockerignore` build-fix #3244). Pinned by
digest onto all 4 cutover jobs.

## Gate results (2026-06-07 ~03:50Z, via Azure Container Apps operator jobs)

| Gate                                   | Status      | Evidence                                                                |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| Private DB connectivity                | ✅          | operator proof `10.43.1.4` / `abarva_control`                           |
| **Data drain parity** (Supabase→Azure) | ✅          | drain-apply `ok:true`; all tables `skipped-parity-or-ahead`             |
| **Search index parity**                | ✅          | search-verify `azure_search_backfill_verified`, all tenants match       |
| **Supabase final backup**              | ✅          | all tables → blob `supabase-final-backups/supabase-final-20260607-001/` |
| Supabase freeze (read-only)            | ⚠️ BYPASSED | dashboard deletion occurred before a recorded pause QA pass             |
| Signed-in Claude QA (PR #3243)         | ⛔ PENDING  | needs Clerk session; `ai_egress_audit.provider=anthropic`               |
| Azure-only soak                        | ⛔ PENDING  | not started                                                             |
| Supabase project deletion              | ✅ RECORDED | project `abarva` / `xtbymdryojmvoulaotce` deleted through dashboard     |

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

## What remains before sunset-ready

1. Merge + signed-in QA of the Anthropic provider migration (PR #3243):
   confirm Claude Sentinel/Source answers + `ai_egress_audit.provider=anthropic`.
2. Azure Container Apps smoke + signed-in QA pass → only then DNS.
3. Azure-only soak pass → only then remove Vercel production.
4. Review the dashboard deletion as a post-gate deviation and verify that no
   runtime/env/rollback path still depends on `xtbymdryojmvoulaotce`.

Supabase has been deleted. It was not available in this proof pack as a paused
rollback source after the deletion event was recorded.

## Cross-reference

Full step-by-step log: `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`.
