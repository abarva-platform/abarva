# Key-Person Risk and Continuity Runbook

Status: candidate
Owner: AbarVa operations
Audience: founder, client sponsor, legal reviewer, backup operator
Backlog task: T046

## Purpose

AbarVa is founder-led. Enterprise buyers will ask what happens if the founder
is unavailable during a pilot. This runbook defines the continuity promise that
can be referenced in an SOW without overstating the current staffing model.

Pair this with:

- `docs/pilot/SUPPORT-MODEL.md`
- `docs/runbooks/disaster-scenario-drills.md`
- `docs/runbooks/incident-response.md`
- `docs/runbooks/on-call.md`

## Continuity Principle

No recurring pilot workflow should depend on one person being awake. Founder
judgment remains central for product and customer relationships, but routine
operations must have documented runbooks, access paths, escalation rules, and
backup coverage.

## Coverage Model

| Function | Primary owner | Continuity path |
| --- | --- | --- |
| Client executive communication | Founder | Named backup operator sends status notes from approved templates. |
| Incident command | Founder | Backup operator opens incident thread and escalates to contracted SRE. |
| Production rollback | Founder / technical lead | Runbook-driven Vercel rollback with smoke evidence. |
| Azure data-plane issue | Founder / data lead | Data lead follows Azure outage and integrity steps in disaster drill runbook. |
| Security or legal notice | Founder / legal owner | Counsel or contracted DPA/security analyst reviews wording before external notice. |
| Weekly pilot report | Founder | Template can be filled by fractional PM or backup operator from dashboard evidence. |

## SOW Commitment Language

Use this wording as the starting point for pilot SOWs:

> AbarVa will maintain documented operating runbooks for incident response,
> rollback, data-plane recovery, access review, and pilot reporting. AbarVa
> will identify a backup operator for pilot-critical communications and
> operational coordination if the founder is unavailable for more than seven
> calendar days. Customer-facing commitments remain governed by the pilot
> support model and any mutually agreed service levels.

Do not promise 24x7 founder availability. Do not promise named employees that
are not yet retained. Do not promise automated failover unless the actual
customer architecture has been tested.

## Unavailability Trigger

Activate this runbook when any of the following are true:

- founder is unreachable during a P1 incident escalation window,
- founder is unavailable for more than seven calendar days,
- founder cannot attend a scheduled executive review and no customer-safe
  reschedule exists,
- a legal/security deadline will be missed without backup action.

## First 24 Hours

1. Name backup operator and scribe.
2. Confirm client(s), surface(s), and commitments affected.
3. Review open incidents, open P1/P2 issues, and active pilot milestones.
4. Send client-safe status note if any external commitment is at risk.
5. Freeze non-essential production changes unless already approved.
6. Confirm access to Vercel, GitHub, Clerk, Azure, PagerDuty or equivalent,
   and customer communication channel.
7. Write an evidence note with actions taken and unresolved gaps.

## First 7 Days

| Day | Action |
| --- | --- |
| 1 | Confirm operational ownership and customer communication path. |
| 2 | Review open PRs, deployments, incidents, and runbook commitments. |
| 3 | Reconcile pilot milestones and update the customer sponsor. |
| 4 | Verify access reviews and secret/key custody are intact. |
| 5 | Run a focused health check on active pilot workflows. |
| 6 | Prepare a founder-return or continued-backup plan. |
| 7 | Decide whether continuity mode remains active. |

## Evidence

Continuity activation must produce:

- activation timestamp and reason,
- backup operator,
- client(s) affected,
- commitments at risk,
- actions taken,
- client communications sent,
- access gaps discovered,
- follow-up owners and due dates.

## Open Items

- Contracted SRE and DPA/security analyst must be named before pilot go-live.
- Backup operator access should be tested in a tabletop before the first live
  enterprise pilot.
- This runbook does not replace legal review of final SOW language.
