# Incident Response Runbook

## Purpose

Use this runbook when AbarVa detects or receives a report of a security,
privacy, availability, tenant-isolation, data-integrity, or AI-output incident.
It is written for pilot readiness: preserve evidence first, contain safely,
communicate truthfully, and only claim resolution after validation.

## Severity

| Severity | Trigger | First response target |
| --- | --- | --- |
| SEV-1 | Confirmed cross-client data exposure, credential compromise, production outage, destructive data mutation, or regulated-data exposure | 15 minutes |
| SEV-2 | Probable security control failure, failed tenant isolation check, production degradation, failed release with user impact, or high-risk AI output reaching a client workflow | 30 minutes |
| SEV-3 | Internal-only defect, non-production exposure, failed guardrail with no client impact, or suspicious but unconfirmed signal | 1 business hour |

## First Hour

1. Open an incident thread with owner, severity, start time, affected surface,
   client scope, and known evidence links.
2. Freeze risky changes: pause deploys, ingestion jobs, agent runs, or admin
   actions that can worsen the incident.
3. Preserve evidence before cleanup: PR, commit, deployment id, request ids,
   logs, screenshots, affected client ids, audit rows, and timestamps.
4. Contain using the narrowest safe action: feature flag, route disable,
   rollback, credential rotation, queue pause, or data-plane access block.
5. Assign roles:
   - Incident commander: owns decisions and status.
   - Technical lead: owns diagnosis and containment.
   - Scribe: records timeline and evidence.
   - Client/legal owner: drafts external notices if needed.

## 72-Hour Notification Clock

Start the 72-hour notification clock when there is a reasonable basis to believe
client confidential data, credentials, regulated data, or cross-client records
were accessed, exposed, altered, or exfiltrated without authorization.

Within the clock:

1. Identify affected clients and data classes.
2. Record what is known, unknown, and still under investigation.
3. Notify counsel before external notice.
4. Prepare client notice with incident window, affected systems, containment,
   client actions, and next update time.
5. Keep raw speculation out of client notices; include only confirmed facts and
   clearly labeled open questions.

## Containment Checklist

- [ ] Stop or roll back the suspected deployment.
- [ ] Disable affected feature flag or route if rollback is slower.
- [ ] Pause affected worker, queue, ingestion, or agent workflow.
- [ ] Rotate exposed credentials or revoke stale sessions.
- [ ] Confirm tenant/client scope using `client_id` and canonical client key.
- [ ] Preserve audit and telemetry before deleting or reprocessing anything.
- [ ] Validate with focused tests or deployed-preview checks before reopening.

## Communication Cadence

| Audience | Cadence | Content |
| --- | --- | --- |
| Internal incident thread | Every 30 minutes for SEV-1, hourly for SEV-2 | Status, owner, next action, blockers |
| Anand/founder | At severity declaration, containment, resolution, postmortem | Plain-English impact and risk |
| Client contact | After counsel/founder approval for client-impacting incidents | Confirmed facts, action taken, next update |

## Resolution Criteria

Do not close the incident until:

- Root cause or current best explanation is documented.
- Containment action is complete.
- A regression test, smoke test, or manual verification proves the failure no
  longer reproduces.
- Audit evidence is attached to the release/incident record.
- A follow-up issue exists for any permanent fix not completed during response.

## Post-Incident Review

Within two business days, write a short review with:

- Timeline.
- Impacted clients and surfaces.
- Root cause.
- What detected it.
- What slowed response.
- Code, test, runbook, or monitoring changes.
- Owner and due date for each follow-up.
