# Production Azure Schema Repair and Browser QA

Date: 2026-06-07
Status: PASS for signed-in route rendering; DATA RICHNESS GAPS REMAIN

## Scope

This proof records the production Azure Container Apps follow-up after DNS moved
`app.abarva.ai` to Azure. The active production runtime was healthy, but signed-in
browser QA initially hit a Responsible AI acknowledgment ledger block and Azure
logs showed live schema drift on columns/tables already expected by the deployed
application.

No source-code migration was authored here. The repair applied existing,
already-versioned migrations to Azure Postgres through the running Azure
Container Apps revision so the production schema matches the deployed app.

## Production target

| Field           | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| URL             | `https://app.abarva.ai`                                          |
| Container App   | `ca-abarva-web-lab-eastus`                                       |
| Resource group  | `rg-abarva-controlplane-lab-eastus`                              |
| Active revision | `ca-abarva-web-lab-eastus--0000051`                              |
| Data plane      | Azure Postgres, `abarva_control`, private address `10.43.1.4/32` |

## Issue observed before repair

| Check                         | Observation                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Responsible AI acknowledgment | Browser showed: `The acknowledgment ledger is unavailable. Access remains paused until the system can record the acceptance evidence.` |
| App logs                      | `column "function_pack_key" does not exist` in the active revision tail.                                                               |
| Later app logs                | `clients holding-group profile unavailable: column "holding_group_id" does not exist`.                                                 |

## Existing migrations applied to Azure

The following existing migrations were applied from inside the active Azure
Container Apps runtime using `src/scripts/run-migrations.ts` and the runtime
`DATABASE_URL`. No database credentials were printed.

| Migration                                                       | Purpose                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `20260522170000_engagement_function_pack_key.sql`               | Adds engagement function-pack columns expected by current app read paths.        |
| `20260602170000_responsible_ai_acknowledgments.sql`             | Creates Responsible AI acknowledgment ledger.                                    |
| `20260602173000_responsible_ai_training_completions.sql`        | Creates Responsible AI training completion ledger.                               |
| `20260602180000_responsible_ai_acknowledgment_cycles.sql`       | Adds acknowledgment-cycle support expected by the app.                           |
| `20260602183000_system_role_acknowledgments.sql`                | Creates system-role acknowledgment support.                                      |
| `20260605080000_responsible_ai_client_key_canonicalization.sql` | Canonicalizes Responsible AI client-key handling.                                |
| `20260605130000_lakeshore_holding_group_clients.sql`            | Adds holding-group client metadata and helper functions expected by policy code. |

## Schema proof after repair

| Area                                | Result                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `engagements` function-pack columns | PASS: `function_pack_key` and `function_pack_confidence` exist.                                                                                |
| Responsible AI ledgers              | PASS: `responsible_ai_acknowledgments` and `responsible_ai_training_completions` exist.                                                        |
| Responsible AI browser acceptance   | PASS: Lakeshore produced one acknowledgment row and one training row.                                                                          |
| Holding-group columns               | PASS: `clients.holding_group_id`, `holding_group_role`, `parent_client_id`, and `aggregate_visibility_level` exist.                            |
| Holding-group functions             | PASS: `can_read_holding_group_aggregate_by_id`, `can_read_holding_group_aggregate_by_key`, and `can_approve_holding_group_spawn_by_key` exist. |

Responsible AI ledger rows after browser completion:

| Ledger                                | Client key           | Rows |
| ------------------------------------- | -------------------- | ---: |
| `responsible_ai_acknowledgments`      | `lakeshore-holdings` |    1 |
| `responsible_ai_training_completions` | `lakeshore-holdings` |    1 |

## Browser QA after repair

The signed-in Chrome session was used against the production custom domain.

| Route              | Result             | Evidence summary                                                                                                        |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/home`            | PASS               | Rendered signed in as `Anand Sundaram`, tenant `Lakeshore Holdings`; no Responsible AI wall; no 500.                    |
| `/intelligence`    | PASS with data gap | Rendered Intelligence shell; showed `CORPUS NOT YET SEEDED` for Lakeshore rather than inventing figures.                |
| `/strategic-moves` | PASS with data gap | Rendered Strategic Moves shell; showed `NO MOVES YET`.                                                                  |
| `/source/queue`    | PASS               | Rendered Source queue with one decision in queue and evidence refresh warning.                                          |
| `/tower`           | PASS with data gap | Rendered Control Tower; Atlas stated evidence base is needed and metrics showed no substrate.                           |
| `/admin`           | PASS with data gap | Rendered Admin Control Center; showed `0/0 dimensions loaded`, `0 records`, `8 blocking`, and `0% assistant grounding`. |

## Log proof after repair

Log deny-list run after the final schema repair and browser route walk:

| Window                                       | Result                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Active revision tail before timestamp filter | Only stale missing-column lines from `04:17Z`, `05:15Z`, and `06:36Z` remained in the 300-line tail.       |
| Post-cutoff filter `>= 2026-06-07T06:42:00Z` | PASS: 3 log lines inspected, 0 matches for Supabase hosts/env names, HTTP 500, or missing-column patterns. |

## Non-actions

- No Supabase pause.
- No Supabase freeze.
- No Supabase delete.
- No DNS change after the already-completed Azure cutover.
- No Vercel project deletion.
- No new runtime dependency on Supabase.
- No sunset-ready claim.

## Remaining truth

The production app is now serving signed-in routes on Azure and the schema drift
found during browser QA is repaired. The browser also proves a separate data
readiness gap: Lakeshore's visible Intelligence/Home/Moves/Tower/Admin surfaces
are mostly empty or explicitly unseeded. That is not a runtime crash, but it is
not a rich demo state.

Before calling the product fully demo-ready, the Lakeshore context/corpus load
needs separate evidence at each ingestion state: committed rows, refreshed search
index, and signed-in retrieval/answer QA.
