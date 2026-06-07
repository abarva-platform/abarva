# Supabase Sunset Proof - 06 Pause QA

Date: 2026-06-07
Status: NOT RUN - source project deleted before pause QA
Scope: Re-run core app QA while Supabase is paused

## Gate verdict

The former Supabase project `abarva` / `xtbymdryojmvoulaotce` was deleted through
the dashboard before pause QA was recorded in this proof pack. The original
pause-before-delete control can no longer be executed against that project; keep
this file as an audit gap and run Azure-only QA/restore drills against approved
Postgres backup targets instead.

## Pause record

| Field                                     | Value     |
| ----------------------------------------- | --------- |
| Supabase project id/name                  | `abarva` / `xtbymdryojmvoulaotce` |
| Pause timestamp UTC                       | `NOT RECORDED BEFORE DELETION` |
| Pause operator                            | `PENDING` |
| Azure-only production revision under test | `PENDING` |
| Rollback window / restore option          | `PENDING` |

## Required QA matrix

| Surface                 | Required checks                                                                                                                            | Evidence     | Status  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------- |
| Home                    | Public home route responds, branding/assets load, no Supabase log references                                                               | Not attached | BLOCKED |
| Intelligence / Sentinel | Authenticated route loads, tenant-specific intelligence retrieval works from Azure data/search, no generic answer where loaded fact exists | Not attached | BLOCKED |
| Nexus / Moves           | Strategic Moves list/detail/new flows load from Azure Postgres; edit rights follow tenant-member rule; no Supabase fallback                | Not attached | BLOCKED |
| Source                  | Source events/artifacts/canvas load from Azure stores; uploads or write flows target Azure-only lanes if enabled                           | Not attached | BLOCKED |
| Tower                   | Portfolio/control tower surfaces load from Azure Postgres; metrics and app state are present                                               | Not attached | BLOCKED |
| Setup / Admin           | Admin setup/data trust/connector surfaces load; no write path attempts Supabase                                                            | Not attached | BLOCKED |

## Failure policy

Historically, any pause-window failure caused by Supabase being unavailable
would have blocked deletion. Post-deletion, use this response pattern for any
Azure-only or restore-drill failure:

1. Keep runtime pointed at Azure/Postgres or the approved restore target.
2. Do not attempt rollback to the deleted `xtbymdryojmvoulaotce` project.
3. Record the failure, root cause, fix PR, validation, and rollback decision.
4. Re-run the full Azure-only QA matrix before changing DNS or removing Vercel
   production.

## Command patterns

```bash
# Core runtime smoke.
npm run azure:cutover:runtime-smoke

# Product-route QA should be run with approved production personas and no
# secret values printed in logs.
npm run qa:atlas-prod-comprehensive
```

Use the route-specific QA scripts where available and attach logs or screenshots
that redact tokens and session identifiers.

## Blockers

1. Supabase was not paused for this proof before deletion.
2. Core QA was not rerun while Supabase was paused.
3. No failure/rollback record exists because the pause test did not occur.
4. The deleted project is no longer available as a live pause/rollback target.
