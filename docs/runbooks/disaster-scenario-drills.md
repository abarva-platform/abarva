# Disaster Scenario Drills

Status: active
Owner: AbarVa operations
Audience: founder, incident commander, technical lead, client/legal owner
Backlog task: T115 - Disaster scenarios documented + drilled

This runbook defines the tabletop drill packet for the four pilot-critical
disaster scenarios AbarVa must be ready to discuss before a paid pilot:

- Vercel outage or bad production deploy.
- Anthropic/API model-provider change, outage, or price shock.
- Azure region or client data-plane outage.
- Key-person unavailable for more than seven days.

Use this together with:

- `docs/runbooks/incident-response.md`
- `docs/runbooks/disaster-recovery.md`
- `docs/runbooks/rollback.md`
- `docs/runbooks/on-call.md`
- `docs/pilot/SUPPORT-MODEL.md`

## Operating Principle

The drill is not theater. A drill is complete only when the team can name the
incident commander, affected surfaces, containment path, recovery path,
communication owner, validation evidence, and follow-up work without inventing
new process during the event.

## Drill Cadence

| Moment | Required drill |
| --- | --- |
| Before first enterprise pilot | Run one tabletop covering all four scenarios below. |
| Before a private data-plane pilot | Repeat the Azure region/data-plane scenario with the actual pilot architecture. |
| Before any major release | Review Vercel rollback and model-provider degradation path. |
| Quarterly during active pilots | Run one scenario and attach the evidence packet to internal records. |

## Roles

| Role | Owns |
| --- | --- |
| Incident commander | Severity, scope, decision log, reopen decision, and client update timing. |
| Technical lead | Diagnosis, containment, rollback, failover, and validation. |
| Data lead | Client/data-plane scope, backup/PITR evidence, row-count checks, and data-risk language. |
| Client/legal owner | External notice, client wording, contractual interpretation, and counsel escalation. |
| Scribe | Timeline, screenshots, commands, links, decisions, and post-drill evidence packet. |
| Backup operator | Takes over if the primary founder/operator is unavailable. |

## Drill Evidence Packet

Every drill produces a short evidence packet with:

| Field | Required content |
| --- | --- |
| Scenario | One of the four scenarios below. |
| Date/time | Drill start and end time. |
| Participants | Names and roles. |
| Trigger | Simulated alert or buyer/customer report. |
| Severity | Initial and final severity with reason. |
| Affected clients/surfaces | Client scope, route/surface, provider, data-plane dependency. |
| First five actions | What the team did first. |
| Recovery path | Rollback, degradation, provider fallback, manual workaround, or restore path. |
| Validation evidence | Command, screenshot, route smoke, provider status, or restore report. |
| Client update draft | Plain-English status note if client-impacting. |
| Gaps found | Missing access, missing runbook, missing owner, unclear claim, failed validation. |
| Follow-ups | Owner, due date, and whether a PR/runbook/config change is needed. |

## Scenario 1 - Vercel Outage Or Bad Production Deploy

### Trigger

Production is unavailable, a critical route returns 5xx, Vercel reports an
incident, or a recent deploy caused a regression.

### Initial Severity

| Condition | Severity |
| --- | --- |
| All clients blocked from production | SEV-1 / DR-1 |
| One pilot workflow blocked | SEV-2 / DR-2 |
| Preview or internal-only route broken | SEV-3 / DR-3 |

### First Five Actions

1. Open incident thread and name incident commander, technical lead, scribe,
   and client/legal owner.
2. Capture affected deployment id, commit SHA, failing route, and Vercel status.
3. Freeze deploys until the commander approves the next action.
4. Decide whether to rollback, redeploy last known good, or declare degraded
   mode.
5. Run the focused route/API smoke before reopening.

### Recovery Path

| Path | Use when | Evidence |
| --- | --- | --- |
| Vercel rollback | A known prior deployment is healthy. | Deployment id before/after, route smoke, post-deploy crawl. |
| Redeploy last known good | Rollback is unavailable or ambiguous. | Commit SHA, deployment id, route smoke. |
| Degraded mode | Runtime works but one dependency fails. | Feature flag/route-disable evidence and client-safe message. |

### Validation

- Affected route loads or intentionally shows approved degraded state.
- Auth and tenant/client scope still enforce expected access.
- Production-readiness or post-deploy crawl evidence is attached.
- Client-facing message separates known facts from investigation.

### Client Update Template

"AbarVa detected a production availability issue affecting `<surface>` starting
at `<time>`. We have contained the issue by `<rollback/redeploy/degraded mode>`.
No data-loss claim is being made until validation is complete. Next update:
`<time>`."

## Scenario 2 - Anthropic/API Model-Provider Change, Outage, Or Price Shock

### Trigger

The primary model provider changes behavior, returns elevated errors, changes
pricing materially, disables a model, or rate-limits pilot workflows.

### Initial Severity

| Condition | Severity |
| --- | --- |
| High-risk approval/export workflows cannot produce safe decision support | SEV-2 |
| Optional chat or drafting is degraded but core workflow continues | SEV-3 |
| Provider behavior creates unsafe or uncited output | SEV-2 and AI-output incident review |

### First Five Actions

1. Confirm whether the issue is provider outage, model behavior drift, model
   retirement, rate limit, or cost/pricing change.
2. Freeze high-risk AI-generated approvals/exports if citations, disclaimers,
   or human-decision controls are suspect.
3. Switch to safe degradation: deterministic summaries, cached briefs,
   smaller model, or manual review path.
4. Capture provider status, request ids, model names, error rates, and impacted
   routes.
5. Decide whether client notice is needed because workflow guidance, cost, or
   availability changed.

### Recovery Path

| Path | Use when | Evidence |
| --- | --- | --- |
| Provider degradation | Model responses are unavailable or unsafe. | Feature flag or route guard, user-facing degraded copy. |
| Gateway reroute | Approved alternate model exists for the surface. | Model name, gateway config, focused output QA. |
| Manual-review mode | Consequential workflow must continue without model trust. | Human owner, evidence packet, approval note. |
| Cost-cap response | Price/rate change risks runaway cost. | Usage/cost estimate, cap decision, client notification if needed. |

### Validation

- AI outputs still include required disclaimers, citations, and human-decision
  language where applicable.
- No autonomous action is taken by an agent during the incident.
- High-risk recommendations require human approval or are disabled.
- Cost-impact note is written if pricing/rate change is the trigger.

### Client Update Template

"AbarVa is seeing degraded model-provider behavior affecting `<surface>`.
Decision-support controls remain in place. We have moved `<workflow>` into
`<degraded/manual-review/rerouted>` mode while we validate provider behavior.
No autonomous customer action has been taken."

## Scenario 3 - Azure Region Or Client Data-Plane Outage

### Trigger

A client-scoped Azure service is unavailable, a region is degraded, Postgres or
storage is unreachable, ingestion/processing stops, or the data plane cannot
serve evidence safely.

### Initial Severity

| Condition | Severity |
| --- | --- |
| Client data unavailable and core pilot blocked | DR-2 or DR-1 depending on scope |
| Data-integrity risk or suspected data loss | DR-1 |
| Ingestion delayed but read-only surfaces work | DR-3 |

### First Five Actions

1. Open recovery thread and name data lead immediately.
2. Capture affected Azure region, resource group, service, client id, and
   provider status.
3. Freeze ingestion, parsing, backfills, and data-plane writes if integrity is
   uncertain.
4. Decide whether to serve read-only/degraded mode, restore, or wait for
   provider recovery.
5. Preserve backup/PITR and row-count evidence before repair attempts.

### Recovery Path

| Path | Use when | Evidence |
| --- | --- | --- |
| Read-only mode | Reads are safe but writes/processing are risky. | Disabled write path, user message, affected client scope. |
| Provider wait with updates | Azure incident is confirmed and restore is riskier. | Azure status, next update time, client notice. |
| PITR/restore drill path | Database corruption or confirmed data loss. | Restore report, RPO/RTO calculation, row-count/client-scope checks. |
| Regional failover plan | Contract/client architecture supports it. | Region target, data replication evidence, route validation. |

### Validation

- Client scope uses canonical `clients` / `client_id` identifiers.
- No cross-client data visibility is observed.
- RPO/RTO are calculated from actual timestamps.
- Restored or degraded surfaces pass route/API checks.
- Data lead signs off before any "no data loss" statement.

### Client Update Template

"AbarVa has detected an Azure data-plane issue affecting `<client/surface>`.
We have paused `<writes/ingestion/processing>` while validating data integrity.
Current status is `<degraded/restoring/provider incident>`. We will not claim
data-loss status until backup, row-count, and client-scope checks are complete."

## Scenario 4 - Key-Person Unavailable For More Than Seven Days

### Trigger

The founder or primary operator is unavailable for more than seven days, or is
unreachable during an active SEV-1/SEV-2 event beyond the handoff threshold.

### Initial Severity

| Condition | Severity |
| --- | --- |
| Active incident and no primary operator reachable | SEV-2 operational risk, escalate to backup |
| Active pilot commitment at risk | SEV-2 operational risk |
| No active incident but coverage gap exists | SEV-3 operational risk |

### First Five Actions

1. Backup operator opens continuity thread and states coverage gap.
2. Confirm access to GitHub, Vercel, Clerk, Azure, domain/DNS, email, and
   customer-contact records.
3. Freeze discretionary deploys and non-essential risky changes.
4. Move active commitments into a written owner/time/status table.
5. Notify client/legal owner if any client commitment or incident response
   target is at risk.

### Recovery Path

| Path | Use when | Evidence |
| --- | --- | --- |
| Backup operator handoff | Backup has access and context. | Access checklist, open work table, next update time. |
| Reduced operating mode | Backup can support only critical commitments. | Frozen change list and client-safe status. |
| External specialist escalation | Security, legal, Azure, or production issue exceeds backup skill. | Specialist contact, scope, approval, evidence packet. |

### Validation

- Backup can access core systems without sharing personal credentials.
- Open PRs, deployments, incidents, and client commitments have owners.
- Critical runbooks are reachable from `docs/internal/README.md`.
- Client commitments have a truthful next update time.

### Client Update Template

"AbarVa has moved `<pilot/support/release>` into continuity coverage. Your
named contact for the next update is `<name>`. Critical support remains active;
non-critical changes are paused until coverage normalizes."

## Tabletop Facilitation Script

1. Read the scenario trigger aloud.
2. Ask the incident commander to declare severity and affected scope.
3. Ask the technical lead for first five actions.
4. Ask the data lead whether any data-loss or no-data-loss language is allowed.
5. Ask the client/legal owner to draft the first external update.
6. Ask the scribe to read back the timeline and missing evidence.
7. Score the drill and assign follow-ups.

## Scoring

| Score | Meaning |
| --- | --- |
| Green | Owner, first actions, recovery path, validation evidence, and client update were clear. |
| Yellow | Response was plausible but missing evidence, access, owner, or client wording. |
| Red | Team could not safely declare severity, contain, validate, or communicate. |

## Drill Record Template

```text
Scenario:
Date/time:
Participants:
Initial severity:
Affected clients/surfaces:
First five actions:
Containment decision:
Recovery path:
Validation evidence:
Client update draft:
Score:
Gaps found:
Follow-ups:
```

## Completion Criteria

A drill is complete when:

- The evidence packet is written.
- Each gap has an owner and due date.
- Any needed docs, configuration, code, or access follow-up has a PR, ticket, or
  named external owner.
- The next drill date is set.
- The internal knowledge base links this runbook.
