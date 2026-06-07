# Supabase Sunset Proof - 06 Pause QA

Date: 2026-06-07
Status: SUPERSEDED - Supabase deleted externally; post-delete QA passed
Scope: Re-run core app QA while Supabase is paused/deleted

## Gate verdict

Supabase was deleted externally through the Supabase dashboard after the
operator reported the project was in read-only mode and pre-delete proof had
passed. This agent did not pause Supabase. Post-delete Azure runtime QA is
recorded here and in `09-post-delete-cleanup.md`.

## Pause record

| Field                                     | Value                                                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase project id/name                  | `xtbymdryojmvoulaotce` / `abarva`                                                                                                                                               |
| Pause timestamp UTC                       | Not recorded; dashboard showed read-only mode before deletion                                                                                                                   |
| Pause operator                            | External operator via Supabase dashboard                                                                                                                                        |
| Azure-only production revision under test | `ca-abarva-web-lab-eastus--provqa`                                                                                                                                              |
| Rollback window / restore option          | Native dump `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump`, SHA-256 `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b` |

## Required QA matrix

| Surface                 | Required checks                                                                                                                            | Evidence                                   | Status |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------ |
| Home                    | Public home route responds, branding/assets load, no Supabase log references                                                               | Public `/` HTTP 200; signed-in QA HTTP 200 | PASS   |
| Intelligence / Sentinel | Authenticated route loads, tenant-specific intelligence retrieval works from Azure data/search, no generic answer where loaded fact exists | Signed-in QA HTTP 200                      | PASS   |
| Nexus / Moves           | Strategic Moves list/detail/new flows load from Azure Postgres; edit rights follow tenant-member rule; no Supabase fallback                | Signed-in `/strategic-moves` HTTP 200      | PASS   |
| Source                  | Source events/artifacts/canvas load from Azure stores; uploads or write flows target Azure-only lanes if enabled                           | Signed-in `/source` HTTP 200               | PASS   |
| Tower                   | Portfolio/control tower surfaces load from Azure Postgres; metrics and app state are present                                               | Signed-in `/tower` HTTP 200                | PASS   |
| Setup / Admin           | Admin setup/data trust/connector surfaces load; no write path attempts Supabase                                                            | Signed-in `/admin` HTTP 200                | PASS   |

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

1. Pause timestamp is not recorded in this proof pack because deletion occurred
   externally through the Supabase dashboard.
2. This is post-delete QA, not pause-window QA.
3. Vercel env cleanup remains unverified from this agent.
