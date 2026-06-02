# Disaster Recovery Runbook

## Purpose

Use this runbook when AbarVa must recover a production or pilot environment
after an availability, deployment, database, configuration, or provider
failure. Disaster recovery is a controlled operational event: protect client
data, preserve evidence, restore the smallest safe surface, validate before
reopening, and communicate only confirmed facts.

For pre-pilot tabletop practice across Vercel, model-provider, Azure region,
and key-person continuity scenarios, use
`docs/runbooks/disaster-scenario-drills.md`.

This runbook defines pilot-ready recovery objectives. They are operating
targets, not contractual service levels, until a signed client agreement and
fresh restore evidence say otherwise.

## Recovery Objectives

| Surface | Pilot RPO target | Pilot RTO target | Validation evidence |
| --- | --- | --- | --- |
| Static app assets and runtime release | No client data loss expected; recover from Git commit and Vercel deployment history | 1 hour for rollback or redeploy | PR, commit SHA, deployment id, post-deploy smoke |
| Azure/Postgres client data plane | 1 hour, subject to verified backup/PITR posture for the affected database | 4 hours to restore service or approved read-only mode | PITR drill report, restore timestamp, row-count and client-scope checks |
| Auth/session provider outage | No app-owned client data loss expected | 4 hours to restore normal access or declare provider dependency | Provider status, Clerk config evidence, route/auth smoke |
| Optional AI, email, billing, analytics providers | No client data mutation without explicit recovery approval | 1 business day or graceful degradation | Provider status, feature flag or degradation evidence |

If current evidence cannot prove the target, lower the claim. Say "restore
evidence pending" instead of promising an RPO/RTO that has not been tested.

## Severity

| Severity | Trigger | First response target |
| --- | --- | --- |
| DR-1 | Production unavailable for all clients, confirmed client data loss, failed restore, or security incident requiring destructive containment | 15 minutes |
| DR-2 | One or more pilot clients blocked on a core workflow, database degraded, provider outage with client impact, or rollback required | 30 minutes |
| DR-3 | Preview, internal admin, optional provider, or non-critical degradation with no client data risk | 1 business hour |

## Roles

- Recovery commander: owns severity, recovery path, client scope, and reopen
  decision.
- Technical lead: owns diagnosis, restore, rollback, and validation.
- Data lead: owns backup/PITR evidence, `clients` / `client_id` scoping,
  row-count checks, and data-integrity signoff.
- Scribe: records timeline, commands, outputs, screenshots, deployment ids, and
  residual risk.
- Client/legal owner: approves external notice, client updates, and any data
  loss language.

## First Hour

1. Open a recovery thread with severity, start time, affected clients, affected
   surfaces, suspected cause, and known evidence links.
2. Freeze risky changes: pause deploys, ingestion jobs, backfills, agent runs,
   and manual admin writes that can change affected client data.
3. Preserve evidence before cleanup: PR, commit SHA, deployment id, request ids,
   logs, screenshots, affected `client_id` values, audit rows, backup status,
   provider status, and timestamps.
4. Decide the narrowest safe recovery path:
   - Vercel rollback or redeploy for runtime regressions.
   - Feature flag, route disable, or protected read-only mode for partial
     degradation.
   - Azure/Postgres PITR restore only when database recovery is required and
     approved.
   - Provider failover or graceful degradation for optional services.
5. Assign owners for restore, validation, communication, and evidence capture.
6. Set the next internal update time before starting recovery work.

## App Runtime Recovery

Use the rollback runbook for release-caused failures:

```bash
npm run crawl:post-deploy
```

Record the deployment id before and after rollback or redeploy. Do not reopen a
client-facing surface until the affected route/API smoke passes and the recovery
commander approves.

## Database Recovery

Never improvise a destructive database restore. Use the DB migration runbook for
any migration, repair, or data-plane write.

For Azure/Postgres PITR planning or drills, use the verified script:

```bash
npm run azure:postgres:pitr-drill -- --minutes-ago 10
```

Execute a restore only after approval from the recovery commander and data lead:

```bash
npm run azure:postgres:pitr-drill -- --execute --delete-after --report /tmp/abarva-pitr-drill.json
```

Before promoting or depending on a restored database:

- Confirm restore target, restore time, elapsed seconds, and network posture.
- Compare expected row counts for affected client-scoped tables.
- Run client-scope checks using canonical `clients` / `client_id` identifiers.
- Confirm no newer valid client writes would be lost, or document the approved
  loss window.
- Keep the original database read-only or preserved until evidence is reviewed.

## Degraded Mode

Use degraded mode when a full restore is slower than safely serving read-only or
cached views. The degradation must be explicit: no silent writes, no partial
client data mutation, and no raw infrastructure errors in client responses.

For Postgres disruption smoke coverage, use the verified script:

```bash
npm run azure:postgres-disruption:smoke -- --dry-run
```

For a live target, provide the approved base URL and drill token:

```bash
npm run azure:postgres-disruption:smoke -- --base-url https://example.com --token "$DRILL_TOKEN"
```

## Validation Checklist

- [ ] Affected client surfaces load or intentionally show approved degraded
  state.
- [ ] Auth and role gates still enforce the expected client scope.
- [ ] No cross-client data visibility is observed.
- [ ] Database restore or rollback evidence is attached.
- [ ] RPO is calculated from last known good write to restored point.
- [ ] RTO is calculated from incident start to validated recovery.
- [ ] Any lost, replayed, or manually repaired data is listed with owner and
  approval.
- [ ] `npm run release:check -- --base origin/main --head HEAD` passes when code
  or release records are part of the recovery PR.

## Client Communication

Use plain English and separate known facts from active investigation.

Minimum client-impacting update:

- What happened and when it started.
- Which client surfaces were affected.
- Whether client data was unavailable, delayed, altered, or lost.
- Current status: contained, degraded, restoring, or recovered.
- Recovery objective and current evidence against it.
- Client action required, if any.
- Next update time.

Do not claim "no data loss" until the data lead has attached restore, row-count,
and client-scope evidence.

## Evidence To Attach

- Incident or recovery thread link.
- Severity, affected clients, and owner list.
- PR, commit SHA, deployment id, and rollback/redeploy evidence.
- Azure/Postgres PITR plan or restore report.
- Provider status screenshots or incident ids.
- Command output for smoke tests and validation checks.
- RPO/RTO calculation with timestamps.
- Client notice draft and approval.
- Known residual risk and follow-up owner.

## Out Of Scope

- This runbook does not implement private data-plane restore automation.
- This runbook does not authorize destructive database operations.
- This runbook does not replace the incident-response, rollback, or DB migration
  runbooks.
- This runbook does not create client contractual SLAs.
- This runbook does not approve direct production row edits outside a reviewed
  repair plan.
