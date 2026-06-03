# Top User Journey Load Tests

Backlog row: T150
Owner: AbarVa operations
Cadence: before each first-client pilot release candidate, after major app shell changes, and before publishing SLO/SLA commitments

## Purpose

T150 is the repo-side harness for the top 5 user journeys. It complements the
primary-surface load smoke by exercising multi-step, role-shaped paths instead
of isolated routes.

The harness is non-destructive by default. It uses read-heavy page/API steps
and does not approve gates, create Source events, upload files, or mutate
client records. Stateful write, upload, and document-storm tests are tracked by
separate backlog rows.

## Top 5 User Journeys

| Journey                       | Primary user  | Coverage                                             |
| ----------------------------- | ------------- | ---------------------------------------------------- |
| `home-insight-command-center` | all users     | Home, queue, notifications.                          |
| `intelligence-grounded-query` | operator      | Intelligence Ask plus tenant-corpus query.           |
| `moves-approval-audit`        | client admin  | Programs, approval queue, and approval audit export. |
| `source-event-room`           | sourcing lead | Source workspace and work-item API.                  |
| `tower-value-portfolio`       | executive     | Tower portfolio and value-state API.                 |

## Local Contract Check

Run the dry-run verifier before changing the harness:

```bash
npm run load:top-journeys:check
```

The check proves:

- all five journeys are registered,
- the workload is marked non-destructive,
- the manual workflow exists,
- the release record names T150,
- the runner parses the standard options and emits a dry-run report.

## Live Run

Use the manual GitHub workflow:

```bash
gh workflow run top-user-journey-load.yml \
  -f environment=staging \
  -f duration_seconds=300 \
  -f concurrency=10 \
  -f p95_target_ms=8000 \
  -f require_2xx=true
```

Use `azure-lab` for FakeClient/private-lab rehearsals and `production` only
after the release manager approves the production load window.

## Required Secrets

| Environment | Base URL secret       | Cookie secret                   |
| ----------- | --------------------- | ------------------------------- |
| staging     | `STAGING_BASE_URL`    | `STAGING_TOP_JOURNEY_COOKIE`    |
| azure-lab   | `AZURE_LAB_BASE_URL`  | `AZURE_LAB_TOP_JOURNEY_COOKIE`  |
| production  | `PRODUCTION_BASE_URL` | `PRODUCTION_TOP_JOURNEY_COOKIE` |

The cookie must belong to a test account with the roles needed for the selected
journeys. For the default full workload, use a client-admin test account with
access to Home, Intelligence, Moves, Source, Tower, and Admin approvals.

## Evidence Packet

Each live run should attach:

- workflow run URL,
- environment and deployment SHA,
- command inputs,
- authenticated account role,
- total attempts and failed statuses,
- global p50/p95/max latency,
- per-journey p95 latency,
- per-step failed statuses,
- pass/fail/caveat decision,
- follow-up ticket for any journey above target.

## T150 Completion Rule

T150 is complete when this harness and runbook merge. T151/T152/T153/T154
remain separate execution rows because they require real duration, concurrency,
streaming, and upload evidence against FakeClient/pre-prod or production.
