# 2026-06-18-deliverable-worker-event-trigger — KEDA event-triggered deliverable worker (cron fallback)

## Release ID

`2026-06-18-deliverable-worker-event-trigger`

## Status

`released`

## Plain-English Summary

Strategic Moves deliverable generation is enqueue-only: the web app drops a `deliverable_runs` row (status `queued`) and a background worker drains it. That worker was a **cron job that only ran every 20 minutes**, so after clicking Generate a user could sit at "Queued — waiting for the generation worker" for up to 20 minutes before the build even started. That's unacceptable for demo/client readiness — generation should feel active within seconds.

This change adds an **event-triggered worker** (`job-abarva-deliv-worker-event`) that uses a KEDA PostgreSQL scaler to watch the `deliverable_runs` queued count and scale the worker **0→1 within ~30 seconds** of a run being enqueued. The original 20-minute cron job (`job-abarva-deliv-worker`) is **kept as a fallback safety net**. The worker claims rows atomically (`FOR UPDATE SKIP LOCKED`), so the cron and event workers are safe to run concurrently.

**Verified live (First Capital, 2026-06-18):** enqueued a P1 Charter run via "Approve & Build"; the event job auto-started (`job-abarva-deliv-worker-event-b2q58`, Running) ~20–30s later — confirming the scaler reaches the control DB, reads the queue depth, and scales in. Queued→claimed went from "up to 20 min" to ~30s.

## Layer Impact

- **`global-control-lane`** — control-plane runtime infrastructure (an Azure Container Apps Job in the shared `cae-abarva-scale-lab-eastus` environment). Affects how *all* tenants' deliverable generation jobs are picked up; no per-client data or schema change.

## Client Applicability

- All clients: **Yes** — shared worker for all tenants' deliverable generation.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `infra/azure/deliverable-worker-event-job.yaml` — codified definition of the event-triggered job (Event trigger, KEDA `postgresql` scale rule on `SELECT count(*) FROM deliverable_runs WHERE status = 'queued'`, `targetQueryValue=1`, `minExecutions=0 / maxExecutions=1`, `pollingInterval=30`, connection via the existing `azure-postgres-control-database-url` Key Vault secret, same UserAssigned identity / registry / env / command as the cron job).
- Applied live with: `az containerapp job create -n job-abarva-deliv-worker-event -g rg-abarva-controlplane-lab-eastus --yaml infra/azure/deliverable-worker-event-job.yaml`.
- `scripts/deploy/update-worker-jobs.sh` — reusable command that updates BOTH worker jobs (cron + event) to a given image; tolerant of a missing job.
- `.github/workflows/aca-main-deploy.yml` — new "Update worker jobs to the new image" step runs that script every release with the digest-pinned image, so the worker jobs track `main` automatically (closes the web/worker staleness gap).
- No application-code change. The cron job `job-abarva-deliv-worker` is unchanged (retained as fallback).

## QA / Validation

- **PASS** — Job provisioned: `provisioningState=Succeeded`, `triggerType=Event`, scale rule `postgresql`, min 0 / max 1 / poll 30s.
- **PASS** — Live end-to-end: enqueue (generate-phase → 202) → event job execution auto-started ~20–30s later (`...-event-b2q58`, Running) → worker drained the queue. No cron wait.
- **PASS** — `scripts/deploy/update-worker-jobs.sh` run live: updated both cron + event jobs to the current web digest.
- **PASS** — Concurrency safety verified by design: worker uses `claimNextDeliverableRun` with `FOR UPDATE SKIP LOCKED`; cron + event workers cannot double-process a row.

## Rollout Plan

Already applied to the lab control-plane environment via `az containerapp job create` (additive — the cron job is untouched, so there is no window where the queue is undrained). No image rebuild required; the event job runs the same worker image as the cron job.

## Rollback Plan

`az containerapp job delete -n job-abarva-deliv-worker-event -g rg-abarva-controlplane-lab-eastus`. The cron fallback (`job-abarva-deliv-worker`, */20) immediately resumes as the sole drainer — no queue is lost (rows stay `queued` until a worker claims them).

## Audit Evidence

- Live job: `job-abarva-deliv-worker-event` in `rg-abarva-controlplane-lab-eastus` / env `cae-abarva-scale-lab-eastus`.
- Execution proving auto-scale: `job-abarva-deliv-worker-event-b2q58` (started 2026-06-18T21:10:12Z, Running) following a `generate-phase` 202 enqueue ~30s earlier.
- Codified spec: `infra/azure/deliverable-worker-event-job.yaml`.

## Known Gaps

- **Worker image lifecycle — ADDRESSED in this change.** `aca-main-deploy.yml` now runs `scripts/deploy/update-worker-jobs.sh` after the web deploy, updating both worker jobs to the same digest-pinned image every release, so the worker tracks `main` automatically. Both jobs were also brought current immediately (from `web:main-ac6b4095` → the live `62e1b213` digest). Remaining nicety: the jobs are still defined out-of-IaC (this YAML is the reproducible spec); codifying both in Bicep is an optional future cleanup.
- Neither worker job is in Bicep yet; this YAML is the reproducible definition but is not auto-applied by a pipeline.
- KEDA reachability to the control DB is proven in the lab env; if the env's VNet/private-DB topology changes, re-verify the scaler can still connect.
