# Pressure Test Harness

Status: candidate
Owner: AbarVa operations
Backlog rows: T151, T152, T153, T154, T155, T156, T157, T159, T160

## Purpose

This runbook turns the pressure-test backlog into executable profiles. It does not claim that the live tests have already passed. It defines how to run each profile, what evidence to capture, and how to decide whether a row is complete.

Use with:

- `docs/runbooks/load-profile-and-slo-plan.md`
- `docs/runbooks/backend-load-regression-gate.md`
- `docs/runbooks/top-user-journey-load-tests.md`
- `docs/runbooks/hot-path-optimization.md`
- `scripts/load/pressure-test-matrix.mjs`
- `npm run load:pressure-matrix`

## Completion Rule

Do not mark T151-T157 Done from this harness alone. A row moves to Done only after a live run evidence packet exists with:

- environment and base URL,
- deployment commit SHA,
- exact command,
- authenticated persona/session method,
- duration and concurrency,
- latency/error/cost summary,
- related Azure/Vercel/database dashboards,
- pass, pass-with-caveat, fail, or rerun decision,
- follow-up owner for each failure.

Rows T159 and T160 remain In progress until the evidence is repeated after major releases and SLO/SLA numbers are based on observed runs.

## Profiles

| Row | Profile | Command source | Completion evidence |
| --- | --- | --- | --- |
| T151 | `pilot-baseline-10-user-soak` | `npm run load:pressure-matrix -- --profile T151 --dry-run` | 10 users for 1 hour, route-level p95/error table, no unhandled 5xx. |
| T152 | `year-one-50-user-soak` | `npm run load:pressure-matrix -- --profile T152 --dry-run` | 50 users for 24 hours, DB pool stability, Azure dependency latency, queue backlog. |
| T153 | `llm-stream-burst-10` | `npm run load:pressure-matrix -- --profile T153 --dry-run` | 10 simultaneous streams, provider latency/errors, AI egress cost audit. |
| T154 | `parallel-document-upload-50` | `npm run load:pressure-matrix -- --profile T154 --dry-run` | 50 parallel files, Blob/ADLS handoff, malware scan handoff, parse/quarantine outcome. |
| T155 | `db-pool-sizing` | `npm run load:pressure-matrix -- --profile T155 --dry-run` | max connections, pool wait, timeout count, recommended pool/pgbouncer settings. |
| T156 | `cold-start-primary-routes` | `npm run load:pressure-matrix -- --profile T156 --dry-run` | 10 cold-ish samples, warm steady-state comparison, route-level cold-start table. |
| T157 | `token-runaway-1m` | `npm run load:pressure-matrix -- --profile T157 --dry-run` | cost cap, alert/degraded-mode event, AI egress audit, safe stop message. |

## Live Run Evidence Packet

Save evidence outside the public repo unless it is intentionally scrubbed. Recommended folder:

```text
pressure-test-evidence/
  YYYY-MM-DD-profile-name/
    command.txt
    summary.json
    dashboards.md
    failures.md
    decision.md
```

The summary should include:

- profile name,
- base URL,
- client or demo tenant,
- authenticated user/persona,
- commit SHA,
- duration,
- concurrency,
- request count,
- 2xx/3xx/4xx/5xx count,
- p50/p95/p99,
- highest-latency routes,
- token/cost totals for agent profiles,
- database and queue saturation observations.

## Go / No-Go Rules

| Profile group | Go | No-go |
| --- | --- | --- |
| Baseline and year-1 soak | No unhandled 5xx, p95 within accepted target, no auth flapping. | unexplained 5xx, session instability, DB pool exhaustion, data-integrity risk. |
| LLM stream and token runaway | cost caps and audit metadata visible, safe fallback copy appears. | uncontrolled spend, missing audit, provider errors without user-safe handling. |
| Upload storm | every file lands in the correct client prefix or quarantine path. | cross-client path risk, missing malware handoff, lost files, silent parse failure. |
| Cold start | cold and warm measurements separated and documented. | route cold starts exceed target with no mitigation owner. |

## Operating Notes

- Run dry-run first. It prints commands and evidence requirements without generating load.
- Use authenticated sessions for meaningful pilot evidence.
- Do not run destructive profiles against production without founder approval and a rollback owner.
- Attach evidence to the tracker note before marking any pressure-test row Done.
- T158 remains blocked until the live runs identify the top three hot paths to optimize.
