# Supabase Sunset Proof - 06 Pause QA

Date: 2026-06-07
Status: HOLD - Supabase pause QA not run
Scope: Re-run core app QA while Supabase is paused

## Gate verdict

Supabase must be paused before it is deleted. Supabase is **not sunset-ready**
until the core production app QA suite passes while Supabase is paused. If any
surface fails because Supabase is paused, deletion is blocked until the
dependency is removed or an approved rollback decision is made.

## Pause record

| Field                                     | Value     |
| ----------------------------------------- | --------- |
| Supabase project id/name                  | `PENDING` |
| Pause timestamp UTC                       | `PENDING` |
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

Any pause-window failure that is caused by Supabase being unavailable blocks
deletion. The approved response is:

1. Leave Supabase paused if the failure is non-production-impacting and can be
   fixed safely while paused.
2. Unpause Supabase only if production impact requires rollback.
3. Record the failure, root cause, fix PR, validation, and rollback decision.
4. Re-run the full pause QA matrix before requesting deletion approval again.

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

1. Supabase has not been paused for this proof.
2. Core QA has not been rerun while Supabase is paused.
3. No failure/rollback record exists because the pause test has not occurred.
