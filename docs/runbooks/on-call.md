# On-Call Runbook

## Purpose

This runbook defines lightweight pilot-stage on-call coverage for AbarVa. It is
not a staffed enterprise NOC. It is the operating rhythm for founder-led
response until a formal rotation exists.

## Coverage Model

| Period | Coverage |
| --- | --- |
| Pre-pilot / internal demo | Best-effort business-hours monitoring |
| Active pilot business hours | Named primary owner and backup owner |
| Active pilot critical events | Time-boxed heightened watch during workshops, data loads, demos, and releases |

## Roles

- Primary: watches alerts, triages first, and opens incidents.
- Backup: takes over if primary is unavailable for 30 minutes on SEV-1 or 60
  minutes on SEV-2.
- Release owner: remains reachable for two hours after production deploy.
- Client owner: handles client-facing updates after founder/legal approval.

## Daily Pilot Check

- [ ] Production health and recent deploy status.
- [ ] Failed GitHub Actions on main.
- [ ] Vercel deployment errors.
- [ ] Post-deploy crawl or production-readiness gate results.
- [ ] Auth/Clerk anomalies.
- [ ] Data-plane/ingestion failures if a pilot load is active.
- [ ] Any client-reported issue awaiting response.

## Escalation

Escalate to SEV-1 when there is confirmed or probable client data exposure,
auth bypass, production outage, destructive data mutation, or regulated-data
exposure.

Escalate to SEV-2 when a core pilot workflow is degraded, a release gate fails
after deploy, or a high-risk AI output reaches a client-facing approval/export
surface.

Use the incident response runbook once severity is declared.

## Handoff

Each handoff must include:

- Current severity.
- Affected route/client/surface.
- Last known good deploy or commit.
- Open PRs/rollbacks.
- Next action and owner.
- Evidence links.

## End Of Watch

Before ending heightened watch, confirm:

- No active SEV-1/SEV-2 incident.
- Latest production deployment is known.
- Any failing checks are assigned.
- Client-facing commitments have an owner and due time.
